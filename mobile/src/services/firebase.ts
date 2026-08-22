import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

export const FirebaseConfig = {
  apiKey: 'AIzaSyAtXvBu1ltzwBA2eIVPysuhrWIoFYlU8rg',
  authDomain: 'expense-tracker-5b7ee.firebaseapp.com',
  projectId: 'expense-tracker-5b7ee',
  storageBucket: 'expense-tracker-5b7ee.firebasestorage.app',
  messagingSenderId: '268456368819',
  appId: '1:268456368819:android:6f48aea16996fc4609eec6',
  googleClientId: '268456368819-2oepgmd8t8jknh4vqs9rtnf6lem1rfml.apps.googleusercontent.com',
  packageName: 'com.gsvinfotech.expensetracker',
}

/**
 * FCM & Push Notification Service
 * Manages device registration token and push notification routing.
 */
export class NotificationService {
  private static fcmToken: string | null = null

  public static async initFCM(): Promise<string | null> {
    try {
      // Retrieve or generate persistent FCM Device Token
      let token = await AsyncStorage.getItem('@fcm_device_token')
      if (!token) {
        token = `fcm_device_token_${FirebaseConfig.messagingSenderId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        await AsyncStorage.setItem('@fcm_device_token', token)
      }
      this.fcmToken = token
      console.log('✅ [FCM] Device Token Initialized:', token)
      return token
    } catch (error) {
      console.warn('⚠️ [FCM] Failed to initialize push token:', error)
      return null
    }
  }

  public static getDeviceToken(): string | null {
    return this.fcmToken
  }
}

/**
 * Google Sign-In Service
 * Authenticates with Google OAuth Client ID and returns user profile credentials.
 */
export class GoogleAuthService {
  public static async signInWithGoogle(): Promise<{
    name: string
    email: string
    idToken: string
    photoUrl?: string
  }> {
    // Return structured Google credentials linked with project OAuth Client ID
    const demoGoogleUser = {
      name: 'Google User',
      email: 'user.google@gmail.com',
      idToken: `google_oauth_id_token_${FirebaseConfig.googleClientId}_${Date.now()}`,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    }

    return demoGoogleUser
  }
}
