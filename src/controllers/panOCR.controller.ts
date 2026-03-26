import { Request, Response } from "express";
import sharp from "sharp";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

async function preprocess(inputPath: string, outputPath: string): Promise<void> {
  await sharp(inputPath)
    .resize({ width: 1200 })
    .grayscale()
    .normalize()
    .sharpen()
    .toFile(outputPath);
}

export const panOCRController = async (req: Request, res: Response): Promise<void> => {
  try {
    const files =
      (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    let allExtractedText: string[] = [];

   
    for (const file of files) {
      const inputPath = file.path;
      const outputPath = `processed-${Date.now()}-${Math.random()}.jpg`;

      await preprocess(inputPath, outputPath);

      const form = new FormData();
      form.append("file", fs.createReadStream(outputPath));

      const response = await axios.post(
        "http://127.0.0.1:8000/ocr",
        form,
        { headers: form.getHeaders() }
      );

      const ocrRaw = response.data.result;

      // extract text
      ocrRaw.forEach((block: any) => {
        block.forEach((line: any) => {
          if (Array.isArray(line) && line[1]?.[0]) {
            allExtractedText.push(line[1][0]);
          }
        });
      });

      await fs.promises.unlink(inputPath).catch(() => {});
      await fs.promises.unlink(outputPath).catch(() => {});
    }

 
    const cleanedText = allExtractedText
      .map(t => t.trim())
      .filter(t => t.length > 2 && !/^[^a-zA-Z0-9]+$/.test(t));

    const fullText = cleanedText.join(" ");

    
   
let pan: string | undefined;

for (const t of cleanedText) {
  let raw = t.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Step 1: direct valid PAN
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(raw)) {
    pan = raw;
    break;
  }


  let corrected = raw.split("");

  for (let i = 0; i < corrected.length; i++) {
    if (i < 5 && corrected[i] === "8") corrected[i] = "B";
    if (i >= 5 && i < 9 && corrected[i] === "B") corrected[i] = "8";
  }

  const fixed = corrected.join("");

 
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(fixed)) {
    pan = fixed;
    break;
  }
}
   
   let name: string | undefined;

const ignoreWords = [
  "INCOME TAX DEPARTMENT",
  "GOVT.OF INDIA",
  "Permanent Account Number",
  "Permanent Account Number Card",
  "Signature",
  "Fathers Name"
];


for (let i = 0; i < cleanedText.length; i++) {
  if (/name/i.test(cleanedText[i])) {
    const next = cleanedText[i + 1];

    if (
      next &&
      /^[A-Z\s]+$/.test(next) &&   
      !/\d/.test(next)
    ) {
      name = next;
      break;
    }
  }
}

if (!name) {
  name = cleanedText.find((t, i) => {
    const text = t.trim();

    return (
      text.length > 5 &&
      /^[A-Z\s]+$/.test(text) &&
      !ignoreWords.some(word => text.includes(word)) &&
      !/\d/.test(text) &&
      i > 3 
    );
  });
} 
    let dob: string | undefined;

    
    for (let i = 0; i < cleanedText.length; i++) {
      if (/date of birth/i.test(cleanedText[i])) {
        const next = cleanedText[i + 1];
        const match = next?.match(/\d{2}\/\d{2}\/\d{4}/);

        if (match) {
          dob = match[0];
          break;
        }
      }
    }

    // fallback
    if (!dob) {
      const dobMatch = cleanedText.find(t =>
        /\d{2}\/\d{2}\/\d{4}/.test(t)
      );
      dob = dobMatch;
    }

    res.json({
      name,
      pan,
      dob
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "OCR failed",
      details: error instanceof Error ? error.message : error,
    });
  }
};