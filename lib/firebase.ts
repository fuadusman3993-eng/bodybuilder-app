import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export default app;
