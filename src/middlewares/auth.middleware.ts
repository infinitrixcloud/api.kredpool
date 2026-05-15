import { Request, Response, NextFunction } from "express";

const STATIC_API_KEY = "Kredpool@2026"; // You can change this to any secure string

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== STATIC_API_KEY) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: Invalid or missing API Key",
    });
  }

  // Passing through since API key is valid
  next();
};
