import fs from "fs";
import path from "path";

export async function analyzeWithAts({ filePath, originalName, jobDescription }) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([fs.readFileSync(filePath)]),
    originalName || path.basename(filePath)
  );
  form.append("job_description", jobDescription);
  form.append("ai", "true");

  const res = await fetch(`${process.env.ATS_API_URL}/api/v1/analyze`, {
    method: "POST",
    body: form,
  });
 if (!res.ok) {
  const body = await res.text();
  throw new Error(`ATS API responded ${res.status}: ${body}`);
}
  const data = await res.json();
  return {
    atsScore: data.ats?.score ?? null,
    jobMatchScore: data.job_match?.score ?? null,
  };
}