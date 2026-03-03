import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCtLO5UJdpcMmcuWkwq4OxdaqbWAfqLEls",
  authDomain: "navigator-14d38.firebaseapp.com",
  projectId: "navigator-14d38",
  storageBucket: "navigator-14d38.firebasestorage.app",
  messagingSenderId: "201177608105",
  appId: "1:201177608105:web:1d7ebd0b41d9de9d331eb8",
  measurementId: "G-383914L3RJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;