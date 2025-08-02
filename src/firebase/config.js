import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDx89T_wwy_LPccPPYDwbvvyT5Xq094KBg",
  authDomain: "plataforma-okr.firebaseapp.com",
  projectId: "plataforma-okr",
  storageBucket: "plataforma-okr.firebasestorage.app",
  messagingSenderId: "510952798716",
  appId: "1:510952798716:web:502a3d909f5416b7991a79",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Inicializa as functions, especificando a região para maior robustez.
export const functions = getFunctions(app, 'us-central1');