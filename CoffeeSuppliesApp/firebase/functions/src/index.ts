import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// ─────────────────────────────────────────────────────────────
// Configuration (set via: firebase functions:config:set ...)
//
// admin.email       — admin's email for order notifications
// whatsapp.token    — WhatsApp Business API bearer token
// whatsapp.phone_id — WhatsApp Business phone number ID
// whatsapp.template — approved template name for order confirmation
// ─────────────────────────────────────────────────────────────

/**
 * onUserCreate — set default status: pending, role: customer.
 * Pending does not block ordering; it's for admin review only.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const userDoc = {
    uid: user.uid,
    phone: user.phoneNumber || "",
    email: user.email || "",
    businessName: "",
    contactName: "",
    role: "customer",
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("users").doc(user.uid).set(userDoc, { merge: true });
  functions.logger.info(`New user created: ${user.uid}, status: pending`);
});


/**
 * onOrderCreate — notify admin via both push (FCM) and email.
 * Also sends a WhatsApp order confirmation to the customer (T5.2).
 * Checks notification config for customer-facing notifications.
 */
export const onOrderCreate = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;
    const shortId = orderId.slice(-6);

    const itemCount = (order.items || []).reduce(
      (sum: number, item: { quantity: number }) => sum + item.quantity,
      0
    );
    const total = order.total || 0;
    const customerName = order.businessName || "Unknown";
    const customerId = order.customerId;

    // ── Load notification config ──
    let notificationConfig = {
      orderConfirmation: true,
      orderStatusChange: true,
      orderCancellation: true,
      promotions: false,
    };
    try {
      const configSnap = await db.collection("config").doc("notifications").get();
      if (configSnap.exists) {
        notificationConfig = { ...notificationConfig, ...configSnap.data() };
      }
    } catch (err) {
      functions.logger.warn("Could not load notification config, using defaults:", err);
    }

    // ── 1. Admin push notification (FCM topic) ──
    try {
      await admin.messaging().sendToTopic("admin_orders", {
        notification: {
          title: `طلب جديد #${shortId}`,
          body: `${customerName} — ${itemCount} منتجات — ${total} SAR`,
        },
        data: { orderId, type: "new_order" },
      });
      functions.logger.info("Admin push notification sent");
    } catch (err) {
      functions.logger.error("Failed to send admin push:", err);
    }

    // ── 2. Admin email notification ──
    // Uses the Firestore "mail" collection trigger pattern (Firebase Trigger Email extension).
    // If the extension isn't installed, this write is a no-op (the collection just accumulates).
    const adminEmail = functions.config().admin?.email;
    if (adminEmail) {
      try {
        await db.collection("mail").add({
          to: adminEmail,
          message: {
            subject: `[حاضر] طلب جديد #${shortId}`,
            text: [
              `طلب جديد من ${customerName}`,
              `عدد المنتجات: ${itemCount}`,
              `الإجمالي: ${total} SAR`,
              `طريقة الدفع: ${order.paymentMethod === "apple_pay" ? "Apple Pay" : "الدفع عند الاستلام"}`,
              ``,
              `عرض الطلب: https://console.firebase.google.com/project/hader-dcfcc/firestore/data/orders/${orderId}`,
            ].join("\n"),
          },
        });
        functions.logger.info(`Admin email queued to ${adminEmail}`);
      } catch (err) {
        functions.logger.error("Failed to queue admin email:", err);
      }
    }

    // ── 3. Customer WhatsApp confirmation (T5.2) ──
    // Only send if orderConfirmation is enabled in config
    if (!notificationConfig.orderConfirmation) {
      functions.logger.info("Order confirmation notifications disabled, skipping customer WhatsApp");
      return;
    }

    const whatsappConfig = functions.config().whatsapp;
    if (whatsappConfig?.token && whatsappConfig?.phone_id) {
      try {
        const userDoc = await db.collection("users").doc(customerId).get();
        const customerPhone = userDoc.data()?.phone;

        if (customerPhone) {
          await sendWhatsAppTemplate(
            whatsappConfig.phone_id,
            whatsappConfig.token,
            customerPhone,
            whatsappConfig.template || "order_confirmation",
            [shortId, String(itemCount), `${total} SAR`]
          );
          functions.logger.info(`WhatsApp confirmation sent to ${customerPhone}`);
        }
      } catch (err) {
        functions.logger.error("Failed to send WhatsApp confirmation:", err);
        // Fallback: no SMS in Phase One — WhatsApp failure is logged, not fatal.
      }
    }
  });


