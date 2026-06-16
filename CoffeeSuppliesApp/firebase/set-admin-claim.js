const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp({ projectId: "hader-dcfcc" });

async function run() {
  const uid = "H1r3LxZ4RpXcPitA1uMIQfjhQXf1";
  await getAuth().setCustomUserClaims(uid, { role: "admin" });
  const user = await getAuth().getUser(uid);
  console.log("✓ Custom claims set:", user.customClaims);
}

run().catch(e => { console.error(e.message); process.exit(1); });
