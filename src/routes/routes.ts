import { Router } from "express";
import { ocrController } from "../controllers/ocr.controller";
import { panOCRController } from "../controllers/panOCR.controller";
import { 
  sendAadhaarOtpController, 
  verifyAadhaarOtpController 
} from "../controllers/aadhaarverify.controller";
import { panVerifyController } from "../controllers/panverify.controller";
import { upload } from "../middlewares/multer.middleware"
import { authMiddleware } from "../middlewares/auth.middleware";

export const router = Router();

// OCR Endpoints
router.post('/ocr/adhaar', upload.array('files'), ocrController)
router.post('/ocr/pan', upload.array('files'), panOCRController)

// Verification Endpoints (Structured & Secure)
router.post('/verify/aadhaar/otp', authMiddleware as any, sendAadhaarOtpController as any)
router.post('/verify/aadhaar/data', authMiddleware as any, verifyAadhaarOtpController as any)
router.post('/verify/pan', authMiddleware as any, panVerifyController as any)