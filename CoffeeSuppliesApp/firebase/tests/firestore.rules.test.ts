import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

let testEnv: RulesTestEnvironment;

const PROJECT_ID = "hader-test";
const ADMIN_UID = "admin-user-1";
const CUSTOMER_UID = "customer-user-1";
const OTHER_CUSTOMER_UID = "customer-user-2";

beforeAll(async () => {
  const rulesPath = path.join(__dirname, "..", "firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf8");

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules, host: "127.0.0.1", port: 8080 },
  });
});

afterAll(async () => {
  try {
    await testEnv.cleanup();
  } catch {
    // Known issue: Firestore settings conflict during cleanup
  }
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  // Seed admin user document
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", ADMIN_UID), {
      uid: ADMIN_UID,
      role: "admin",
      status: "approved",
      businessName: "Admin",
      phone: "+966500000000",
    });
    await setDoc(doc(db, "users", CUSTOMER_UID), {
      uid: CUSTOMER_UID,
      role: "customer",
      status: "approved",
      businessName: "Test Cafe",
      phone: "+966500000001",
    });
    await setDoc(doc(db, "users", OTHER_CUSTOMER_UID), {
      uid: OTHER_CUSTOMER_UID,
      role: "customer",
      status: "pending",
      businessName: "Other Cafe",
      phone: "+966500000002",
    });
  });
});

// ─── Products & Categories: public read, admin-only write ───

describe("Products", () => {
  test("unauthenticated can read products", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "products", "product-1"), { name_ar: "كوب", name_en: "Cup" });
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(unauth.firestore(), "products", "product-1")));
  });

  test("customer can read products", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "products", "product-1"), { name_ar: "كوب", name_en: "Cup" });
    });

    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertSucceeds(getDoc(doc(customer.firestore(), "products", "product-1")));
  });

  test("customer CANNOT write products", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(
      setDoc(doc(customer.firestore(), "products", "new-product"), { name_en: "Hack" })
    );
  });

  test("unauthenticated CANNOT write products", async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(
      setDoc(doc(unauth.firestore(), "products", "new-product"), { name_en: "Hack" })
    );
  });

  test("admin can write products", async () => {
    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertSucceeds(
      setDoc(doc(admin.firestore(), "products", "new-product"), { name_en: "New Cup" })
    );
  });
});

describe("Categories", () => {
  test("unauthenticated can read categories", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "categories", "cups"), { name_ar: "أكواب", name_en: "Cups" });
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(unauth.firestore(), "categories", "cups")));
  });

  test("customer CANNOT write categories", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(
      setDoc(doc(customer.firestore(), "categories", "hacked"), { name_en: "Hacked" })
    );
  });

  test("admin can write categories", async () => {
    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertSucceeds(
      setDoc(doc(admin.firestore(), "categories", "new-cat"), { name_en: "New" })
    );
  });
});

// ─── Users: read/write own; admin read/write all ───

describe("Users", () => {
  test("customer can read own user doc", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertSucceeds(getDoc(doc(customer.firestore(), "users", CUSTOMER_UID)));
  });

  test("customer CANNOT read another user's doc", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(getDoc(doc(customer.firestore(), "users", OTHER_CUSTOMER_UID)));
  });

  test("customer can update own user doc", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertSucceeds(
      updateDoc(doc(customer.firestore(), "users", CUSTOMER_UID), { businessName: "Updated Cafe" })
    );
  });

  test("customer CANNOT update another user's doc", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(
      updateDoc(doc(customer.firestore(), "users", OTHER_CUSTOMER_UID), { businessName: "Hacked" })
    );
  });

  test("admin can read any user doc", async () => {
    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertSucceeds(getDoc(doc(admin.firestore(), "users", CUSTOMER_UID)));
  });

  test("admin can read other customer doc", async () => {
    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertSucceeds(getDoc(doc(admin.firestore(), "users", OTHER_CUSTOMER_UID)));
  });

  test("admin can update any user doc", async () => {
    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertSucceeds(
      updateDoc(doc(admin.firestore(), "users", CUSTOMER_UID), { status: "approved" })
    );
  });

  test("unauthenticated CANNOT read users", async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauth.firestore(), "users", CUSTOMER_UID)));
  });
});

