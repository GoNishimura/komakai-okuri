// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1agEGngAOBQHgyBuwLYyDyH6jHG8CrvU",
  authDomain: "tagged-koma.firebaseapp.com",
  projectId: "tagged-koma",
  storageBucket: "tagged-koma.appspot.com",
  messagingSenderId: "535112598190",
  appId: "1:535112598190:web:a03298ae57330623f7e33f",
  measurementId: "G-K0DCMHQNP4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);