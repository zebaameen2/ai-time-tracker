// Your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBqiO80ApIt7qt9ABg0l7kBup8ld_jOoYY",
  authDomain: "ai-time-tracker-cc356.firebaseapp.com",
  projectId: "ai-time-tracker-cc356",
  storageBucket: "ai-time-tracker-cc356.appspot.com",
  messagingSenderId: "1056591097578",
  appId: "1:1056591097578:web:afe3eb6bcc9d3d413c7193"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export global firebase utilities
window.auth = firebase.auth();
// create a firestore instance and try to enable persistence for offline use
const dbInstance = firebase.firestore();
window.db = dbInstance;

// expose a flag indicating whether persistence was successfully enabled
window.firestorePersistenceEnabled = false;

// enable persistence (best-effort). In some browsers/environments this may fail.
dbInstance.enablePersistence()
  .then(function() {
    window.firestorePersistenceEnabled = true;
    console.info('Firestore persistence enabled.');
  })
  .catch(function (err) {
    window.firestorePersistenceEnabled = false;
    if (err && err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err && err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence is not available in this browser.');
    } else {
      console.warn('Failed to enable Firestore persistence:', err);
    }
  });
