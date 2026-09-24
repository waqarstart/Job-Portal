import { useNavigate } from "react-router-dom";
import { HiOutlineUserCircle, HiOutlineXMark } from "react-icons/hi2";

// Mirrors PROFILE_COMPLETION_SECTIONS in backend/routes/dashboardRoutes.js —
// keep the keys/labels in sync with that list.
const SECTION_LABELS = {
  basicInfo: "Basic Info",
  professional: "Professional details",
  about: "About you",
  experience: "Work experience",
  skills: "Skills",
  education: "Education",
  documents: "Documents",
};

const VISIBILITY_THRESHOLD = 75;

export default function ProfileCompletionReminderModal({ percent, checklist, onClose }) {
  const navigate = useNavigate();

  const missing = Object.entries(checklist || {})
    .filter(([, done]) => !done)
    .map(([key]) => SECTION_LABELS[key] || key);

  const toGo = Math.max(VISIBILITY_THRESHOLD - percent, 0);

  function handleFinish() {
    onClose();
    navigate("/dashboard/profile");
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <HiOutlineUserCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Profile completion
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">
                Finish your profile so employers can find you
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex-none rounded-full p-1 text-gray-400 transition-colors hover:text-gray-600"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <p className="px-6 pt-3 text-sm text-gray-500">
          Your profile needs to reach {VISIBILITY_THRESHOLD}% before it appears in employer
          searches. You are at {percent}%.
        </p>

        <div className="mx-6 mt-5 border-t border-gray-100" />

        {/* Progress card */}
        <div className="mx-6 mt-5 flex items-center gap-4 rounded-xl bg-blue-50/60 p-4">
          <div className="flex-none text-center">
            <p className="text-3xl font-extrabold text-blue-600">{percent}%</p>
            <p className="text-xs text-gray-500">Profile completion</p>
          </div>
          <div className="flex-1">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
              <div
                className="absolute top-0 h-2 w-0.5 bg-amber-400"
                style={{ left: `${VISIBILITY_THRESHOLD}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {toGo > 0 ? `${toGo}% to go before you reach it` : "You're visible to employers"}
            </p>
          </div>
        </div>

        {/* Missing sections */}
        {missing.length > 0 && (
          <div className="mx-6 mt-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              Still missing
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-700">
                {missing.length}
              </span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {missing.map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700"
                >
                  <span className="h-2 w-2 flex-none rounded-full border-2 border-amber-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mx-6 mb-6 mt-6">
          <button
            type="button"
            onClick={handleFinish}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Finish my profile
            <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full text-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
