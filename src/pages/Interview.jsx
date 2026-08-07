import { useLocation, useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

// TODO: replace with your own HeyGen avatar embed URL once your account
// and free avatar are set up.
const AVATAR_EMBED_BASE = "https://embed.liveavatar.com/v1/ade12521-d2c3-45eb-aedf-8674530ca241";

export default function Interview() {
  const { id } = useParams();
  const location = useLocation();
  const job = location.state?.job;
  const applicationId = location.state?.applicationId;

  // Pass applicationId through as a query param so it's available if the
  // avatar embed supports echoing custom/session params back in webhooks.
  // Check HeyGen's embed docs for the exact supported param name and
  // adjust this if needed.
  const embedSrc = applicationId
    ? `${AVATAR_EMBED_BASE}?orientation=horizontal&custom_session_id=${applicationId}`
    : `${AVATAR_EMBED_BASE}?orientation=horizontal`;

  return (
    <>
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {!applicationId && (
          <div className="mb-6 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
            This interview wasn't started from a job application, so your
            results won't be linked to a specific application. Go back to{" "}
            <Link to="/" className="font-medium underline">
              the homepage
            </Link>{" "}
            and apply to a job to start a linked interview.
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Avatar */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <iframe
              src={embedSrc}
              allow="microphone"
              title="AI Interviewer"
              className="h-[650px] w-full border-0"
            />
          </div>

          {/* Interview Panel */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <h1 className="text-3xl font-bold">AI Interview</h1>

            {job && (
              <p className="mt-2 text-lg text-gray-600">
                {job.title} at {job.company}
              </p>
            )}

            <p className="mt-4 text-gray-600">
              Speak naturally with the AI interviewer. It will ask
              questions related to this job.
            </p>

            <div className="mt-8 rounded-xl bg-gray-100 p-5">
              <h2 className="font-semibold">Instructions</h2>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>Allow microphone access.</li>
                <li>Answer each question naturally.</li>
                <li>The interview will continue automatically.</li>
                <li>
                  When you're done, your rating and summary will appear on
                  your application shortly — the admin will also see it
                  alongside your CV.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
