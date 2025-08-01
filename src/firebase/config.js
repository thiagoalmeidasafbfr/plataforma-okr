import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANTE: Substitua este objeto pelas suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDx89T_wwy_LPccPPYDwbvvyT5Xq094KBg",
  authDomain: "plataforma-okr.firebaseapp.com",
  projectId: "plataforma-okr",
  storageBucket: "plataforma-okr.firebasestorage.app",
  messagingSenderId: "510952798716",
  appId: "1:510952798716:web:502a3d909f5416b7991a79",
  measurementId: "G-QK9G13LNH0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);