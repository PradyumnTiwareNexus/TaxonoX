/* ============================================
   TaxonoX — Firebase Configuration
   ============================================ */
'use strict';

const firebaseConfig = {
  apiKey: "AIzaSyBX17_wOm8Lq-NCc134k0gcn76jDXNAwyE",
  authDomain: "taxonox.firebaseapp.com",
  projectId: "taxonox",
  storageBucket: "taxonox.firebasestorage.app",
  messagingSenderId: "784877290121",
  appId: "1:784877290121:web:0cbb9cbd1b5f6b977dfc58",
  measurementId: "G-FBZ580CVNS"
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.auth = firebase.auth();
window.db   = firebase.firestore();

// Enable offline persistence for better UX
window.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
