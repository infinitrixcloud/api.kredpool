import sharp from "sharp";
import { v4 as uuid4 } from "uuid";

import { dir_exist, mkdir } from "./files";

const OUT_DIR = 'uploads';

export async function preprocess(
  input_path: string
): Promise<string> {

  if (!dir_exist(OUT_DIR)) {
    try {
      await mkdir(OUT_DIR);
    }
    catch (error) {
      console.log("failed to create directory \" uploads \" something went horribly wrong. crashing the server. pls check what went wrong below\n", error);
      process.exit(-1);
    }
  }

  const output_path = `${OUT_DIR}/${uuid4()}`;
  await sharp(input_path)
    .resize({ width: 1200 })
    .grayscale()
    .normalize()
    .sharpen()
    .toFile(output_path);

  return output_path;
}
