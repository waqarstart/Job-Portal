import express from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

import CV from "../models/CV.js";
import Application from "../models/Application.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * Same JWT check as requireAuth, but also accepts the token via a
 * `?token=` query parameter. This route is reached from plain <a href>
 * links and `window.open()` in the frontend (viewing/downloading a CV),
 * and browsers never attach a custom Authorization header to those —
 * only to fetch/axios calls. Falling back to a query param keeps every
 * existing "View CV" / "Download CV" link working exactly as before,
 * while still requiring a valid token (not just a guessable URL).
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;
  const token = bearerToken || req.query.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

/**
 * Resumes and CVs are personal documents, so unlike company logos or
 * profile pictures they must NOT be reachable by anyone who happens to
 * guess or intercept the URL. This route serves them only after checking
 * that the requester is the owner, or an admin/HR user who legitimately
 * needs to review the document (e.g. reviewing an application).
 *
 * :folder is restricted to the known private upload subfolders so this
 * can't be used to read arbitrary files elsewhere on disk.
 */
const PRIVATE_FOLDERS = ["cvs-library", "cvs", "resumes"];

// Only intercept the private folders; everything else (company media,
// profile pictures) falls through to the plain express.static handler
// mounted after this router, so public assets stay publicly reachable.
router.get("/:folder/:filename", (req, res, next) => {
  if (!PRIVATE_FOLDERS.includes(req.params.folder)) return next();
  return authenticate(req, res, () => handlePrivateFile(req, res));
});

async function handlePrivateFile(req, res) {
  try {
    const { folder, filename } = req.params;

    // filename comes from the URL path segment (not a filesystem join of
    // attacker input), but we still guard against traversal defensively.
    const safeName = path.basename(filename);
    const relativeUrl = `/uploads/${folder}/${safeName}`;
    const filePath = path.join(process.cwd(), "uploads", folder, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found." });
    }

    const isStaff = ["admin", "hr"].includes(req.user?.role);
    let authorized = isStaff;

    if (!authorized) {
      if (folder === "cvs-library") {
        const cv = await CV.findOne({ url: relativeUrl });
        authorized = !!cv && String(cv.user) === req.user.id;
      } else if (folder === "cvs") {
        const application = await Application.findOne({ cvUrl: relativeUrl });
        authorized = !!application && String(application.user) === req.user.id;
      } else if (folder === "resumes") {
        const user = await User.findOne({ resumeUrl: relativeUrl });
        authorized = !!user && String(user._id) === req.user.id;
      }
    }

    if (!authorized) {
      return res.status(403).json({ message: "You don't have access to this file." });
    }

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export default router;
