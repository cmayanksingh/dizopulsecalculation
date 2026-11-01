import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAD0qsyuzxaaApddNJB68wEiWsncKJyroU",
  authDomain: "dizo-calculation.firebaseapp.com",
  projectId: "dizo-calculation",
  storageBucket: "dizo-calculation.firebasestorage.app",
  messagingSenderId: "1069093344479",
  appId: "1:1069093344479:web:bcb6c35f1e8949183a456a",
  measurementId: "G-X6C8J1QM88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore Database
export const db = getFirestore(app);
export default app;
