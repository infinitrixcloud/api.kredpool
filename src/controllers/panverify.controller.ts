import { Request, Response } from "express";
import { log } from "../utils/log";
import { VendorService } from "../utils/vendor.service";

export const panVerifyController = async (
  req: Request,
  res: Response
) => {
  const { pan_no } = req.body;

  if (!pan_no || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_no)) {
    return res.status(400).json({ status: "error", message: "Invalid PAN format." });
  }

  try {
    // External API Call directly
    const result = await VendorService.verifyPan(pan_no);
    return res.status(200).json({ status: "success", data: result });
  } catch (error: any) {
    log(`PAN Verify Error: ${error.message}`, "error");
    return res.status(500).json({ status: "error", message: error.response?.data?.message || "Failed to verify PAN" });
  }
};
