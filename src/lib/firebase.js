import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyDAjlr6bgBFyrdfag43sceLssRfR_See2Q",

  authDomain: "routine-5f98e.firebaseapp.com",

  projectId: "routine-5f98e",

  storageBucket: "routine-5f98e.firebasestorage.app",

  messagingSenderId: "968723915582",

  appId: "1:968723915582:web:83c1869dcb6f0c812bc26f",

  measurementId: "G-L7ZRS8BZKP"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);

// Initialize and export Firebase Authentication for use in other files
export const auth = getAuth(app);

// Initialize and export the Google Auth Provider for the sign-in button
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);