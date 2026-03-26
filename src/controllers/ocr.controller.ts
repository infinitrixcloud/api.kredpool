import { Request, Response } from "express";
import sharp from "sharp";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

async function preprocess(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await sharp(inputPath)
    .resize({ width: 1200 })
    .grayscale()
    .normalize()
    .sharpen()
    .toFile(outputPath);
}

export const ocrController = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

      const response = await axios.post("http://127.0.0.1:8000/ocr", form, {
        headers: form.getHeaders(),
      });

      const ocrRaw = response.data.result;

      const extractedText: string[] = [];

      ocrRaw.forEach((block: any) => {
        block.forEach((line: any) => {
          if (Array.isArray(line) && line[1]?.[0]) {
            extractedText.push(line[1][0]);
          }
        });
      });

      allExtractedText.push(...extractedText);

      await fs.promises.unlink(inputPath).catch(() => {});
      await fs.promises.unlink(outputPath).catch(() => {});
    }

    const cleanedText = allExtractedText.filter(
      (t) => t.length > 2 && !/^[^a-zA-Z0-9]+$/.test(t),
    );

    const fullText = cleanedText.join(" ");

    let aadhaar: string | undefined;

    // Step 1: find all 12-digit numbers (with or without space)
    const matches = fullText.match(/\b\d{4}\s?\d{4}\s?\d{4}\b|\b\d{12}\b/g);

    if (matches) {
      for (const m of matches) {
        const clean = m.replace(/\s/g, "");

        if (clean.length !== 12) continue;

        const isInvalidContext = cleanedText.some(
          (line) => line.includes(m) && /year|1947|pin|code/i.test(line),
        );

        if (!isInvalidContext) {
          aadhaar = clean;
          break;
        }
      }
    }

    let dob: string | undefined;

    for (let i = 0; i < cleanedText.length; i++) {
      const text = cleanedText[i];

      const match = text.match(/(\d{2})[^0-9]*(\d{2})[^0-9]*(\d{4})/);

      if (match) {
        const digits = match.slice(1).join("");

        if (digits.length !== 8) continue;

        const formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;

        const year = parseInt(digits.slice(4));
        const age = new Date().getFullYear() - year;

        if (age < 10 || age > 100) continue;
        if (/issued|aadhaar/i.test(text)) continue;

        if (/Male|Female/i.test(cleanedText[i + 1])) {
          dob = formatted;
          break;
        }

        if (!dob) dob = formatted;
      }
    }

    const genderMatch = fullText.match(/Male|Female/i);

    const name = cleanedText.find(
      (t) =>
        /^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(t) && !t.includes("Government"),
    );

    let addressLines: string[] = [];

    for (let i = 0; i < cleanedText.length; i++) {
      const line = cleanedText[i];

      if (/address|s\/o|d\/o|w\/o/i.test(line)) {
        for (let j = 0; j <= 5; j++) {
          if (cleanedText[i + j]) {
            addressLines.push(cleanedText[i + j]);
          }
        }
        break;
      }
    }

    // fallback if not found
    if (addressLines.length === 0) {
      addressLines = cleanedText.filter(
        (t) => /\d{6}/.test(t) || /maharashtra|dist|po/i.test(t),
      );
    }

    let address = addressLines.join(", ");

    address = address

      // remove Aadhaar number
      .replace(/\b\d{12}\b/g, "")

      // remove phone numbers (10 digit)
      .replace(/\b\d{10}\b/g, "")

      // remove VID numbers
      .replace(/VID\d+/gi, "")

      // remove unwanted date patterns like D12062012
      .replace(/[A-Z]?\d{8}/g, "")

      // remove "Details as on"
      .replace(/details as on.*?/gi, "")

      // fix PO & DIST
      .replace(/po[:]/gi, "PO ")
      .replace(/dist[:]/gi, "DIST ")

      // fix merged words
      .replace(/([a-z])([A-Z])/g, "$1 $2")

      // replace dots with comma
      .replace(/\./g, ", ")

      // remove extra symbols
      .replace(/[^a-zA-Z0-9,\-\s]/g, "")

      // remove extra commas/spaces
      .replace(/,\s*,/g, ",")
      .replace(/\s+/g, " ")

      .trim();
    const pincodeMatch = fullText.match(/\b\d{6}\b/);

    const data = {
      name,
      dob,
      gender: genderMatch?.[0],
      aadhaar: aadhaar?.replace(/\s/g, ""),
      address,
      pincode: pincodeMatch?.[0],
    };

    res.json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "OCR failed",
      details: error instanceof Error ? error.message : error,
    });
  }
};
