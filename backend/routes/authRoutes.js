import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

const router = express.Router();

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

function makeToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

    const token = makeToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account signs in with Google. Please use \"Continue with Google\".",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = makeToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Google Sign-In: verify the ID token from Google Identity Services,
 * then find or create a matching account and issue our own JWT — same
 * response shape as /login and /register so the frontend can treat it
 * identically.
 */
router.post("/google", async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ message: "Google sign-in is not configured on the server." });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({ message: "Google account has no email." });
    }

    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }],
    });

    if (user) {
      // Link Google to an existing local account on first Google sign-in
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.authProvider = user.authProvider === "local" && user.password ? user.authProvider : "google";
        if (!user.profilePicture && payload.picture) user.profilePicture = payload.picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        authProvider: "google",
        profilePicture: payload.picture || undefined,
      });
    }

    const token = makeToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ message: "Google sign-in failed. " + err.message });
  }
});

export default router;

/**
 * Forgot password: generate a one-hour reset token, email a link.
 * Always responds the same way whether or not the email exists —
 * prevents someone probing which emails are registered.
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/**
 * Reset password: verify the token (and that it hasn't expired), set the
 * new password, and clear the token so it can't be reused.
 */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
