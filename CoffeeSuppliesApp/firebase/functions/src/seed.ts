/**
 * Seed script — populates Firestore dev with the catalog from Phase1-Seed-Catalog.md.
 *
 * Run: cd firebase/functions && npm run seed
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key,
 *           or run within the Firebase emulator.
 */
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// ─── Supplier ───
const SUPPLIER_ID = "supplier-jeddah-packaging";
const supplier = {
  id: SUPPLIER_ID,
  name: "Jeddah Packaging Co.",
  phone: "+966500000001",
  email: "orders@jeddahpackaging.sa",
  handlesNote: "Cups, lids, straws, napkins, bags, food packaging, printing",
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
};

// ─── Categories ───
const categories = [
  { id: "cups", name_ar: "أكواب", name_en: "Cups", sortOrder: 1, iconUrl: null },
  { id: "lids", name_ar: "أغطية", name_en: "Lids", sortOrder: 2, iconUrl: null },
  { id: "straws", name_ar: "شفاطات ومحركات", name_en: "Straws & Stirrers", sortOrder: 3, iconUrl: null },
  { id: "holders", name_ar: "حاملات أكواب", name_en: "Cup Holders & Carriers", sortOrder: 4, iconUrl: null },
  { id: "napkins", name_ar: "مناديل", name_en: "Napkins & Tissues", sortOrder: 5, iconUrl: null },
  { id: "food-packaging", name_ar: "تغليف طعام", name_en: "Food Packaging", sortOrder: 6, iconUrl: null },
  { id: "consumables", name_ar: "مستهلكات", name_en: "Coffee Bar Consumables", sortOrder: 7, iconUrl: null },
  { id: "cutlery", name_ar: "أدوات طعام", name_en: "Cutlery", sortOrder: 8, iconUrl: null },
  { id: "bags", name_ar: "أكياس", name_en: "Bags", sortOrder: 9, iconUrl: null },
  { id: "printing", name_ar: "طباعة وبراندينق", name_en: "Printing & Branding", sortOrder: 10, iconUrl: null },
];

// ─── Helper to create a product base ───
interface VariantDef {
  variantId: string;
  label_ar: string;
  label_en: string;
  sellPrice: number;
  pricingUnit: string;
  pricingUnitLabel: string;
  inStock: boolean;
  costPrice: number | null;
}

function makeProduct(
  id: string,
  nameAr: string,
  nameEn: string,
  descAr: string,
  descEn: string,
  categoryId: string,
  pricingUnit: string,
  pricingUnitLabel: string,
  sellPrice: number,
  deliveryEstimate: string,
  madeToOrder: boolean,
  variants: VariantDef[]
) {
  return {
    id,
    name_ar: nameAr,
    name_en: nameEn,
    description_ar: descAr,
    description_en: descEn,
    imageUrl: null,
    categoryId,
    pricingUnit,
    pricingUnitLabel,
    hasVariants: variants.length > 0,
    sellPrice: variants.length > 0 ? 0 : sellPrice,
    deliveryEstimate,
    inStock: true,
    madeToOrder,
    activeSupplierIndex: 0,
    suppliers: [
      {
        supplierId: SUPPLIER_ID,
        costPrice: Math.round(sellPrice * 0.65),
        sellPrice,
        pricingUnit,
        deliveryEstimate,
      },
    ],
    variants,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: null,
  };
}

