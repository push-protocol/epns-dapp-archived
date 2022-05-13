import { initializeApp } from "firebase/app";
import { envConfig } from "@project/contracts";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Initialize the Firebase app in the service worker by passing the generated config
var firebaseConfig = { ...envConfig.firebaseConfig };

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

export const getPushToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: envConfig.vapidKey,
    });
    return token;
  } catch (err) {
    console.log('\n\n\n\n')
    console.log("An error occurred while retrieving token. ", err);
    console.log('\n\n\n\n')
  }
};


export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
});