// ─── Orders: customer creates/reads own; admin all; status admin-only ───

describe("Orders", () => {
  const orderData = {
    customerId: CUSTOMER_UID,
    businessName: "Test Cafe",
    status: "pending",
    items: [{ productId: "p1", name: "Cup", quantity: 5, unitPrice: 48, lineTotal: 240 }],
    subtotal: 240,
    total: 240,
    paymentMethod: "cash_on_delivery",
    paymentStatus: "cod_unpaid",
  };

  test("customer can create own order with status pending", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertSucceeds(
      setDoc(doc(customer.firestore(), "orders", "order-1"), orderData)
    );
  });

  test("customer CANNOT create order with non-pending status", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(
      setDoc(doc(customer.firestore(), "orders", "order-2"), {
        ...orderData,
        status: "delivered",
      })
    );
  });

  test("customer CANNOT create order for another user", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(
      setDoc(doc(customer.firestore(), "orders", "order-3"), {
        ...orderData,
        customerId: OTHER_CUSTOMER_UID,
      })
    );
  });

  test("customer can read own order", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "orders", "order-1"), orderData);
    });

    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertSucceeds(getDoc(doc(customer.firestore(), "orders", "order-1")));
  });

  test("customer CANNOT read another customer's order", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "orders", "order-other"), {
        ...orderData,
        customerId: OTHER_CUSTOMER_UID,
      });
    });

    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(getDoc(doc(customer.firestore(), "orders", "order-other")));
  });

  test("customer CANNOT update order status to non-cancelled", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "orders", "order-1"), orderData);
    });

    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(
      updateDoc(doc(customer.firestore(), "orders", "order-1"), { status: "delivered" })
    );
  });

  test("customer CAN cancel own pending order", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "orders", "order-1"), orderData);
    });

    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertSucceeds(
      updateDoc(doc(customer.firestore(), "orders", "order-1"), {
        status: "cancelled",
        updatedAt: new Date(),
      })
    );
  });

  test("customer CANNOT cancel non-pending order", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "orders", "order-sent"), {
        ...orderData,
        status: "sent_to_supplier",
      });
    });

    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(
      updateDoc(doc(customer.firestore(), "orders", "order-sent"), {
        status: "cancelled",
        updatedAt: new Date(),
      })
    );
  });

  test("admin can read any order", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "orders", "order-1"), orderData);
    });

    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertSucceeds(getDoc(doc(admin.firestore(), "orders", "order-1")));
  });

  test("admin can update order status", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "orders", "order-1"), orderData);
    });

    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertSucceeds(
      updateDoc(doc(admin.firestore(), "orders", "order-1"), { status: "sent_to_supplier" })
    );
  });

  test("unauthenticated CANNOT read orders", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "orders", "order-1"), orderData);
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauth.firestore(), "orders", "order-1")));
  });

  test("orders CANNOT be deleted", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "orders", "order-1"), orderData);
    });

    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertFails(deleteDoc(doc(admin.firestore(), "orders", "order-1")));
  });
});

// ─── Suppliers: admin-only ───

describe("Suppliers", () => {
  test("customer CANNOT read suppliers", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "suppliers", "s1"), { name: "Test Supplier" });
    });

    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(getDoc(doc(customer.firestore(), "suppliers", "s1")));
  });

  test("unauthenticated CANNOT read suppliers", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "suppliers", "s1"), { name: "Test Supplier" });
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauth.firestore(), "suppliers", "s1")));
  });

  test("admin can read suppliers", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "suppliers", "s1"), { name: "Test Supplier" });
    });

    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertSucceeds(getDoc(doc(admin.firestore(), "suppliers", "s1")));
  });

  test("admin can write suppliers", async () => {
    const admin = testEnv.authenticatedContext(ADMIN_UID);
    await assertSucceeds(
      setDoc(doc(admin.firestore(), "suppliers", "s2"), { name: "New Supplier" })
    );
  });

  test("customer CANNOT write suppliers", async () => {
    const customer = testEnv.authenticatedContext(CUSTOMER_UID);
    await assertFails(
      setDoc(doc(customer.firestore(), "suppliers", "s3"), { name: "Hacked" })
    );
  });
});
