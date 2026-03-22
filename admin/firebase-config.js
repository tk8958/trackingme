// admin/firebase-config.js

const firebaseConfig = {
  apiKey: "AIzaSyCAtO-UKHuC3Nz4GAvWJdm_BdgzwEvYhf4",
  authDomain: "drivertrackingapp-f52c9.firebaseapp.com",
  databaseURL: "https://drivertrackingapp-f52c9-default-rtdb.firebaseio.com",
  projectId: "drivertrackingapp-f52c9",
  storageBucket: "drivertrackingapp-f52c9.appspot.com",
  messagingSenderId: "760997527842",
  appId: "1:760997527842:web:0c3ef5f3862b264c00e57b"
};

// ✅ Initialize once
firebase.initializeApp(firebaseConfig);

// ✅ Global exports
window.auth = firebase.auth();
window.db = firebase.database();
