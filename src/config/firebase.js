import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyarzhmPQaZpXLnPfc7WIB14UZvvMyls0",
  authDomain: "skillx-6320a.firebaseapp.com",
  databaseURL: "https://skillx-6320a-default-rtdb.firebaseio.com",
  projectId: "skillx-6320a",
  storageBucket: "skillx-6320a.firebasestorage.app",
  messagingSenderId: "589730935355",
  appId: "1:589730935355:web:0ec788d274b90d1656621e",
  measurementId: "G-DKPHMQD36D"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const realtimeDb = getDatabase(app)
export const storage = getStorage(app)

// Connect to emulators in development (optional)
if (import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectDatabaseEmulator(realtimeDb, 'localhost', 9000)
  connectStorageEmulator(storage, 'localhost', 9199)
}

export default app
