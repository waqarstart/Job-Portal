import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractCvText(filePath) {
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
