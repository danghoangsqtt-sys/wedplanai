
import { initializeApp, getApps, getApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import * as Firestore from "firebase/firestore";
import * as Storage from "firebase/storage";

const { getAuth, GoogleAuthProvider } = FirebaseAuth;
const { getFirestore } = Firestore;
const { getStorage } = Storage;

// Cấu hình mới sử dụng chuẩn VITE_
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
};

let app;
let auth;
let db;
let storage;
let googleProvider;

// Kiểm tra xem đã có API Key chưa để tránh lỗi màn hình trắng
if (firebaseConfig.apiKey && firebaseConfig.apiKey.indexOf("nhập_api_key") === -1) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Chưa điền mã Firebase API Key trong file .env.local!");
}

export { auth, db, storage, googleProvider };