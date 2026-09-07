/**
 * Firebase Configuration for Mobile App & Web
 * Connected to Project: expense-tracker-5b7ee
 */
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const firebaseConfig = {
  apiKey: 'AIzaSyAtXvBu1ltzwBA2eIVPysuhrWIoFYlU8rg',
  authDomain: 'expense-tracker-5b7ee.firebaseapp.com',
  projectId: 'expense-tracker-5b7ee',
  storageBucket: 'expense-tracker-5b7ee.firebasestorage.app',
  messagingSenderId: '268456368819',
  appId: '1:268456368819:android:6f48aea16996fc4609eec6',
  googleClientId: '268456368819-2oepgmd8t8jknh4vqs9rtnf6lem1rfml.apps.googleusercontent.com',
  packageName: 'com.gsvinfotech.expensetracker',
}

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize Auth with AsyncStorage for React Native persistence
let authInstance: any
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  })
} catch {
  authInstance = getAuth(app)
}

export const auth = authInstance
export const db = getFirestore(app)
export const storage = getStorage(app)
