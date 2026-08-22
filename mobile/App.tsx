import React, { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import * as NavigationBar from 'expo-navigation-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext'
import { AppNavigator } from './src/navigation/AppNavigator'
import { SplashScreen } from './src/components/SplashScreen'

function RootApp() {
  const { theme } = useAppTheme()
  const [splashFinished, setSplashFinished] = useState(false)

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        const navBar = NavigationBar as any
        navBar.setPositionAsync?.('absolute')?.catch?.(() => {})
        navBar.setBackgroundColorAsync?.('#00000000')?.catch?.(() => {})
        navBar.setVisibilityAsync?.('hidden')?.catch?.(() => {})
        navBar.setBehaviorAsync?.('overlay-swipe')?.catch?.(() => {})
      } catch (e) {}
    }
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar hidden={true} />
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
