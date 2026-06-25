/**
 * One-time migration: backfill pricingUnitLabel_ar and pricingUnitLabel_en
 * on all products and their variants from the pricingUnits collection.
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const sa = JSON.parse(
  fs.readFileSync(path.join(__dirname, "hader-dcfcc-firebase-adminsdk-fbsvc-697e33ef0e.json"), "utf-8")
);
initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function migrate() {
  // Load pricing units
  const unitsSnap = await db.collection("pricingUnits").get();
  const unitMap = {};
  unitsSnap.docs.forEach((d) => {
    const data = d.data();
    const key = data.value || d.id;
    unitMap[key] = { label_ar: data.label_ar, label_en: data.label_en };
  });
  console.log("Loaded " + Object.keys(unitMap).length + " pricing units:", Object.keys(unitMap).join(", "));

  // Update all products
  const productsSnap = await db.collection("products").get();
  let updated = 0;

  for (const doc of productsSnap.docs) {
    const data = doc.data();
    const unit = unitMap[data.pricingUnit];
    if (!unit) {
      console.log("  SKIP " + doc.id + " — unknown unit: " + data.pricingUnit);
      continue;
    }

    const updates = {
      pricingUnitLabel_ar: unit.label_ar,
      pricingUnitLabel_en: unit.label_en,
    };

    // Also update variants
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      const newVariants = data.variants.map((v) => {
        const vUnit = unitMap[v.pricingUnit] || unit;
        return {
          ...v,
          pricingUnitLabel_ar: vUnit.label_ar,
          pricingUnitLabel_en: vUnit.label_en,
        };
      });
      updates.variants = newVariants;
    }

    await db.collection("products").doc(doc.id).update(updates);
    updated++;
  }

  console.log("Updated " + updated + " / " + productsSnap.size + " products");
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
