import fs from "node:fs/promises";

export async function dir_exist(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function mkdir(path: string): Promise<void> {
  try {
    await fs.mkdir(path);
  }
  catch (error) {
    throw error;
  }
}