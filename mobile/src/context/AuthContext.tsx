import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'
import { api } from '../services/api'
import { GoogleAuthService, NotificationService } from '../services/firebase'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  fcmToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; salary?: number; billingCycleStartDay?: number }) => Promise<void>
  loginWithGoogle: (email?: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStoredSession()
    NotificationService.initFCM().then((fcm) => {
      if (fcm) setFcmToken(fcm)
    })
  }, [])

  const loadStoredSession = async () => {
    try {
      await api.init()
      const savedToken = await AsyncStorage.getItem('@auth_token')
      const savedUser = await AsyncStorage.getItem('@user_data')

      if (savedToken && savedUser) {
        setToken(savedToken)
        api.setToken(savedToken)
        setUser(JSON.parse(savedUser))
      }
    } catch (e) {
      console.warn('Error loading session:', e)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await api.login(email, password)
      setToken(res.token)
      setUser(res.user)
      api.setToken(res.token)
      await AsyncStorage.setItem('@auth_token', res.token)
      await AsyncStorage.setItem('@user_data', JSON.stringify(res.user))
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: { name: string; email: string; password: string; salary?: number; billingCycleStartDay?: number }) => {
    setLoading(true)
    try {
      const res = await api.register(data)
      setToken(res.token)
      setUser(res.user)
      api.setToken(res.token)
      await AsyncStorage.setItem('@auth_token', res.token)
      await AsyncStorage.setItem('@user_data', JSON.stringify(res.user))
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async (selectedEmail?: string) => {
    setLoading(true)
    try {
      const googleUser = await GoogleAuthService.signInWithGoogle(selectedEmail)
      const googleAuthUser: User = {
        id: 'google_usr_' + Date.now(),
        name: googleUser.name,
        email: googleUser.email,
        profileImage: googleUser.photoUrl,
        salary: 100000,
        currency: 'INR',
        billingCycleStartDay: 1,
        bio: 'Google Verified Account',
        notificationSettings: {
          billAlerts: true,
          budgetWarnings: true,
          weeklyReports: true,
          securityAlerts: true,
        },
      }
      const token = googleUser.idToken
      setToken(token)
      setUser(googleAuthUser)
      api.setToken(token)
      await AsyncStorage.setItem('@auth_token', token)
      await AsyncStorage.setItem('@user_data', JSON.stringify(googleAuthUser))
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setToken(null)
    setUser(null)
    api.setToken(null)
    await AsyncStorage.removeItem('@auth_token')
    await AsyncStorage.removeItem('@user_data')
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return
    const updated = { ...user, ...data }
    setUser(updated)
    await AsyncStorage.setItem('@user_data', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        fcmToken,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
