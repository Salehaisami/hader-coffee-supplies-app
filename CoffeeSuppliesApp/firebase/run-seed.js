/**
 * Seed script using Firebase client SDK (same as admin dashboard).
 * Requires admin password as first argument.
 * Run: node run-seed.js YOUR_ADMIN_PASSWORD
 */
const { initializeApp } = require("/Users/smsaleh/Documents/Coffee-Supplies-App-Phase1/HaderAdmin/node_modules/firebase/app");
const { getFirestore, doc, setDoc, serverTimestamp } = require("/Users/smsaleh/Documents/Coffee-Supplies-App-Phase1/HaderAdmin/node_modules/firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("/Users/smsaleh/Documents/Coffee-Supplies-App-Phase1/HaderAdmin/node_modules/firebase/auth");

const app = initializeApp({
  apiKey: "AIzaSyCgWf-1gKXv-H0JXkNFYpoPN_NQRlWSOIQ",
  authDomain: "hader-dcfcc.firebaseapp.com",
  projectId: "hader-dcfcc",
  storageBucket: "hader-dcfcc.firebasestorage.app",
  messagingSenderId: "484035373651",
  appId: "1:484035373651:web:45e242aebd1b5c818074a6",
});
const db = getFirestore(app);
const auth = getAuth(app);
const data = require("./seed-catalog-data.json");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node run-seed.js YOUR_ADMIN_PASSWORD");
  process.exit(1);
}

async function seed() {
  console.log("Signing in as admin@haderapp.com...");
  await signInWithEmailAndPassword(auth, "admin@haderapp.com", password);
  console.log("Signed in. Seeding...\n");

  for (const c of data.categories) {
    const ref = doc(db, "categories", c.id);
    await setDoc(ref, { ...c, createdAt: serverTimestamp() });
    console.log("  cat:", c.name_en);
  }
  for (const p of data.products) {
    const ref = doc(db, "products", p.id);
    await setDoc(ref, { ...p, createdAt: serverTimestamp() });
    console.log("  prod:", p.name_en);
  }
  console.log("\nDone! " + data.categories.length + " categories, " + data.products.length + " products.");
}
seed().then(() => process.exit(0)).catch(e => { console.error("Error:", e.message); process.exit(1); });
