import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'
import { api } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; salary?: number; billingCycleStartDay?: number }) => Promise<void>
  loginWithDemo: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStoredSession()
  }, [])

  const loadStoredSession = async () => {
    try {
      await api.init()
      const savedToken = await AsyncStorage.getItem('@auth_token')
      const savedUser = await AsyncStorage.getItem('@user_data')

      if (savedToken && savedUser) {
        setToken(savedToken)
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
    } finally {
      setLoading(false)
    }
  }

  const loginWithDemo = async () => {
    const demoUser: User = {
      id: 'demo_user_101',
      name: 'Dragon (Demo VIP)',
      email: 'wikeba2568@alexida.com',
      salary: 125000,
      currency: 'INR',
      billingCycleStartDay: 1,
      bio: 'Fintech Pro Demo Account',
      notificationSettings: {
        billAlerts: true,
        budgetWarnings: true,
        weeklyReports: true,
        securityAlerts: true,
      },
    }
    const mockToken = 'mock_jwt_demo_token_' + Date.now()
    setToken(mockToken)
    setUser(demoUser)
    api.setToken(mockToken)
    await AsyncStorage.setItem('@auth_token', mockToken)
    await AsyncStorage.setItem('@user_data', JSON.stringify(demoUser))
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
        login,
        register,
        loginWithDemo,
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
