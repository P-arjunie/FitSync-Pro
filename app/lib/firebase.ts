import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCbXPSzknAAtFfzd7ZdD45U479lQFEFZ9M",
    authDomain: "fitsyncprochat.firebaseapp.com",
    projectId: "fitsyncprochat",
    storageBucket: "fitsyncprochat.firebasestorage.app",
    messagingSenderId: "338612115160",
    appId: "1:338612115160:web:f5b1b4927d6b709efee9ad",
    measurementId: "G-EPQ4NFCFLZ"
  };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db, app };