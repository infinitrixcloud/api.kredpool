import { Request, Response } from "express";
import { log } from "../utils/log";
import { VendorService } from "../utils/vendor.service";

export const sendAadhaarOtpController = async (
  req: Request,
  res: Response
) => {
  const { aadhaar_no } = req.body;

  if (!aadhaar_no || !/^\d{12}$/.test(aadhaar_no)) {
    return res.status(400).json({ status: "error", message: "Invalid Aadhaar number." });
  }

  try {
    // External API Call directly
    const result = await VendorService.sendAadhaarOtp(aadhaar_no);
    return res.status(200).json({ status: "success", data: result });
  } catch (error: any) {
    log(`Aadhaar OTP Error: ${error.message}`, "error");
    return res.status(500).json({ status: "error", message: error.response?.data?.message || "Failed to send OTP" });
  }
};

export const verifyAadhaarOtpController = async (
  req: Request,
  res: Response
) => {
  const { otp, client_id, aadhaar_no } = req.body;

  if (!otp || !client_id) {
    return res.status(400).json({ status: "error", message: "OTP and ClientID are required." });
  }

  try {
    // External API Call directly
    const result = await VendorService.verifyAadhaarOtp(otp, client_id, aadhaar_no);
    return res.status(200).json({ status: "success", data: result });
  } catch (error: any) {
    log(`Aadhaar Verify Error: ${error.message}`, "error");
    return res.status(500).json({ status: "error", message: error.response?.data?.message || "Failed to verify OTP" });
  }
};
