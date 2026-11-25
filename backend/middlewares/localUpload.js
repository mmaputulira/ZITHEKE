import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootUploadsDir = path.resolve(__dirname, "..", "uploads");
const imagesDir = path.join(rootUploadsDir, "images");
const videosDir = path.join(rootUploadsDir, "videos");

for (const dir of [rootUploadsDir, imagesDir, videosDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const sanitizeBaseName = (name = "") =>
  String(name)
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "file";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === "video/mp4") return cb(null, videosDir);
    return cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const original = sanitizeBaseName(file.originalname);
    const ext = file.mimetype === "video/mp4" ? ".mp4" : path.extname(file.originalname || ".jpg").toLowerCase();
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    cb(null, `${original}-${unique}${ext}`);
  },
});

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const isImage = ALLOWED_IMAGE_MIMES.has(file.mimetype);
    const isVideo = file.mimetype === "video/mp4";
    if (!isImage && !isVideo) {
      return cb(
        new Error(
          "Invalid file type. Allowed: jpeg, jpg, png, webp images and mp4 video."
        )
      );
    }
    cb(null, true);
  },
});

export const adUpload = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "video", maxCount: 1 },
]);

// One image only (subcategory pictures and similar admin uploads).
const imageOnly = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      return cb(new Error("Please choose a JPG, PNG or WebP picture."));
    }
    cb(null, true);
  },
});
export const singleImageUpload = imageOnly.single("image");

export const mediaUpload = upload.fields([
  { name: "images", maxCount: 9 },
  { name: "video", maxCount: 1 },
]);

export default upload;
