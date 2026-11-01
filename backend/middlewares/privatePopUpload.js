import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const paymentPopDir = path.resolve(__dirname, "..", "private_uploads", "payment-pops");
if (!fs.existsSync(paymentPopDir)) fs.mkdirSync(paymentPopDir, { recursive: true });

const allowed = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["application/pdf", ".pdf"],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, paymentPopDir),
  filename: (_req, file, cb) => {
    const ext = allowed.get(file.mimetype) || ".bin";
    cb(null, `pop-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

export const bankPopUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) return cb(new Error("Proof of Payment must be JPG, PNG or PDF."));
    cb(null, true);
  },
});

export const validatePopSignature = async (file) => {
  if (!file?.path) return false;
  const fd = await fs.promises.open(file.path, "r");
  try {
    const buffer = Buffer.alloc(8);
    await fd.read(buffer, 0, buffer.length, 0);
    if (file.mimetype === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (file.mimetype === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
    if (file.mimetype === "application/pdf") return buffer.subarray(0, 4).toString("ascii") === "%PDF";
    return false;
  } finally {
    await fd.close();
  }
};
