// Scripts for firebase and firebase messaging
// Scripts for firebase and firebase messaging
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize the Firebase app in the service worker by passing the generated config
var firebaseConfig = {
  apiKey: "AIzaSyClOk4qP0ttFW-BPnXy7WT920xfdXSbFu8",
  authDomain: "epns-internal.firebaseapp.com",
  databaseURL: "https://epns-internal.firebaseio.com",
  projectId: "epns-internal",
  storageBucket: "epns-internal.appspot.com",
  messagingSenderId: "755180533582",
  appId: "1:755180533582:web:752ff8db31905506b7d01f",
  measurementId: "G-ZJH2T7R9S1",
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("Received background message ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ##
