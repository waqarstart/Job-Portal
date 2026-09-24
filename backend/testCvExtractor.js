import { extractCvText } from "./services/cvExtractor.js";

const filePath = process.argv[2];

if (!filePath) {
  console.error(
    "Usage: node testCvExtractor.js <path-to-cv>"
  );

  process.exit(1);
}

try {
  const text = await extractCvText(filePath);

  console.log("\n================ CV TEXT ================\n");

  console.log(text);

  console.log("\n==========================================\n");
} catch (error) {
  console.error(
    "CV extraction failed:",
    error.message
  );

  process.exit(1);
}