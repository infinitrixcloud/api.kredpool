import axios from "axios";
import FormData from "form-data";
import { preprocess } from "./image";
import fs from "node:fs/promises";
import fsSync from "node:fs";

const OCR_SERVER_URL = process.env.OCR_URL || "http://localhost:8000/ocr";

export const ocr_img_get_raw_text = async (image: Express.Multer.File) => {
  const input_path = image.path;
  let output_path: string = "";
  let stream: fsSync.ReadStream | null = null;

  try {
    output_path = await preprocess(input_path);

    stream = fsSync.createReadStream(output_path);

    const form = new FormData();
    form.append("file", stream);

    const response = await axios.post(OCR_SERVER_URL, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data?.result || "";
  } catch (error: any) {
    console.error("OCR ERROR:", error.message);

    throw new Error("Failed to process OCR image");
  } finally {
    if (stream) {
      stream.destroy(); // safer than close()
    }

    // Safe cleanup
    try {
      await fs.unlink(input_path);
    } catch { }

    if (output_path) {
      try {
        await fs.unlink(output_path);
      } catch { }
    }
  }
};