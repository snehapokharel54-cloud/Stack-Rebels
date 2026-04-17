import admin from "firebase-admin";

// In a real scenario, you'd load credentials from a JSON file or env var JSON string
// e.g. admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log("Firebase Admin initialized");
  } else {
    console.warn("Firebase config missing. Push notifications will be mocked.");
  }
} catch (error) {
  console.error("Firebase admin init error:", error.message);
}

export const sendPushNotification = async (token, title, body, data = {}) => {
  if (!token) return;
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.log(`[MOCK PUSH] to ${token}: ${title} - ${body}`);
    return;
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};
