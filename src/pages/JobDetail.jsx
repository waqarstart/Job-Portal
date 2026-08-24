import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";
import { applyToJob } from "../services/applicationService";
import { getMyCVs } from "../services/cvService";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Job
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [jobError, setJobError] = useState("");

  // Application modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [step, setStep] = useState(1);

  // CVs
  const [savedCVs, setSavedCVs] = useState([]);
  const [loadingCVs, setLoadingCVs] = useState(false);

  const [cvChoice, setCvChoice] = useState("saved");
  const [selectedCVId, setSelectedCVId] = useState("");
  const [newCV, setNewCV] = useState(null);

  // Application
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState(null);
  const [applyError, setApplyError] = useState("");

  // ------------------------------------------------------------------
  // Load job
  // ------------------------------------------------------------------

  useEffect(() => {
    loadJob();
  }, [id]);

  async function loadJob() {
    try {
      setLoadingJob(true);
      setJobError("");

      const { data } = await api.get(`/jobs/${id}`);

      setJob(data);
    } catch (err) {
      console.error("Failed to load job:", err);

      setJobError(
        err.response?.data?.message ||
          "Failed to load job."
      );
    } finally {
      setLoadingJob(false);
    }
  }

  // ------------------------------------------------------------------
  // Load saved CVs
  // ------------------------------------------------------------------

  async function loadSavedCVs() {
    try {
      setLoadingCVs(true);

      const cvs = await getMyCVs();

      setSavedCVs(cvs || []);

      // Automatically select first saved CV
      if (cvs && cvs.length > 0) {
        setSelectedCVId(cvs[0]._id);
        setCvChoice("saved");
      } else {
        setSelectedCVId("");
        setCvChoice("new");
      }
    } catch (err) {
      console.error("Failed to load saved CVs:", err);

      setSavedCVs([]);
      setSelectedCVId("");
      setCvChoice("new");
    } finally {
      setLoadingCVs(false);
    }
  }

  // ------------------------------------------------------------------
  // Open application modal
  // ------------------------------------------------------------------

  async function openApplyModal() {
    setShowApplyModal(true);
    setStep(1);

    setApplyError("");
    setApplication(null);

    setNewCV(null);

    await loadSavedCVs();
  }

  // ------------------------------------------------------------------
  // Close application modal
  // ------------------------------------------------------------------

  function closeApplyModal() {
    if (submitting) return;

    setShowApplyModal(false);
    setStep(1);

    setApplyError("");
    setApplication(null);

    setNewCV(null);
  }

  // ------------------------------------------------------------------
  // Get selected saved CV
  // ------------------------------------------------------------------

  function getSelectedCV() {
    return savedCVs.find(
      (cv) => cv._id === selectedCVId
    );
  }

  // ------------------------------------------------------------------
  // Convert saved CV URL into an actual File
  // ------------------------------------------------------------------

  async function savedCVToFile(cv) {
    if (!cv?.url) {
      throw new Error(
        "The selected CV does not have a file URL."
      );
    }

    let fileUrl = cv.url;

    // If the URL is relative, use the API origin.
    if (fileUrl.startsWith("/")) {
      const baseURL =
        api.defaults.baseURL || "";

      let origin = baseURL;

      try {
        const parsed = new URL(baseURL);

        origin = `${parsed.protocol}//${parsed.host}`;
      } catch {
        origin = window.location.origin;
      }

      fileUrl = `${origin}${fileUrl}`;
    }

    console.log("Downloading saved CV:", fileUrl);

    const response = await fetch(fileUrl, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `Unable to download saved CV. Status: ${response.status}`
      );
    }

    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error(
        "The saved CV file is empty."
      );
    }

    const filename =
      cv.originalName ||
      cv.label ||
      "saved-cv.pdf";

    let mimeType = blob.type;

    if (!mimeType) {
      const lowerName = filename.toLowerCase();

      if (lowerName.endsWith(".pdf")) {
        mimeType = "application/pdf";
      } else if (lowerName.endsWith(".docx")) {
        mimeType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (lowerName.endsWith(".doc")) {
        mimeType = "application/msword";
      } else {
        mimeType = "application/octet-stream";
      }
    }

    return new File(
      [blob],
      filename,
      {
        type: mimeType,
      }
    );
  }

  // ------------------------------------------------------------------
  // New CV selected
  // ------------------------------------------------------------------

  function handleNewCVChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setNewCV(null);
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
    ];

    const extension =
      "." +
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setApplyError(
        "Only PDF, DOC or DOCX files are allowed."
      );

      setNewCV(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApplyError(
        "CV file must be smaller than 5MB."
      );

      setNewCV(null);
      return;
    }

    setApplyError("");
    setNewCV(file);
  }

  // ------------------------------------------------------------------
  // Step navigation
  // ------------------------------------------------------------------

  function nextStep() {
    setApplyError("");

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (cvChoice === "saved") {
        if (!selectedCVId) {
          setApplyError(
            "Please select a saved CV."
          );
          return;
        }
      }

      if (cvChoice === "new") {
        if (!newCV) {
          setApplyError(
            "Please select a CV file."
          );
          return;
        }
      }

      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(4);
      return;
    }

    if (step === 4) {
      setStep(5);
    }
  }

  function previousStep() {
    setApplyError("");

    if (step > 1) {
      setStep(step - 1);
    }
  }

  // ------------------------------------------------------------------
  // Submit application
  // ------------------------------------------------------------------

  async function submitApplication() {
    try {
      setSubmitting(true);
      setApplyError("");

      let cvFile = null;

      // --------------------------------------------------------------
      // New uploaded CV
      // --------------------------------------------------------------

      if (cvChoice === "new") {
        cvFile = newCV;

        if (!cvFile) {
          throw new Error(
            "Please select a CV file."
          );
        }
      }

      // --------------------------------------------------------------
      // Saved CV
      // --------------------------------------------------------------

      if (cvChoice === "saved") {
        const selectedCV = getSelectedCV();

        if (!selectedCV) {
          throw new Error(
            "Please select a saved CV."
          );
        }

        console.log(
          "Converting saved CV into File:",
          selectedCV
        );

        cvFile =
          await savedCVToFile(selectedCV);

        console.log(
          "Saved CV converted successfully:",
          cvFile.name,
          cvFile.size
        );
      }

      // --------------------------------------------------------------
      // Final validation
      // --------------------------------------------------------------

      if (!(cvFile instanceof File)) {
        throw new Error(
          "A valid CV file is required."
        );
      }

      if (cvFile.size === 0) {
        throw new Error(
          "The selected CV file is empty."
        );
      }

      console.log(
        "Submitting application with CV:",
        {
          name: cvFile.name,
          size: cvFile.size,
          type: cvFile.type,
        }
      );

      // --------------------------------------------------------------
      // Send actual file to backend
      // --------------------------------------------------------------

      const result = await applyToJob(
        id,
        cvFile
      );

      console.log(
        "Application submitted:",
        result
      );

      setApplication(result);
      setStep(5);
    } catch (err) {
      console.error(
        "Application submission failed:",
        err
      );

      setApplyError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit application."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ------------------------------------------------------------------
  // Render loading
  // ------------------------------------------------------------------

  if (loadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">
          Loading job...
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render error
  // ------------------------------------------------------------------

  if (jobError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {jobError}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Job not found.</p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Main page
  // ------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>

        {/* Job header */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {job.title}
              </h1>

              {job.company && (
                <p className="mt-2 text-lg text-gray-600">
                  {job.company}
                </p>
              )}

              {job.location && (
                <p className="mt-1 text-gray-500">
                  📍 {job.location}
                </p>
              )}
            </div>

            <button
              onClick={openApplyModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Apply Now
            </button>
          </div>
        </div>

        {/* Job details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border p-6">

              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Job Description
              </h2>

              <div className="text-gray-700 whitespace-pre-line leading-7">
                {job.description}
              </div>

            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-sm border p-6">

              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Job Details
              </h2>

              <div className="space-y-4 text-sm">

                {job.location && (
                  <div>
                    <p className="text-gray-500">
                      Location
                    </p>

                    <p className="font-medium text-gray-900">
                      {job.location}
                    </p>
                  </div>
                )}

                {job.type && (
                  <div>
                    <p className="text-gray-500">
                      Job Type
                    </p>

                    <p className="font-medium text-gray-900">
                      {job.type}
                    </p>
                  </div>
                )}

                {job.salary && (
                  <div>
                    <p className="text-gray-500">
                      Salary
                    </p>

                    <p className="font-medium text-gray-900">
                      {job.salary}
                    </p>
                  </div>
                )}

                {job.category && (
                  <div>
                    <p className="text-gray-500">
                      Category
                    </p>

                    <p className="font-medium text-gray-900">
                      {job.category}
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================
          APPLICATION MODAL
          ============================================================ */}

      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="p-6 border-b flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Apply for {job.title}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Complete the application steps below.
                </p>
              </div>

              <button
                onClick={closeApplyModal}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ×
              </button>

            </div>

            {/* Stepper */}
            <div className="px-6 pt-6">

              <div className="flex items-center justify-between">

                {[1, 2, 3, 4, 5].map(
                  (stepNumber) => (
                    <React.Fragment
                      key={stepNumber}
                    >

                      <div className="flex flex-col items-center">

                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                            stepNumber <= step
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {stepNumber}
                        </div>

                        <span className="text-xs text-gray-500 mt-2">
                          {stepNumber === 1 &&
                            "Details"}

                          {stepNumber === 2 &&
                            "CV"}

                          {stepNumber === 3 &&
                            "Review"}

                          {stepNumber === 4 &&
                            "Submit"}

                          {stepNumber === 5 &&
                            "Done"}
                        </span>

                      </div>

                      {stepNumber < 5 && (
                        <div
                          className={`h-1 flex-1 mx-2 ${
                            stepNumber < step
                              ? "bg-blue-600"
                              : "bg-gray-200"
                          }`}
                        />
                      )}

                    </React.Fragment>
                  )
                )}

              </div>
            </div>

            {/* Error */}
            {applyError && (
              <div className="mx-6 mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {applyError}
              </div>
            )}

            {/* ========================================================
                STEP 1 — DETAILS
                ======================================================== */}

            {step === 1 && (
              <div className="p-6">

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Review the position
                </h3>

                <p className="text-gray-600 mb-6">
                  You are applying for:
                </p>

                <div className="bg-gray-50 border rounded-xl p-5">

                  <h4 className="font-bold text-gray-900">
                    {job.title}
                  </h4>

                  {job.company && (
                    <p className="text-gray-600 mt-1">
                      {job.company}
                    </p>
                  )}

                  {job.location && (
                    <p className="text-gray-500 mt-1">
                      {job.location}
                    </p>
                  )}

                </div>

                <div className="flex justify-end mt-8">

                  <button
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                  >
                    Continue
                  </button>

                </div>
              </div>
            )}

            {/* ========================================================
                STEP 2 — CV
                ======================================================== */}

            {step === 2 && (
              <div className="p-6">

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Choose your CV
                </h3>

                <p className="text-gray-600 mb-6">
                  Select one of your saved CVs or upload a new one.
                </p>

                {/* Saved CV option */}
                <button
                  type="button"
                  onClick={() => {
                    setCvChoice("saved");
                    setApplyError("");
                  }}
                  className={`w-full text-left border rounded-xl p-4 mb-4 ${
                    cvChoice === "saved"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        cvChoice === "saved"
                          ? "border-blue-600"
                          : "border-gray-400"
                      }`}
                    >
                      {cvChoice === "saved" && (
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        Use a saved CV
                      </p>

                      <p className="text-sm text-gray-500">
                        Choose a CV from your CV library.
                      </p>
                    </div>

                  </div>
                </button>

                {/* Saved CV list */}
                {cvChoice === "saved" && (
                  <div className="mb-6">

                    {loadingCVs ? (
                      <div className="text-sm text-gray-500 py-4">
                        Loading your saved CVs...
                      </div>
                    ) : savedCVs.length === 0 ? (
                      <div className="border border-dashed rounded-xl p-5 text-center">

                        <p className="text-gray-600">
                          You don't have any saved CVs yet.
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                          Upload a new CV below.
                        </p>

                      </div>
                    ) : (
                      <div className="space-y-3">

                        {savedCVs.map((cv) => (
                          <button
                            key={cv._id}
                            type="button"
                            onClick={() =>
                              setSelectedCVId(
                                cv._id
                              )
                            }
                            className={`w-full text-left border rounded-xl p-4 transition ${
                              selectedCVId ===
                              cv._id
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >

                            <div className="flex items-center gap-3">

                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                  selectedCVId ===
                                  cv._id
                                    ? "border-blue-600"
                                    : "border-gray-400"
                                }`}
                              >
                                {selectedCVId ===
                                  cv._id && (
                                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                                )}
                              </div>

                              <div className="min-w-0">

                                <p className="font-semibold text-gray-900 truncate">
                                  {cv.label ||
                                    cv.originalName}
                                </p>

                                <p className="text-sm text-gray-500 truncate">
                                  {cv.originalName}
                                </p>

                              </div>

                            </div>

                          </button>
                        ))}

                      </div>
                    )}

                  </div>
                )}

                {/* New CV option */}
                <button
                  type="button"
                  onClick={() => {
                    setCvChoice("new");
                    setApplyError("");
                  }}
                  className={`w-full text-left border rounded-xl p-4 mb-4 ${
                    cvChoice === "new"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        cvChoice === "new"
                          ? "border-blue-600"
                          : "border-gray-400"
                      }`}
                    >
                      {cvChoice === "new" && (
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        Upload a new CV
                      </p>

                      <p className="text-sm text-gray-500">
                        PDF, DOC or DOCX — maximum 5MB.
                      </p>
                    </div>

                  </div>

                </button>

                {/* New CV uploader */}
                {cvChoice === "new" && (
                  <div className="mb-4">

                    <label className="block">

                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400">

                        <p className="font-medium text-gray-800">
                          Click to select your CV
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          PDF, DOC or DOCX
                        </p>

                        {newCV && (
                          <p className="mt-4 text-sm font-medium text-blue-600">
                            Selected:{" "}
                            {newCV.name}
                          </p>
                        )}

                      </div>

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={
                          handleNewCVChange
                        }
                        className="hidden"
                      />

                    </label>

                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-between mt-8">

                  <button
                    onClick={previousStep}
                    className="px-5 py-3 border rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>

                  <button
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                  >
                    Continue
                  </button>

                </div>

              </div>
            )}

            {/* ========================================================
                STEP 3 — REVIEW
                ======================================================== */}

            {step === 3 && (
              <div className="p-6">

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Review your application
                </h3>

                <p className="text-gray-600 mb-6">
                  Make sure everything looks correct before submitting.
                </p>

                <div className="space-y-4">

                  <div className="bg-gray-50 rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      Position
                    </p>

                    <p className="font-semibold text-gray-900 mt-1">
                      {job.title}
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      CV
                    </p>

                    <p className="font-semibold text-gray-900 mt-1">

                      {cvChoice === "saved"
                        ? (
                          getSelectedCV()
                            ?.label ||
                          getSelectedCV()
                            ?.originalName ||
                          "Saved CV"
                        )
                        : newCV?.name ||
                          "New CV"}

                    </p>

                  </div>

                </div>

                <div className="flex justify-between mt-8">

                  <button
                    onClick={previousStep}
                    className="px-5 py-3 border rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>

                  <button
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                  >
                    Continue
                  </button>

                </div>

              </div>
            )}

            {/* ========================================================
                STEP 4 — SUBMIT
                ======================================================== */}

            {step === 4 && (
              <div className="p-6">

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Submit application
                </h3>

                <p className="text-gray-600 mb-6">
                  Review your application and submit it when you're ready.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">

                  <p className="font-semibold text-blue-900">
                    Ready to apply?
                  </p>

                  <p className="text-sm text-blue-700 mt-1">
                    Click submit to send your application.
                  </p>

                </div>

                <div className="flex justify-between mt-8">

                  <button
                    onClick={previousStep}
                    disabled={submitting}
                    className="px-5 py-3 border rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Back
                  </button>

                  <button
                    onClick={submitApplication}
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit Application"}
                  </button>

                </div>

              </div>
            )}

            {/* ========================================================
                STEP 5 — COMPLETE
                ======================================================== */}

            {step === 5 && (
              <div className="p-6 text-center">

                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">

                  <span className="text-3xl text-green-600">
                    ✓
                  </span>

                </div>

                <h3 className="text-2xl font-bold text-gray-900 mt-5">
                  Application Submitted!
                </h3>

                <p className="text-gray-600 mt-2">
                  Your application has been successfully submitted.
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Thank you for applying. The hiring team will review your application and contact you if you are selected for the next stage.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">

                  <button
                    onClick={() =>
                      navigate(
                        "/my-applications"
                      )
                    }
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                  >
                    View My Applications
                  </button>

                  <button
                    onClick={closeApplyModal}
                    className="px-6 py-3 border rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>

                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}