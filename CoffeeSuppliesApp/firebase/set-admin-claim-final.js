const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { GoogleAuth, UserRefreshClient } = require("google-auth-library");
const fs = require("fs");
const path = require("path");

// Read the firebase-tools stored refresh token
const configPath = path.join(process.env.HOME, ".config/configstore/firebase-tools.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const refreshToken = config.tokens ? config.tokens.refresh_token : config.refresh_token;

// Firebase CLI OAuth client credentials
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const refreshClient = new UserRefreshClient(CLIENT_ID, CLIENT_SECRET, refreshToken);

initializeApp({
  projectId: "hader-dcfcc",
  credential: {
    getAccessToken: async () => {
      const res = await refreshClient.getAccessToken();
      return { access_token: res.token, expires_in: 3600 };
    },
  },
});

async function run() {
  const uid = "H1r3LxZ4RpXcPitA1uMIQfjhQXf1";
  await getAuth().setCustomUserClaims(uid, { role: "admin" });
  const user = await getAuth().getUser(uid);
  console.log("✓ Custom claims set:", user.customClaims);
}

run().catch(e => { console.error(e.message || e); process.exit(1); });
