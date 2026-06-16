// Uses firebase-admin with ADC from gcloud or firebase login token
const admin = require("firebase-admin");

// Use the credential from firebase-tools
const { getCredential } = require("firebase-tools");

async function run() {
  // Initialize with explicit credential from firebase CLI auth
  const credential = admin.credential.applicationDefault();
  
  admin.initializeApp({
    projectId: "hader-dcfcc",
    credential: credential,
  });

  const uid = "H1r3LxZ4RpXcPitA1uMIQfjhQXf1";
  await admin.auth().setCustomUserClaims(uid, { role: "admin" });
  const user = await admin.auth().getUser(uid);
  console.log("✓ Custom claims set:", user.customClaims);
}

run().catch(e => { console.error(e.message); process.exit(1); });
