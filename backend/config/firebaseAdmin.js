import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseServiceAccount = () => {
  const inlineJson = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON");
    }
  }

  const configuredPath = String(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "").trim();
  const fallbackPath = path.resolve(__dirname, "../serviceAccountKey.json");
  const candidatePath = configuredPath
    ? path.resolve(configuredPath)
    : fallbackPath;

  if (fs.existsSync(candidatePath)) {
    return JSON.parse(fs.readFileSync(candidatePath, "utf8"));
  }

  return null;
};

let firebaseAdminConfigured = admin.apps.length > 0;

if (!firebaseAdminConfigured) {
  const serviceAccount = parseServiceAccount();

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseAdminConfigured = true;
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    firebaseAdminConfigured = true;
  } else {
    console.warn(
      "Firebase Admin is not configured. Firebase sign-in will remain unavailable until credentials are supplied securely."
    );
  }
}

export const isFirebaseAdminConfigured = () =>
  firebaseAdminConfigured && admin.apps.length > 0;

export const firebaseAdmin = admin;
