const { Firestore, FieldValue } = require("@google-cloud/firestore");
const fs = require("fs"), path = require("path");

// Set up credentials from firebase-tools login
const cfg = JSON.parse(fs.readFileSync(path.join(process.env.HOME, ".config/configstore/firebase-tools.json"), "utf8"));
const rt = cfg.tokens ? cfg.tokens.refresh_token : cfg.refresh_token;
const credsJson = JSON.stringify({
  type: "authorized_user",
  client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
  client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
  refresh_token: rt,
});
fs.writeFileSync("/tmp/gcloud-creds.json", credsJson);
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/gcloud-creds.json";

const db = new Firestore({ projectId: "hader-dcfcc" });
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "seed-data.json"), "utf8"));

async function seed() {
  console.log(`Seeding ${data.categories.length} categories, ${data.products.length} products...\n`);
  for (const c of data.categories) {
    await db.collection("categories").doc(c.id).set({ ...c, createdAt: FieldValue.serverTimestamp() });
    console.log("  ✓ cat:", c.name_en);
  }
  console.log("");
  for (const p of data.products) {
    await db.collection("products").doc(p.id).set({ ...p, createdAt: FieldValue.serverTimestamp() });
    console.log("  ✓ prod:", p.name_en);
  }
  console.log("\n✅ Done!");
}
seed().then(() => process.exit(0)).catch(e => { console.error("❌", e.message); process.exit(1); });
