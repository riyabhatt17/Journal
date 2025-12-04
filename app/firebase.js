import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // NEW

const firebaseConfig = {
  apiKey: "AIzaSyCmFaXnr9k8XkEtL0LgxgTVzV-zZlWv0ow",
  authDomain: "warm-journal-f9e22.firebaseapp.com",
  projectId: "warm-journal-f9e22",
  storageBucket: "warm-journal-f9e22.firebasestorage.app",
  messagingSenderId: "627725390182",
  appId: "1:627725390182:web:2673e4e0ec5ad56ed078a7"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app); // Export Storage