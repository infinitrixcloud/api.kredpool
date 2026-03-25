import { toLocalDateTime } from "./datetime";
export type LOG_TYPE = "info" | "success" | "error" | "warn";

export function log(message: any, type: LOG_TYPE = "info") {
  try {
    const timestamp = toLocalDateTime(new Date());
    const colors = {
      info: "\x1b[36m",
      success: "\x1b[32m",
      error: "\x1b[31m",
      warn: "\x1b[33m",
    };
    const reset = "\x1b[0m";
    console.log(`${colors[type]}[${timestamp}] ${message}${reset}`);
  } catch (error) {
    console.log(error);
  }
}
