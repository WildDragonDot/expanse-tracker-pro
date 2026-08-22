import React, { useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext'
import { AppNavigator } from './src/navigation/AppNavigator'
import { SplashScreen } from './src/components/SplashScreen'

function RootApp() {
  const { theme } = useAppTheme()
  const [splashFinished, setSplashFinished] = useState(false)

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      {!splashFinished && <SplashScreen onFinish={() => setSplashFinished(true)} />}
    </SafeAreaProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootApp />
      </AuthProvider>
    </ThemeProvider>
  )
}
