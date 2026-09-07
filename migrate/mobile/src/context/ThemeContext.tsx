import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, ThemeColors } from '../theme/colors'

type ThemeMode = 'dark' | 'light'

interface ThemeContextType {
  theme: ThemeMode
  colors: ThemeColors
  toggleTheme: () => void
  setThemeMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    AsyncStorage.getItem('@app_theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved)
      }
    })
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    AsyncStorage.setItem('@app_theme', next)
  }

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(mode)
    AsyncStorage.setItem('@app_theme', mode)
  }

  const colors = Colors[theme]

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useAppTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider')
  }
  return context
}
