import fs from "fs";
import path from "path";
import Application from "../models/Application.js";

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Deletes applications that have been "rejected" for 10+ days, along with
 * their CV file — but ONLY when that CV was uploaded specifically for this
 * application (path starts with /uploads/cvs/). CVs applied via the
 * candidate's saved "CV library" (/uploads/cvs-library/) are never deleted
 * here, since that same file may still be used elsewhere or kept by the
 * candidate for future applications.
 */
export async function cleanupRejectedApplications() {
  try {
    const cutoff = new Date(Date.now() - TEN_DAYS_MS);

    const toDelete = await Application.find({
      status: "rejected",
      rejectedAt: { $lte: cutoff },
    });

    if (toDelete.length === 0) return;

    for (const app of toDelete) {
      // Remove the application-specific CV file (not a saved-library CV)
      if (app.cvUrl && app.cvUrl.startsWith("/uploads/cvs/")) {
        const filePath = path.join(process.cwd(), app.cvUrl);
        fs.promises.unlink(filePath).catch(() => {
          // File may already be gone — not a problem, keep going.
        });
      }

      await Application.deleteOne({ _id: app._id });
    }

    console.log(
      `Rejected-application cleanup: removed ${toDelete.length} application(s) rejected 10+ days ago.`
    );
  } catch (err) {
    console.error("Rejected-application cleanup failed:", err.message);
  }
}

/**
 * Runs the cleanup once immediately, then every 24 hours.
 */
export function startRejectedApplicationCleanup() {
  cleanupRejectedApplications();
  setInterval(cleanupRejectedApplications, 24 * 60 * 60 * 1000);
}
