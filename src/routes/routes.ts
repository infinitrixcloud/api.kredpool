import { Router } from "express";
import { ocrController } from "../controllers/ocr.controller";
import { panOCRController } from "../controllers/panOCR.controller";
import { upload } from "../middlewares/multer.middleware"

export const router = Router();

router.post('/ocr/adhaar', upload.array('images', 2), ocrController)
router.post('/ocr/pan', upload.array('images', 2), panOCRController)