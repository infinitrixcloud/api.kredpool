import { Router } from "express";
import { ocrController } from "../controllers/ocr.controller";
import { upload } from "../middlewares/multer.middleware"

export const router = Router();

router.post('/ocr', upload.single('image'), ocrController)