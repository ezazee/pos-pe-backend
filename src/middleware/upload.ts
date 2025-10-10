import multer from "multer";
import path from "path";
import fs from "fs";
import { ENV } from "../config/env.js";
import { Request } from "express";
import mime from "mime-types";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const productsDir = path.join(ENV.UPLOAD_DIR, "products");
ensureDir(productsDir);


const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, productsDir);
  },
  filename: (_req, file, cb) => {
    const ext = mime.extension(file.mimetype) || "bin";
    const name = `prod_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}.${ext}`;
    cb(null, name);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed"));
  }
  cb(null, true);
}

export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
