const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Read the firebase-tools config to get the refresh token
const configPath = path.join(process.env.HOME, ".config/configstore/firebase-tools.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const credential = admin.credential.refreshToken({
  type: "authorized_user",
  client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
  client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
  refresh_token: config.tokens ? config.tokens.refresh_token : config.refresh_token,
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

run().catch(e => { console.error(e.message || e); process.exit(1); });
