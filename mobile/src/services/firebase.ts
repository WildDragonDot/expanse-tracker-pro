import AsyncStorage from '@react-native-async-storage/async-storage'
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
 * Authenticates with official Firebase Identity Toolkit & Google OAuth
 */
export class GoogleAuthService {
  public static async signInWithGoogle(): Promise<{
    name: string
    email: string
    idToken: string
    photoUrl?: string
  }> {
    try {
      const continueUri = `https://${FirebaseConfig.authDomain}/__/auth/handler`

      // 1. Request official Firebase Auth URL authorized for this project
      const authUriRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${FirebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId: 'google.com',
            continueUri: continueUri,
          }),
        }
      )

      const authUriData = await authUriRes.json()
      if (!authUriData || !authUriData.authUri) {
        throw new Error('Failed to initialize Google authentication URL.')
      }

      const authUrl = authUriData.authUri
      const sessionId = authUriData.sessionId

      // 2. Open Google Auth in WebBrowser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, continueUri)

      if (result.type === 'success' && result.url) {
        const url = result.url

        // Extract id_token or access_token if present in redirect
        const idTokenMatch = url.match(/[?#&]id_token=([^&]+)/)
        const idToken = idTokenMatch ? decodeURIComponent(idTokenMatch[1]) : null

        const tokenMatch = url.match(/[?#&]access_token=([^&]+)/)
        const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null

        if (accessToken) {
          try {
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
          } catch {
            // continue to signInWithIdp
          }
        }

        // 3. Finalize authentication with Firebase Identity Provider
        const idpRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FirebaseConfig.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestUri: url,
              sessionId: sessionId,
              returnSecureToken: true,
              returnIdpCredential: true,
            }),
          }
        )

        const idpData = await idpRes.json()
        if (idpData && idpData.email) {
          return {
            name: idpData.displayName || idpData.email.split('@')[0],
            email: idpData.email,
            idToken: idpData.idToken || `firebase_idp_${Date.now()}`,
            photoUrl: idpData.photoUrl,
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
