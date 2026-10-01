import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyAVTCxIC9oCLM4xFJG8guvbhcxBqKcpDjU",
  authDomain: "detabase-d128a.firebaseapp.com",
  databaseURL: "https://detabase-d128a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "detabase-d128a",
  storageBucket: "detabase-d128a.firebasestorage.app",
  messagingSenderId: "355201792700",
  appId: "1:355201792700:web:2386ad6bcd18f176492eb9",
  measurementId: "G-T35FSD29VJ"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
