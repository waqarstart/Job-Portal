import Application from "../models/Application.js";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * When HR clicks "Remove" on a cancelled/completed interview, we don't
 * delete anything right away — we just stamp `interviewRemovalRequestedAt`
 * so the card can show a "Removed" indicator while HR still has a chance
 * to undo it. Once that stamp is 2+ days old, this job clears the
 * interview's scheduling/status fields, which drops it out of the HR
 * Interviews list (that list only shows applications with an
 * `interviewDate` set).
 *
 * The underlying job application itself, and the interview
 * transcript/summary/ratings, are left alone — this only removes it from
 * the "Interviews" section, it doesn't erase the candidate's application
 * or their evaluation history.
 */
export async function cleanupRemovedInterviews() {
  try {
    const cutoff = new Date(Date.now() - TWO_DAYS_MS);

    const toClear = await Application.find({
      interviewRemovalRequestedAt: { $exists: true, $ne: null, $lte: cutoff },
    });

    if (toClear.length === 0) return;

    for (const app of toClear) {
      app.interviewDate = undefined;
      app.interviewStatus = undefined;
      app.interviewType = undefined;
      app.interviewMode = undefined;
      app.interviewLocationDetail = undefined;
      app.interviewerCount = undefined;
      app.interviewCancelReason = undefined;
      app.interviewRemovalRequestedAt = undefined;
      await app.save();
    }

    console.log(
      `Interview-removal cleanup: removed ${toClear.length} interview(s) from the Interviews list 2+ days after HR marked them for removal.`
    );
  } catch (err) {
    console.error("Interview-removal cleanup failed:", err.message);
  }
}

/**
 * Runs the cleanup once immediately, then every 24 hours.
 */
export function startInterviewRemovalCleanup() {
  cleanupRemovedInterviews();
  setInterval(cleanupRemovedInterviews, 24 * 60 * 60 * 1000);
}
