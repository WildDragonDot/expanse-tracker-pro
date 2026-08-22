import AsyncStorage from '@react-native-async-storage/async-storage'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

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

/**
 * Google Sign-In Service
 * Authenticates with Google OAuth and retrieves real user credentials only.
 */
export class GoogleAuthService {
  public static async signInWithGoogle(): Promise<{
    name: string
    email: string
    idToken: string
    photoUrl?: string
  }> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'financetracker-pro',
      })

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(FirebaseConfig.googleClientId)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri)

      if (result.type === 'success' && result.url) {
        const url = result.url
        const tokenMatch =
          url.match(/[?#&]access_token=([^&]+)/) ||
          url.match(/[?#&]id_token=([^&]+)/)
        const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null

        if (accessToken) {
          const userRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })

          if (userRes.ok) {
            const userInfo = await userRes.json()
            if (userInfo && userInfo.email) {
              return {
                name: userInfo.name || userInfo.email.split('@')[0],
                email: userInfo.email,
                idToken: accessToken,
                photoUrl: userInfo.picture,
              }
            }
          }
        }
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Google Sign-In was cancelled.')
      }

      throw new Error('Google Sign-In was not completed. Please try again.')
    } catch (err: any) {
      if (err.message && err.message.includes('cancel')) {
        throw new Error('Google Sign-In was cancelled.')
      }
      throw new Error(err.message || 'Google Sign-In failed.')
    }
  }
}
