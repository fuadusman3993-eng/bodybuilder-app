import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyC35oZEHsjoFFUZkAtbWvgqusjK5cRq5GU",
  authDomain: "fitpluse-60287.firebaseapp.com",
  projectId: "fitpluse-60287",
  storageBucket: "fitpluse-60287.firebasestorage.app",
  messagingSenderId: "934770172255",
  appId: "1:934770172255:web:068cae3348415e87b016ea",
  measurementId: "G-FG01RKNJQE"
};

// Prevent duplicate app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Guarantee browser local storage persistence on web across page reloads
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

export const db = getFirestore(app);
export default app;
