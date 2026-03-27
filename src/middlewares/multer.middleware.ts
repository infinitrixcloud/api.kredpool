import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});


const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowedTypes.includes(file.mimetype) &&
    [".jpg", ".jpeg", ".png", ".pdf",".doc"].includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, PDF files are allowed"));
  }
};


const limits: multer.Options["limits"] = {
  fileSize: 50 * 1024 * 1024, // 5MB
};


export const upload = multer({
  storage,
  fileFilter,
  limits,
});