// ─── Products ───
const products = [
  // ── Cups (with variants) ──
  makeProduct(
    "paper-cup-hot", "كوب ورقي (ساخن)", "Paper Cup (hot)",
    "أكواب ورقية للمشروبات الساخنة بأحجام متعددة", "Paper cups for hot beverages in multiple sizes",
    "cups", "sleeve", "per sleeve", 48, "2-4 days", false,
    [
      { variantId: "4oz", label_ar: "4oz", label_en: "4oz", sellPrice: 35, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 22 },
      { variantId: "8oz", label_ar: "8oz", label_en: "8oz", sellPrice: 48, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 30 },
      { variantId: "12oz", label_ar: "12oz", label_en: "12oz", sellPrice: 55, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 35 },
      { variantId: "16oz", label_ar: "16oz", label_en: "16oz", sellPrice: 62, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 40 },
    ]
  ),
  makeProduct(
    "double-wall-cup", "كوب مزدوج الجدار", "Double-Wall Cup (hot)",
    "أكواب مزدوجة الجدار للمشروبات الساخنة الفاخرة", "Premium double-wall cups for hot beverages",
    "cups", "sleeve", "per sleeve", 75, "2-4 days", false,
    [
      { variantId: "8oz", label_ar: "8oz", label_en: "8oz", sellPrice: 75, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 48 },
      { variantId: "12oz", label_ar: "12oz", label_en: "12oz", sellPrice: 90, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 58 },
    ]
  ),
  makeProduct(
    "cold-plastic-cup", "كوب بلاستيك (بارد)", "Cold / Plastic Cup",
    "أكواب بلاستيكية شفافة للمشروبات الباردة", "Clear plastic cups for cold drinks",
    "cups", "sleeve", "per sleeve", 42, "2-4 days", false,
    [
      { variantId: "12oz", label_ar: "12oz", label_en: "12oz", sellPrice: 42, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 27 },
      { variantId: "16oz", label_ar: "16oz", label_en: "16oz", sellPrice: 48, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 31 },
      { variantId: "20oz", label_ar: "20oz", label_en: "20oz", sellPrice: 55, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 35 },
    ]
  ),

  // ── Lids (with variants) ──
  makeProduct(
    "hot-cup-lid", "غطاء كوب ساخن", "Hot Cup Lid",
    "أغطية للأكواب الساخنة", "Lids for hot cups",
    "lids", "sleeve", "per sleeve", 28, "2-4 days", false,
    [
      { variantId: "8oz", label_ar: "8oz", label_en: "8oz", sellPrice: 28, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 18 },
      { variantId: "12-16oz", label_ar: "12/16oz", label_en: "12/16oz", sellPrice: 32, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 20 },
    ]
  ),
  makeProduct(
    "cold-cup-lid", "غطاء كوب بارد", "Cold Cup Lid",
    "أغطية للأكواب الباردة - قبة أو مسطح", "Lids for cold cups - dome or flat",
    "lids", "sleeve", "per sleeve", 30, "2-4 days", false,
    [
      { variantId: "dome", label_ar: "قبة", label_en: "Dome", sellPrice: 32, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 20 },
      { variantId: "flat", label_ar: "مسطح", label_en: "Flat (straw slot)", sellPrice: 28, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 18 },
    ]
  ),
  makeProduct(
    "sip-lid", "غطاء شرب (بدون شفاط)", "Sip Lid (no straw)",
    "أغطية شرب مباشر بدون فتحة شفاط", "Direct sip lids without straw slot",
    "lids", "sleeve", "per sleeve", 30, "2-4 days", false,
    [
      { variantId: "8oz", label_ar: "8oz", label_en: "8oz", sellPrice: 28, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 18 },
      { variantId: "12-16oz", label_ar: "12/16oz", label_en: "12/16oz", sellPrice: 32, pricingUnit: "sleeve", pricingUnitLabel: "per sleeve", inStock: true, costPrice: 20 },
    ]
  ),

  // ── Straws (with variants) ──
  makeProduct(
    "paper-straw", "شفاط ورقي", "Paper Straw",
    "شفاطات ورقية صديقة للبيئة", "Eco-friendly paper straws",
    "straws", "box", "per box", 25, "2-4 days", false,
    [
      { variantId: "standard", label_ar: "عادي", label_en: "Standard", sellPrice: 25, pricingUnit: "box", pricingUnitLabel: "per box", inStock: true, costPrice: 16 },
      { variantId: "jumbo", label_ar: "جامبو", label_en: "Jumbo", sellPrice: 30, pricingUnit: "box", pricingUnitLabel: "per box", inStock: true, costPrice: 19 },
    ]
  ),
  makeProduct(
    "plastic-straw", "شفاط بلاستيك", "Plastic Straw",
    "شفاطات بلاستيكية", "Plastic straws",
    "straws", "box", "per box", 20, "2-4 days", false,
    [
      { variantId: "standard", label_ar: "عادي", label_en: "Standard", sellPrice: 20, pricingUnit: "box", pricingUnitLabel: "per box", inStock: true, costPrice: 13 },
      { variantId: "jumbo", label_ar: "جامبو", label_en: "Jumbo", sellPrice: 24, pricingUnit: "box", pricingUnitLabel: "per box", inStock: true, costPrice: 15 },
    ]
  ),
  makeProduct(
    "wooden-stirrer", "محرك خشبي", "Wooden Coffee Stirrer",
    "محركات قهوة خشبية", "Wooden coffee stirrers",
    "straws", "box", "per box", 18, "2-4 days", false, []
  ),
  makeProduct(
    "spoon-straw", "شفاط ملعقة", "Spoon Straw",
    "شفاطات بشكل ملعقة للمشروبات المثلجة", "Spoon-shaped straws for frozen drinks",
    "straws", "box", "per box", 22, "2-4 days", false, []
  ),

  // ── Cup Holders & Carriers (simple) ──
  makeProduct(
    "cup-sleeve", "حامل كوب / جاكيت", "Cup Sleeve / Jacket",
    "أغلفة حماية حرارية للأكواب", "Heat protection sleeves for cups",
    "holders", "box", "per box", 35, "2-4 days", false, []
  ),
  makeProduct(
    "2-cup-carrier", "حامل كوبين", "2-Cup Carrier Tray",
    "صواني حمل لكوبين", "Carrier trays for 2 cups",
    "holders", "pack", "per pack", 28, "2-4 days", false, []
  ),
  makeProduct(
    "4-cup-carrier", "حامل أربع أكواب", "4-Cup Carrier Tray",
    "صواني حمل لأربع أكواب", "Carrier trays for 4 cups",
    "holders", "pack", "per pack", 35, "2-4 days", false, []
  ),
  makeProduct(
    "drink-carrier-bag", "كيس حامل مشروبات", "Drink Carrier Bag",
    "أكياس حمل المشروبات", "Drink carrier bags",
    "holders", "pack", "per pack", 40, "2-4 days", false, []
  ),

  // ── Napkins (simple) ──
  makeProduct(
    "beverage-napkin", "منديل مشروبات (صغير)", "Beverage Napkin (small)",
    "مناديل صغيرة للمشروبات", "Small beverage napkins",
    "napkins", "case", "per case", 85, "2-4 days", false, []
  ),
  makeProduct(
    "dinner-napkin", "منديل كبير", "Dinner Napkin (large)",
    "مناديل كبيرة للطعام", "Large dinner napkins",
    "napkins", "case", "per case", 110, "2-4 days", false, []
  ),
  makeProduct(
    "dispenser-napkin", "منديل موزع", "Dispenser Napkin",
    "مناديل لجهاز التوزيع", "Dispenser napkins",
    "napkins", "case", "per case", 95, "2-4 days", false, []
  ),
  makeProduct(
    "wet-wipes", "مناديل مبللة", "Wet Wipes (sachet)",
    "مناديل مبللة معبأة", "Individually wrapped wet wipes",
    "napkins", "box", "per box", 45, "2-4 days", false, []
  ),

  // ── Food Packaging (simple) ──
  makeProduct(
    "kraft-food-box", "علبة كرافت (صغيرة)", "Kraft Food Box (small)",
    "علب كرافت للمعجنات والسندويتشات", "Kraft boxes for pastries and sandwiches",
    "food-packaging", "pack", "per pack", 55, "2-4 days", false, []
  ),
  makeProduct(
    "sandwich-wrap", "ورق لف سندويتش", "Sandwich Wrap Paper",
    "ورق لف للسندويتشات", "Wrapping paper for sandwiches",
    "food-packaging", "ream", "per ream", 40, "2-4 days", false, []
  ),
  makeProduct(
    "pastry-box", "علبة معجنات / كيك", "Pastry / Cake Box",
    "علب للمعجنات والكيك", "Boxes for pastries and cakes",
    "food-packaging", "pack", "per pack", 65, "2-4 days", false, []
  ),
  makeProduct(
    "deli-paper", "ورق تبطين", "Deli Paper Sheets",
    "أوراق تبطين للمعجنات", "Deli paper sheets for lining",
    "food-packaging", "ream", "per ream", 35, "2-4 days", false, []
  ),

  // ── Coffee Bar Consumables (simple) ──
  makeProduct(
    "sugar-sticks", "أكياس سكر", "Sugar Sticks / Sachets",
    "أكياس سكر أبيض وبني", "White and brown sugar sachets",
    "consumables", "box", "per box", 30, "2-4 days", false, []
  ),
  makeProduct(
    "sweetener-sachets", "أكياس محلي صناعي", "Sweetener Sachets",
    "أكياس محلي صناعي", "Artificial sweetener sachets",
    "consumables", "box", "per box", 35, "2-4 days", false, []
  ),
  makeProduct(
    "honey-sachets", "أكياس عسل", "Honey Sachets",
    "أكياس عسل طبيعي", "Natural honey sachets",
    "consumables", "box", "per box", 55, "2-4 days", false, []
  ),
  makeProduct(
    "cleaning-tablets", "أقراص تنظيف ماكينة", "Cleaning Tablets (espresso machine)",
    "أقراص تنظيف لماكينات الإسبريسو", "Cleaning tablets for espresso machines",
    "consumables", "pack", "per pack", 75, "3-5 days", false, []
  ),
  makeProduct(
    "group-head-brush", "فرشاة قروب هيد", "Group Head Brush",
    "فرشاة تنظيف قروب هيد الماكينة", "Group head cleaning brush",
    "consumables", "piece", "per piece", 25, "2-4 days", false, []
  ),

  // ── Cutlery (simple) ──
  makeProduct(
    "wooden-fork", "شوكة خشبية", "Wooden Fork",
    "شوك خشبية قابلة للتحلل", "Biodegradable wooden forks",
    "cutlery", "box", "per box", 30, "2-4 days", false, []
  ),
  makeProduct(
    "wooden-knife", "سكين خشبية", "Wooden Knife",
    "سكاكين خشبية قابلة للتحلل", "Biodegradable wooden knives",
    "cutlery", "box", "per box", 30, "2-4 days", false, []
  ),
  makeProduct(
    "wooden-spoon", "ملعقة خشبية", "Wooden Spoon",
    "ملاعق خشبية قابلة للتحلل", "Biodegradable wooden spoons",
    "cutlery", "box", "per box", 30, "2-4 days", false, []
  ),
  makeProduct(
    "cutlery-set", "طقم أدوات طعام", "Cutlery Set (fork+knife+napkin)",
    "طقم شوكة + سكين + منديل", "Fork, knife and napkin set",
    "cutlery", "box", "per box", 55, "2-4 days", false, []
  ),

  // ── Bags (simple) ──
  makeProduct(
    "paper-bag-small", "كيس ورقي (صغير)", "Paper Carry Bag (small)",
    "أكياس ورقية صغيرة", "Small paper carry bags",
    "bags", "pack", "per pack", 40, "2-4 days", false, []
  ),
  makeProduct(
    "paper-bag-large", "كيس ورقي (كبير)", "Paper Carry Bag (large)",
    "أكياس ورقية كبيرة", "Large paper carry bags",
    "bags", "pack", "per pack", 55, "2-4 days", false, []
  ),
  makeProduct(
    "kraft-handle-bag", "كيس كرافت بمقبض", "Kraft Handle Bag",
    "أكياس كرافت بمقابض", "Kraft bags with handles",
    "bags", "pack", "per pack", 65, "2-4 days", false, []
  ),

  // ── Printing & Branding (madeToOrder) ──
  makeProduct(
    "custom-printed-cups", "أكواب مطبوعة حسب الطلب", "Custom Printed Cups",
    "أكواب بتصميم خاص لعلامتك التجارية - حد أدنى للطلب", "Custom branded cups - minimum order quantity applies",
    "printing", "per_1000", "per 1000", 450, "7-14 days", true, []
  ),
  makeProduct(
    "custom-printed-napkins", "مناديل مطبوعة", "Custom Printed Napkins",
    "مناديل بشعار المقهى", "Napkins with your cafe logo",
    "printing", "case", "per case", 280, "7-14 days", true, []
  ),
  makeProduct(
    "custom-printed-bags", "أكياس مطبوعة", "Custom Printed Bags",
    "أكياس ورقية بتصميم خاص", "Custom printed paper bags",
    "printing", "per_1000", "per 1000", 550, "7-14 days", true, []
  ),
  makeProduct(
    "custom-stickers", "ملصقات / ستيكرات", "Custom Stickers / Labels",
    "ملصقات بتصميم خاص لعلامتك", "Custom stickers and labels",
    "printing", "roll", "per roll", 120, "5-10 days", true, []
  ),
  makeProduct(
    "loyalty-cards", "بطاقات ولاء", "Loyalty / Stamp Cards",
    "بطاقات ختم ولاء للعملاء", "Customer loyalty stamp cards",
    "printing", "pack", "per pack", 85, "5-10 days", true, []
  ),
  makeProduct(
    "receipt-roll", "رول فواتير حرارية", "Receipt Roll Paper",
    "أرول ورق حراري لطابعات نقاط البيع", "Thermal receipt rolls for POS printers",
    "printing", "box", "per box", 60, "2-4 days", false, []
  ),
];

