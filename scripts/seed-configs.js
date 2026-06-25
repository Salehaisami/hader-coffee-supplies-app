/**
 * Seed Firestore config documents with default values.
 * Run: node scripts/seed-configs.js
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, "hader-dcfcc-firebase-adminsdk-fbsvc-697e33ef0e.json");
initializeApp({ credential: cert(require(serviceAccountPath)) });
const db = getFirestore();

async function seedConfigs() {
  console.log("Seeding config documents...\n");

  // 1. Delivery Zones
  await db.doc("config/deliveryZones").set({
    zones: [
      {
        id: "jeddah",
        label_ar: "جدة",
        label_en: "Jeddah",
        center: { lat: 21.4858, lng: 39.1925 },
        radiusMeters: 55000,
        enabled: true,
      },
    ],
  }, { merge: true });
  console.log("✓ config/deliveryZones");

  // 2. Payment Methods
  await db.doc("config/paymentMethods").set({
    methods: [
      { id: "apple_pay", label_ar: "Apple Pay", label_en: "Apple Pay", enabled: true },
      { id: "cash_on_delivery", label_ar: "الدفع عند الاستلام", label_en: "Cash on Delivery", enabled: true },
    ],
  }, { merge: true });
  console.log("✓ config/paymentMethods");

  // 3. Order Workflow
  await db.doc("config/orderWorkflow").set({
    steps: ["pending", "sent_to_supplier", "delivered"],
    terminalStatuses: ["delivered", "cancelled"],
    labels: {
      pending: { ar: "قيد الانتظار", en: "Pending" },
      sent_to_supplier: { ar: "أُرسل للمورد", en: "Sent to Supplier" },
      delivered: { ar: "تم التوصيل", en: "Delivered" },
      cancelled: { ar: "ملغي", en: "Cancelled" },
    },
  }, { merge: true });
  console.log("✓ config/orderWorkflow");

  // 4. Delivery Estimates
  await db.doc("config/deliveryEstimates").set({
    defaultMin: 2,
    defaultMax: 4,
    defaultUnit: "days",
    units: ["hours", "days", "weeks", "months"],
  }, { merge: true });
  console.log("✓ config/deliveryEstimates");

  // 5. Notifications
  await db.doc("config/notifications").set({
    orderConfirmation: true,
    orderStatusChange: true,
    orderCancellation: true,
    promotions: false,
  }, { merge: true });
  console.log("✓ config/notifications");

  // 6. General
  await db.doc("config/general").set({
    currency: "SAR",
    currencySymbol_ar: "ر.س",
    currencySymbol_en: "SAR",
    countryCode: "SA",
    appName_ar: "حاضر",
    appName_en: "Hader",
    supportPhone: "+966500000000",
    supportEmail: "support@hader.sa",
  }, { merge: true });
  console.log("✓ config/general");

  console.log("\n✅ All config documents seeded successfully.");
}

seedConfigs().catch(console.error);
