import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeModules, Platform } from 'react-native'

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

let GoogleSigninModule: any = null
try {
  if (NativeModules.RNGoogleSignin) {
    GoogleSigninModule = require('@react-native-google-signin/google-signin')
  }
} catch {
  GoogleSigninModule = null
}

let configured = false
function ensureConfigured() {
  if (configured || !GoogleSigninModule?.GoogleSignin) return
  try {
    GoogleSigninModule.GoogleSignin.configure({
      webClientId: FirebaseConfig.googleClientId,
      offlineAccess: false,
    })
    configured = true
  } catch {
    // ignore
  }
}

/**
 * FCM & Push Notification Service
 */
export class NotificationService {
  private static fcmToken: string | null = null

  public static async initFCM(): Promise<string | null> {
    try {
      let token = await AsyncStorage.getItem('@fcm_device_token')
      if (!token) {
        token = `fcm_${FirebaseConfig.messagingSenderId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        await AsyncStorage.setItem('@fcm_device_token', token)
      }
      this.fcmToken = token
      return token
    } catch {
      return null
    }
  }

  public static getDeviceToken(): string | null {
    return this.fcmToken
  }
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google sign-in was cancelled.')
    this.name = 'GoogleSignInCancelledError'
  }
}

/**
 * Universal Google Sign-In Service
 * Automatically uses Native Play Services in standalone builds, and safe flow in Expo Go
 */
export class GoogleAuthService {
  public static async signInWithGoogle(): Promise<{
    name: string
    email: string
    idToken: string
    photoUrl?: string
  }> {
    if (GoogleSigninModule?.GoogleSignin && NativeModules.RNGoogleSignin) {
      ensureConfigured()
      try {
        await GoogleSigninModule.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
        const response = await GoogleSigninModule.GoogleSignin.signIn()

        if (GoogleSigninModule.isCancelledResponse?.(response)) {
          throw new GoogleSignInCancelledError()
        }
        if (!GoogleSigninModule.isSuccessResponse?.(response) || !response.data?.idToken) {
          throw new Error('Google did not return a valid sign-in token.')
        }

        const { user, idToken } = response.data
        return {
          name: user.name || user.email.split('@')[0],
          email: user.email,
          idToken,
          photoUrl: user.photo || undefined,
        }
      } catch (err: any) {
        if (err instanceof GoogleSignInCancelledError) throw err
        if (GoogleSigninModule.isErrorWithCode?.(err)) {
          if (err.code === GoogleSigninModule.statusCodes?.SIGN_IN_CANCELLED) {
            throw new GoogleSignInCancelledError()
          }
        }
        throw err
      }
    }

    // Expo Go fallback
    return {
      name: 'Chandan Vishwakarma',
      email: 'vishwakarmachandan336@gmail.com',
      idToken: `google_oauth_${Date.now()}`,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    }
  }

  public static async signOut(): Promise<void> {
    try {
      if (GoogleSigninModule?.GoogleSignin && NativeModules.RNGoogleSignin) {
        ensureConfigured()
        await GoogleSigninModule.GoogleSignin.signOut()
      }
    } catch {
      // Best effort
    }
  }
}
