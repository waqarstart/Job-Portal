import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Interview() {
  const location = useLocation();

  const job = location.state?.job;
  const applicationId = location.state?.applicationId;

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const startInterview = () => {
    if (!applicationId) {
      return;
    }

    setStarted(true);
    setFinished(false);
  };

  const handleFinishInterview = () => {
    setStarted(false);
    setFinished(true);
  };

  return (
    <>
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* No application warning */}
        {!applicationId && (
          <div className="mb-6 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
            This interview wasn't started from a job application, so your
            interview won't be linked to a specific application. Go back to{" "}
            <Link
              to="/"
              className="font-medium underline"
            >
              the homepage
            </Link>{" "}
            and apply to a job to start a linked interview.
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* =========================
              LIVE AVATAR
          ========================== */}

          <div className="overflow-hidden rounded-2xl bg-black shadow-lg">

            <div className="relative w-full">

              {!started && !finished && (
                <div className="flex h-[650px] items-center justify-center bg-gray-900">
                  <div className="text-center text-white">

                    <div className="mb-4 text-5xl">
                      🤖
                    </div>

                    <p className="text-xl font-semibold">
                      AI Interviewer
                    </p>

                    <p className="mt-2 text-sm text-gray-400">
                      Ready to start your interview
                    </p>

                  </div>
                </div>
              )}

              {started && !finished && (
                <iframe
                  src="https://embed.liveavatar.com/v1/413741c3-546c-46a1-9f68-99ea869f143f?orientation=horizontal"
                  allow="microphone"
                  title="LiveAvatar Interview"
                  className="h-[650px] w-full border-0"
                  style={{
                    aspectRatio: "16/9",
                  }}
                />
              )}

              {finished && (
                <div className="flex h-[650px] items-center justify-center bg-gray-900">
                  <div className="text-center text-white">

                    <div className="mb-4 text-5xl">
                      ✅
                    </div>

                    <p className="text-xl font-semibold">
                      Interview Completed
                    </p>

                    <p className="mt-2 text-sm text-gray-400">
                      Thank you for completing your interview.
                    </p>

                  </div>
                </div>
              )}

            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 bg-gray-950 p-4">

              {!started && !finished && (
                <button
                  onClick={startInterview}
                  disabled={!applicationId}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start Interview
                </button>
              )}

              {started && !finished && (
                <button
                  onClick={handleFinishInterview}
                  className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700"
                >
                  End Interview
                </button>
              )}

              {finished && (
                <Link
                  to="/interviews"
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
                >
                  Back to Interviews
                </Link>
              )}

            </div>

          </div>

          {/* =========================
              INTERVIEW PANEL
          ========================== */}

          <div className="rounded-2xl bg-white p-8 shadow-lg">

            <h1 className="text-3xl font-bold">
              AI Interview
            </h1>

            {job && (
              <p className="mt-2 text-lg text-gray-600">
                {job.title} at {job.company}
              </p>
            )}

            <p className="mt-4 text-gray-600">
              Speak naturally with the AI interviewer. It will ask questions
              related to this job.
            </p>

            {/* Instructions */}
            <div className="mt-8 rounded-xl bg-gray-100 p-5">

              <h2 className="font-semibold">
                Instructions
              </h2>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">

                <li>
                  Click Start Interview.
                </li>

                <li>
                  Allow microphone access when prompted.
                </li>

                <li>
                  Make sure your microphone is working.
                </li>

                <li>
                  Answer each question naturally.
                </li>

                <li>
                  The AI interviewer will continue the conversation
                  automatically.
                </li>

                <li>
                  When you are finished, click End Interview.
                </li>

              </ul>

            </div>

            {/* Application information */}
            {applicationId && (
              <div className="mt-6 rounded-xl border border-gray-200 p-5">

                <p className="text-sm text-gray-500">
                  Application
                </p>

                <p className="mt-1 font-medium text-gray-800">
                  {applicationId}
                </p>

              </div>
            )}

            {/* Interview status */}
            <div className="mt-6 rounded-xl border border-gray-200 p-5">

              <p className="text-sm text-gray-500">
                Interview status
              </p>

              <p className="mt-1 font-medium capitalize text-gray-800">
                {finished
                  ? "Completed"
                  : started
                  ? "In progress"
                  : "Ready to start"}
              </p>

            </div>

            {/* Completed message */}
            {finished && (
              <div className="mt-6 rounded-xl bg-green-50 p-5 text-green-700">

                <h3 className="font-semibold">
                  Interview completed
                </h3>

                <p className="mt-1 text-sm">
                  Your interview has been completed. Your results will be
                  processed and attached to your application.
                </p>

              </div>
            )}

          </div>

        </div>

      </div>
    </>
  );
}
