import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

// Initialize Firebase with config from global variable
const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Wrap the listener setup inside DOMContentLoaded to ensure button exists
window.addEventListener('DOMContentLoaded', () => {
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (!googleLoginBtn) {
    console.error('Google login button not found!');
    return;
  }

  googleLoginBtn.addEventListener('click', async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const idToken = await user.getIdToken();

      const res = await fetch('/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = '/';
      } else {
        alert('Google login failed. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Google sign-in error. See console for details.');
    }
  });
});
