import { Router } from "express";
import { ocrController } from "../controllers/ocr.controller";
import { panOCRController } from "../controllers/panOCR.controller";
import { upload } from "../middlewares/multer.middleware"
import { bankStatementOCrController } from "../controllers/bank_statement.controller";


export const router = Router();

router.post('/ocr/adhaar', upload.array('images', 2), ocrController)
router.post('/ocr/pan', upload.array('images', 2), panOCRController)
router.post('/ocr/bank-statement', upload.array('images', 2), bankStatementOCrController)

