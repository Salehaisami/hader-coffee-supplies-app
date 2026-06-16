const admin = require("firebase-admin");
const { configstore } = require("firebase-tools/lib/configstore");

// Get the refresh token from firebase-tools login
const tokens = configstore.get("tokens");
const credential = admin.credential.refreshToken({
  type: "authorized_user",
  client_id: tokens.client_id || "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
  client_secret: tokens.client_secret || "j9iVZfS8kkCEFUPaAeJV0sAi",
  refresh_token: tokens.refresh_token,
});

admin.initializeApp({
  projectId: "hader-dcfcc",
  credential: credential,
});

async function run() {
  const uid = "H1r3LxZ4RpXcPitA1uMIQfjhQXf1";
  await admin.auth().setCustomUserClaims(uid, { role: "admin" });
  const user = await admin.auth().getUser(uid);
  console.log("✓ Custom claims set:", user.customClaims);
}

run().catch(e => { console.error(e); process.exit(1); });
