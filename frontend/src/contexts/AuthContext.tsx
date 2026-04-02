'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  profileImage?: string
  notificationSettings?: {
    pushNotifications: boolean
    emailNotifications: boolean
    expenseAlerts: boolean
    budgetWarnings: boolean
    weeklyReports: boolean
    monthlyReports: boolean
    transactionUpdates: boolean
    securityAlerts: boolean
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, salary?: number) => Promise<void>
  logout: () => void
  updateUser: (updatedUser: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Minimum loading time to prevent flash
    const minLoadTime = setTimeout(() => {
      setLoading(false)
    }, 500)

    // Only access localStorage on client-side after mount
    try {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
        } catch (parseError) {
          console.error('Error parsing saved user:', parseError)
          // Clear corrupted data
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error)
    }

    // Clear minimum loading time if everything loads quickly
    const quickLoad = setTimeout(() => {
      clearTimeout(minLoadTime)
      setLoading(false)
    }, 100)

    // Listen for unauthorized events from API
    const handleUnauthorized = () => {
      setUser(null)
      try {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      } catch (error) {
        console.error('Error clearing localStorage:', error)
      }
    }

    // Listen for visibility change to refresh auth state
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // App became visible, check if user is still valid
        try {
          const token = localStorage.getItem('token')
          const savedUser = localStorage.getItem('user')
          if (!token || !savedUser) {
            setUser(null)
          }
        } catch (error) {
          console.error('Error checking auth on visibility change:', error)
        }
      }
    }

    window.addEventListener('unauthorized', handleUnauthorized)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearTimeout(minLoadTime)
      clearTimeout(quickLoad)
      window.removeEventListener('unauthorized', handleUnauthorized)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password)
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } catch (error: any) {
      // Clear any existing user data on login failure
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      throw error
    }
  }

  const register = async (name: string, email: string, password: string, salary?: number) => {
    try {
      const data = await api.register(name, email, password, salary)
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } catch (error: any) {
      // Clear any existing user data on registration failure
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      throw error
    }
  }

  const logout = () => {
    api.clearToken()
    setUser(null)
    localStorage.removeItem('user')
  }

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser }
      setUser(newUser)
      localStorage.setItem('user', JSON.stringify(newUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
