import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, OAuthProvider,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyASINeHEf-gzsWe1n2s0vovN7sCvLSHKac",
  authDomain: "matrix-ai-f56d8.firebaseapp.com",
  projectId: "matrix-ai-f56d8",
  storageBucket: "matrix-ai-f56d8.firebasestorage.app",
  messagingSenderId: "455829803612",
  appId: "1:455829803612:web:dc154f07c67619e7e98c99"
};

const DASHBOARD = "dashboard.html";
const app = initializeApp(firebaseConfig);
const fbAuth = getAuth(app);

// Redirect to the dashboard if the user is already signed in
onAuthStateChanged(fbAuth, (user) => { if (user) location.href = DASHBOARD; });

// Display a status message inside the login card
function msg(text, isError = true) {
  let el = document.getElementById("authMsg");
  if (!el) {
    el = document.createElement("p");
    el.id = "authMsg";
    el.style.cssText = "font-size:12.5px;text-align:center;margin-top:12px;line-height:18px";
    document.querySelector(".card").insertBefore(el, document.querySelector(".footer"));
  }
  el.style.color = isError ? "#ff6b6b" : "#7be495";
  el.textContent = text;
}

// User-friendly error messages
const errors = {
  "auth/popup-closed-by-user": "The sign-in window was closed. Please try again.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Please allow popups and try again.",
  "auth/unauthorized-domain": "This domain is not authorized for sign-in.",
  "auth/operation-not-allowed": "This sign-in method is not enabled.",
  "auth/invalid-api-key": "Invalid Firebase configuration. Please check the API key.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/quota-exceeded": "The daily email limit has been reached. Please sign in with Google or try again tomorrow.",
  "auth/network-request-failed": "Network error. Please check your connection and try again."
};
const friendly = (e) => errors[e.code] || ("Something went wrong (" + (e.code || e.message) + ").");

async function social(provider) {
  try { await signInWithPopup(fbAuth, provider); }
  catch (e) { msg(friendly(e)); }
}

// Button handler: auth('google' | 'apple' | 'phone')
window.auth = (p) => {
  if (p === "google") return social(new GoogleAuthProvider());
  if (p === "apple") return social(new OAuthProvider("apple.com"));
  msg("Phone sign-in is not available yet.");
};

// Email handler: sends a passwordless sign-in link
window.go = async () => {
  const input = document.getElementById("email");
  const email = input.value.trim();
  if (!email.includes("@")) { input.style.borderColor = "#ff4444"; return; }
  input.style.borderColor = "";
  try {
    await sendSignInLinkToEmail(fbAuth, email, {
      url: location.origin + "/login.html",
      handleCodeInApp: true
    });
    localStorage.setItem("emailForSignIn", email);
    msg("A sign-in link has been sent to your email. Please check your inbox and spam folder.", false);
  } catch (e) { msg(friendly(e)); }
};

// Complete sign-in when the user returns through the email link
if (isSignInWithEmailLink(fbAuth, location.href)) {
  const email = localStorage.getItem("emailForSignIn") || prompt("Please confirm your email address to complete sign-in.");
  signInWithEmailLink(fbAuth, email, location.href)
    .then(() => localStorage.removeItem("emailForSignIn"))
    .catch((e) => msg(friendly(e)));
}
