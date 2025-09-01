require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { GoogleAuthProvider } = require('firebase/auth/web-extension');

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const GoogleProvider = new GoogleAuthProvider();

module.exports = { auth, GoogleProvider };
