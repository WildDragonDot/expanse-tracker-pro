/**
 * Firebase Authentication & User Profile Service
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase.config'
import { UserProfile } from './types'

export class FirebaseAuthService {
  /**
   * Get current authenticated user
   */
  public static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser
  }

  /**
   * Listen to auth state changes
   */
  public static onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback)
  }

  /**
   * Sign in with Email and Password
   */
  public static async signIn(email: string, pass: string): Promise<UserProfile> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass)
    return await this.syncUserProfile(cred.user)
  }

  /**
   * Register with Email and Password
   */
  public static async signUp(name: string, email: string, pass: string): Promise<UserProfile> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass)
    const userRef = doc(db, 'users', cred.user.uid)
    const profile: UserProfile = {
      id: cred.user.uid,
      name: name.trim(),
      email: cred.user.email || email,
      salary: 0,
      currency: 'INR',
      billingCycleStartDay: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await setDoc(userRef, profile, { merge: true })
    return profile
  }

  /**
   * Sign in with Google Id Token (Native Google Sign-In)
   */
  public static async signInWithGoogleIdToken(idToken: string, name?: string): Promise<UserProfile> {
    const credential = GoogleAuthProvider.credential(idToken)
    const cred = await signInWithCredential(auth, credential)
    return await this.syncUserProfile(cred.user, name)
  }

  /**
   * Sync user document in Firestore on login
   */
  public static async syncUserProfile(user: FirebaseUser, overrideName?: string): Promise<UserProfile> {
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)

    if (snap.exists()) {
      return snap.data() as UserProfile
    }

    const newProfile: UserProfile = {
      id: user.uid,
      name: overrideName || user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      profileImage: user.photoURL || undefined,
      salary: 0,
      currency: 'INR',
      billingCycleStartDay: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await setDoc(userRef, newProfile, { merge: true })
    return newProfile
  }

  /**
   * Update User Profile (Salary, currency, name, etc.)
   */
  public static async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  }

  /**
   * Send Password Reset Email
   */
  public static async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim())
  }

  /**
   * Sign Out
   */
  public static async signOut(): Promise<void> {
    await firebaseSignOut(auth)
  }
}
