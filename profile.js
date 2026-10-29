import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, onSnapshot, runTransaction } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASINeHEf-gzsWe1n2s0vovN7sCvLSHKac",
  authDomain: "matrix-ai-f56d8.firebaseapp.com",
  projectId: "matrix-ai-f56d8",
  storageBucket: "matrix-ai-f56d8.firebasestorage.app",
  messagingSenderId: "455829803612",
  appId: "1:455829803612:web:dc154f07c67619e7e98c99"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { onAuthStateChanged, signOut, updateProfile };

const userRef = (uid) => doc(db, "users", uid);
const privRef = (uid) => doc(db, "users", uid, "private", "profile");
const nameRef = (username) => doc(db, "usernames", username);

// Public profile: { name, username, photo, createdAt, updatedAt }
export async function getProfile(uid) {
  const s = await getDoc(userRef(uid));
  return s.exists() ? s.data() : null;
}
// Live updates: pages using this change instantly when the profile is edited
export function watchProfile(uid, onData, onError) {
  return onSnapshot(userRef(uid), (s) => onData(s.exists() ? s.data() : null), onError);
}

// Private data (date of birth). Only the owner can read or write it.
export async function getPrivate(uid) {
  const s = await getDoc(privRef(uid));
  return s.exists() ? s.data() : {};
}
export function savePrivate(uid, data) { return setDoc(privRef(uid), data); }

// Saves the profile and reserves the username atomically (usernames are unique)
export function saveProfile(uid, { name, username, photo }) {
  return runTransaction(db, async (tx) => {
    const mine = await tx.get(userRef(uid));
    const claim = await tx.get(nameRef(username));
    if (claim.exists() && claim.data().uid !== uid) {
      const e = new Error("Username is already taken");
      e.code = "app/username-taken";
      throw e;
    }
    const old = mine.exists() ? mine.data() : null;
    if (old && old.username && old.username !== username) tx.delete(nameRef(old.username));
    if (!claim.exists()) tx.set(nameRef(username), { uid });
    tx.set(userRef(uid), {
      name, username, photo: photo || null,
      createdAt: (old && old.createdAt) || Date.now(),
      updatedAt: Date.now()
    });
  });
}

// Removes all profile data (used by "Delete profile data" in settings)
export async function deleteProfile(uid) {
  const p = await getProfile(uid);
  await deleteDoc(privRef(uid));
  if (p && p.username) { try { await deleteDoc(nameRef(p.username)); } catch (e) { /* ignore */ } }
  await deleteDoc(userRef(uid));
}
