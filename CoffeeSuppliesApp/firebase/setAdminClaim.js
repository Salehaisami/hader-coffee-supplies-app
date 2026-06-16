// One-time script to set admin custom claims.
// Run: cd firebase && node setAdminClaim.js
// Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key,
// OR run via: npx firebase functions:shell < setAdminClaim.js

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const uid = "H1r3LxZ4RpXcPitA1uMIQfjhQXf1";

async function run() {
  await admin.auth().setCustomUserClaims(uid, { role: "admin" });
  console.log(`✓ Admin custom claim set for UID: ${uid}`);

  await admin.firestore().collection("users").doc(uid).set({
    uid: uid,
    email: "admin@haderapp.com",
    businessName: "Admin",
    contactName: "Admin",
    phone: "",
    role: "admin",
    status: "approved",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log("✓ Firestore user doc created/updated");
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
