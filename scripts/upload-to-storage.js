/**
 * upload-to-storage.js
 * Uploads all regenerated product images to Firebase Storage and updates
 * each product's imageUrl in Firestore.
 */
const fs = require("fs"), path = require("path");
const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const { getFirestore } = require("firebase-admin/firestore");

const DIR = path.join(__dirname, "regenerated-images");
const BUCKET = "hader-dcfcc.firebasestorage.app";

async function main() {
  const { cert } = require("firebase-admin/app");
  const serviceAccount = JSON.parse(fs.readFileSync(
    path.join(__dirname, "hader-dcfcc-firebase-adminsdk-fbsvc-697e33ef0e.json"), "utf-8"
  ));

  const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET,
  });

  const bucket = getStorage(app).bucket();
  const db = getFirestore(app);

  const files = fs.readdirSync(DIR).filter(f => f.endsWith(".jpg") && !f.startsWith("_"));
  console.log("Uploading " + files.length + " images...\n");

  let ok = 0;
  for (const file of files) {
    const productId = file.replace(".jpg", "");
    const localPath = path.join(DIR, file);
    const storagePath = "products/" + productId + "/image.jpg";

    process.stdout.write("  " + productId + "...");
    try {
      await bucket.upload(localPath, {
        destination: storagePath,
        metadata: { contentType: "image/jpeg", cacheControl: "public, max-age=31536000" },
      });

      const publicUrl = "https://firebasestorage.googleapis.com/v0/b/" + BUCKET + "/o/" + encodeURIComponent(storagePath) + "?alt=media";
      await db.collection("products").doc(productId).update({ imageUrl: publicUrl });
      console.log(" done");
      ok++;
    } catch (e) {
      console.log(" FAIL: " + e.message.slice(0, 80));
    }
  }
  console.log("\n" + ok + "/" + files.length + " uploaded.");
}

main().catch(e => { console.error(e.message); process.exit(1); });
