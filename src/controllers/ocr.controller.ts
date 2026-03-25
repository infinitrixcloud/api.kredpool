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

export const ocrController = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const inputPath = req.file.path;
    const outputPath = `processed-${Date.now()}.jpg`;

    await preprocess(inputPath, outputPath);

    const form = new FormData();
    form.append("file", fs.createReadStream(outputPath));

    const response = await axios.post(
      "http://127.0.0.1:8000/ocr",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    await fs.promises.unlink(inputPath).catch(() => { });
    // await fs.promises.unlink(outputPath).catch(() => { });

    res.json(response.data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "OCR failed",
      details: error instanceof Error ? error.message : error
    });
  }
};