import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMqWntEvyi6Fc2yuattkntleYC3--uHqM",
  authDomain: "sagstyringssystem.firebaseapp.com",
  projectId: "sagstyringssystem",
  storageBucket: "sagstyringssystem.firebasestorage.app",
  messagingSenderId: "949528592788",
  appId: "1:949528592788:web:04276140690f4aefd88f81",
  measurementId: "G-8CSM5TLFGG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);