import "dotenv/config";

import fs from "fs/promises";

import { extractCvText } from "./services/cvExtractor.js";
import { evaluateCvAgainstJob } from "./services/cvEvaluator.js";

const cvPath = process.argv[2];

if (!cvPath) {
  console.error(
    "Usage: node testCvEvaluator.js <path-to-cv>"
  );

  process.exit(1);
}

const jobTitle = "Senior React Developer";

const jobDescription = `
We are looking for a Senior React Developer.

Requirements:

- 4+ years of software development experience
- Strong React and JavaScript knowledge
- Experience with Node.js
- Experience with REST APIs
- Experience with MongoDB
- Good understanding of Git
- Experience with Tailwind CSS is a plus
- Experience with AWS is a plus
`;

try {
  console.log("Reading CV...");

  const cvText = await extractCvText(cvPath);

  console.log(
    `CV contains ${cvText.length} characters.`
  );

  console.log("\nSending CV to AI...\n");

  const result = await evaluateCvAgainstJob({
    cvText,
    jobDescription,
    jobTitle,
  });

  console.log(
    "\n========== AI EVALUATION ==========\n"
  );

  console.log(
    JSON.stringify(result, null, 2)
  );

  console.log(
    "\n====================================\n"
  );
} catch (error) {
  console.error(
    "\nCV evaluation failed:"
  );

  console.error(error);
}