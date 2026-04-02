'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useEffect, useState } from 'react'

export default function ExpiryCheckerInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Initialize the expiry checker when app loads
    const initChecker = async () => {
      try {
        const response = await apiFetch('/api/init-expiry-checker')
        const data = await response.json()
        console.log('✅ Expiry checker:', data.message)
        setInitialized(true)
      } catch (error) {
        console.error('❌ Failed to initialize expiry checker:', error)
      }
    }

    initChecker()
  }, [])

  // This component doesn't render anything
  return null
}
