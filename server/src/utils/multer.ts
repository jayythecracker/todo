import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png"];

  if (!allowed.includes(ext)) {
    return cb(new Error("Only images are allowed"));
  }

  cb(null, true);
};

const upload = multer({ storage, fileFilter });

export default upload;