/**
 * onOrderUpdate — notify customer when status changes (push + WhatsApp).
 * Checks the notification config to determine which notifications are enabled.
 */
export const onOrderUpdate = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;

    // Only act on status changes
    if (before.status === after.status) return;

    const newStatus = after.status;
    const customerId = after.customerId;
    const shortId = orderId.slice(-6);

    // ── Check notification config ──
    let notificationConfig = {
      orderConfirmation: true,
      orderStatusChange: true,
      orderCancellation: true,
      promotions: false,
    };
    try {
      const configSnap = await db.collection("config").doc("notifications").get();
      if (configSnap.exists) {
        notificationConfig = { ...notificationConfig, ...configSnap.data() };
      }
    } catch (err) {
      functions.logger.warn("Could not load notification config, using defaults:", err);
    }

    // Skip if relevant notification type is disabled
    if (newStatus === "cancelled" && !notificationConfig.orderCancellation) return;
    if (newStatus !== "cancelled" && !notificationConfig.orderStatusChange) return;

    // Skip cancelled if customer initiated it (existing behavior)
    if (newStatus === "cancelled") return;

    let title = "";
    let body = "";

    switch (newStatus) {
      case "sent_to_supplier":
        title = "تم إرسال طلبك";
        body = `تم إرسال طلبك #${shortId} إلى المورد.`;
        break;
      case "delivered":
        title = "تم التوصيل";
        body = `تم توصيل طلبك #${shortId}!`;
        break;
      default:
        return;
    }

    // ── Push notification (FCM) to customer ──
    try {
      const userDoc = await db.collection("users").doc(customerId).get();
      const fcmToken = userDoc.data()?.fcmToken;

      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: { title, body },
          data: { orderId, status: newStatus },
        });
        functions.logger.info(`Status push sent to customer ${customerId}`);
      }
    } catch (err) {
      functions.logger.error("Failed to send customer push:", err);
    }

    // ── WhatsApp status update ──
    const whatsappConfig = functions.config().whatsapp;
    if (whatsappConfig?.token && whatsappConfig?.phone_id) {
      try {
        const userDoc = await db.collection("users").doc(customerId).get();
        const customerPhone = userDoc.data()?.phone;
        if (customerPhone) {
          const templateName = newStatus === "sent_to_supplier"
            ? "order_sent"
            : "order_delivered";
          await sendWhatsAppTemplate(
            whatsappConfig.phone_id,
            whatsappConfig.token,
            customerPhone,
            templateName,
            [shortId]
          );
          functions.logger.info(`WhatsApp status update sent to ${customerPhone}`);
        }
      } catch (err) {
        functions.logger.error("Failed to send WhatsApp status update:", err);
      }
    }
  });


// ─────────────────────────────────────────────────────────────
// WhatsApp Business API Helper
// Uses Meta's Cloud API to send approved template messages.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/
// ─────────────────────────────────────────────────────────────

async function sendWhatsAppTemplate(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  parameters: string[]
): Promise<void> {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to: to.replace("+", ""), // WhatsApp API expects without +
    type: "template",
    template: {
      name: templateName,
      language: { code: "ar" }, // Arabic template
      components: parameters.length > 0
        ? [
            {
              type: "body",
              parameters: parameters.map((value) => ({
                type: "text",
                text: value,
              })),
            },
          ]
        : undefined,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp API error ${response.status}: ${errorText}`);
  }
}
