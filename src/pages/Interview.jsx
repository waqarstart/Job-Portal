import Navbar from "../components/Navbar";

export default function Interview() {
  return (
    <>
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Avatar */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <iframe
              src="https://embed.liveavatar.com/v1/ade12521-d2c3-45eb-aedf-8674530ca241?orientation=horizontal"
              allow="microphone"
              title="AI Interviewer"
              className="h-[650px] w-full border-0"
            />
          </div>

          {/* Interview Panel */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <h1 className="text-3xl font-bold">
              AI Interview
            </h1>

            <p className="mt-4 text-gray-600">
              Speak naturally with the AI interviewer. It will ask
              questions related to the selected job.
            </p>

            <div className="mt-8 rounded-xl bg-gray-100 p-5">
              <h2 className="font-semibold">
                Instructions
              </h2>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>Allow microphone access.</li>
                <li>Answer each question naturally.</li>
                <li>The interview will continue automatically.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}