// ─── Seed execution ───
async function seed() {
  console.log("🌱 Starting catalog seed...\n");

  // Seed supplier
  console.log("📦 Seeding supplier...");
  await db.collection("suppliers").doc(SUPPLIER_ID).set(supplier);
  console.log(`   ✓ ${supplier.name}`);

  // Seed categories
  console.log("\n📂 Seeding categories...");
  for (const cat of categories) {
    await db.collection("categories").doc(cat.id).set(cat);
    console.log(`   ✓ ${cat.name_en} (${cat.name_ar})`);
  }

  // Seed products
  console.log(`\n☕ Seeding ${products.length} products...`);
  for (const product of products) {
    await db.collection("products").doc(product.id).set(product);
    const variantInfo = product.hasVariants
      ? ` [${product.variants.length} variants]`
      : "";
    const mtoInfo = product.madeToOrder ? " [made-to-order]" : "";
    console.log(`   ✓ ${product.name_en}${variantInfo}${mtoInfo}`);
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   • 1 supplier`);
  console.log(`   • ${categories.length} categories`);
  console.log(`   • ${products.length} products`);
  console.log(`   • ${products.filter((p) => p.hasVariants).length} with variants`);
  console.log(`   • ${products.filter((p) => p.madeToOrder).length} made-to-order`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
