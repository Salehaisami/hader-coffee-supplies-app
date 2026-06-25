import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "fs";

/**
 * Server-side Firebase Admin SDK initialization.
 * Uses GOOGLE_APPLICATION_CREDENTIALS file path or FIREBASE_SA_* individual env vars.
 * Bypasses client-side security rules for Storage uploads.
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hader-dcfcc.firebasestorage.app";

  // Option 1: Service account JSON file path
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (saPath) {
    const serviceAccount = JSON.parse(readFileSync(saPath, "utf-8"));
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucket,
    });
  }

  // Option 2: Individual env vars (for environments where file access isn't practical)
  const projectId = process.env.FIREBASE_SA_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_SA_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: bucket,
    });
  }

  // Option 3: Default credentials (GCP environments like Cloud Run / App Hosting)
  return initializeApp({ storageBucket: bucket });
}

const adminApp = getAdminApp();
const adminStorage = getStorage(adminApp);

export { adminApp, adminStorage };
