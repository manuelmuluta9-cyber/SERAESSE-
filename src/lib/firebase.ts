/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBiLAjsd3HFiObPKvLK9t98Jwe6MSOL6Q4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "egman-play.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "egman-play",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "egman-play.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "476499821577",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:476499821577:web:20802a7f988658ca0664d8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-G8B2KDZX8T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Ativar persistência offline
enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Persistência falhou: Múltiplas abas abertas.');
    } else if (err.code === 'unimplemented') {
        console.warn('O navegador não suporta persistência local.');
    }
});

export const appId = 'egman-play-app';
