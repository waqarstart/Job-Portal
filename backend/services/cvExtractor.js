import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { createLimiter } from "../utils/concurrencyLimiter.js";

// pdf-parse/mammoth are CPU-bound (they block the event loop while
// parsing). Capping how many run at once keeps a burst of simultaneous
// uploads/applications from freezing the whole server.
const limit = createLimiter(10);

export async function extractCvText(filePath) {
  return limit(() => extractCvTextInner(filePath));
}

async function extractCvTextInner(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  console.log(`Extracting CV text from: ${filePath}`);
  console.log(`File type: ${extension}`);

  // ─────────────────────────────────────────────
  // PDF
  // ─────────────────────────────────────────────
  if (extension === ".pdf") {
    const buffer = await fs.readFile(filePath);

    const parser = new PDFParse({
      data: buffer,
    });

    try {
      const result = await parser.getText();

      const text = result.text.trim();

      if (!text) {
        throw new Error(
          "The PDF does not contain readable text."
        );
      }

      console.log(
        `Extracted ${text.length} characters from PDF`
      );

      return text;
    } finally {
      await parser.destroy();
    }
  }

  // ─────────────────────────────────────────────
  // DOCX
  // ─────────────────────────────────────────────
  if (extension === ".docx") {
    console.log("Extracting text from DOCX using Mammoth...");

    const result = await mammoth.extractRawText({
      path: filePath,
    });

    const text = result.value.trim();

    if (!text) {
      throw new Error(
        "The DOCX file does not contain readable text."
      );
    }

    console.log(
      `Extracted ${text.length} characters from DOCX`
    );

    return text;
  }

  // ─────────────────────────────────────────────
  // Unsupported format
  // ─────────────────────────────────────────────
  throw new Error(
    `Unsupported CV format: ${extension}. Automatic evaluation currently supports PDF and DOCX.`
  );
}
