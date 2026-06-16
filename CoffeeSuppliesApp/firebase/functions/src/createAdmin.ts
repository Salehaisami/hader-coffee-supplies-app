/**
 * One-time script to create an admin user with email/password and set the admin custom claim.
 * 
 * Usage:
 *   cd firebase/functions
 *   npx ts-node src/createAdmin.ts <email> <password>
 *
 * Example:
 *   npx ts-node src/createAdmin.ts admin@haderapp.com MySecurePassword123
 */

import * as admin from "firebase-admin";

// Initialize with the project's service account (uses GOOGLE_APPLICATION_CREDENTIALS or default credentials)
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} else {
  admin.initializeApp({ projectId: "hader-dcfcc" });
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: npx ts-node src/createAdmin.ts <email> <password>");
    process.exit(1);
  }

  try {
    // Create the user
    const user = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    });

    console.log(`✓ User created: ${user.uid} (${email})`);

    // Set admin custom claim
    await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });
    console.log(`✓ Admin claim set for ${user.uid}`);

    // Also create the Firestore user doc with admin role
    await admin.firestore().collection("users").doc(user.uid).set({
      uid: user.uid,
      email,
      businessName: "Admin",
      contactName: "Admin",
      phone: "",
      role: "admin",
      status: "approved",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✓ Firestore user doc created`);

    console.log("\nDone! You can now sign in to the admin dashboard with these credentials.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }

  process.exit(0);
}

main();
