'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthLoader from './AuthLoader'

interface PublicRouteProps {
  children: React.ReactNode
  redirectIfAuthenticated?: boolean
}

// Global flag to track if auth has been checked at least once
let hasAuthBeenChecked = false

export default function PublicRoute({ children, redirectIfAuthenticated = true }: PublicRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      hasAuthBeenChecked = true
      if (user && redirectIfAuthenticated) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, redirectIfAuthenticated, router])

  // Only show loader on very first auth check (initial app load)
  // After that, never show loader when navigating between public pages
  if (loading && !hasAuthBeenChecked) {
    return <AuthLoader />
  }

  // Show loader while redirecting to dashboard (only if user is authenticated)
  if (user && redirectIfAuthenticated && !loading) {
    return <AuthLoader />
  }

  // User is not authenticated or redirect is disabled, show the public content
  return <>{children}</>
}
