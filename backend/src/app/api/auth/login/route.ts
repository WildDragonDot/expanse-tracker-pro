import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/database'
import { withSecurity, secureResponse, handleApiError } from '@/lib/apiHandler'
import { rateLimiter } from '@/lib/rateLimiter'
import { isValidEmail, logSecurityEvent } from '@/lib/security'

// Force dynamic rendering - authentication endpoint
export const dynamic = 'force-dynamic'

// Track failed login attempts per IP
const failedAttempts = new Map<string, number[]>()

export const POST = withSecurity(
  async (request: NextRequest) => {
    const ip = rateLimiter.getClientIP(request)
    
    try {
      // Use the validated body from withSecurity wrapper
      const { email, password } = (request as any).validatedBody || {}

      // Validate input
      if (!email || !password) {
        return secureResponse(
          { error: 'Email and password are required' },
          400
        )
      }

      // Validate email format
      if (!isValidEmail(email)) {
        return secureResponse(
          { error: 'Invalid email format' },
          400
        )
      }

      // Check for brute force attempts
      const attempts = failedAttempts.get(ip) || []
      const recentAttempts = attempts.filter(time => Date.now() - time < 15 * 60 * 1000)
      
      if (recentAttempts.length >= 5) {
        logSecurityEvent({
          type: 'brute_force',
          ip,
          endpoint: '/api/auth/login',
          details: { email, attempts: recentAttempts.length }
        })
        
        // Block IP temporarily
        rateLimiter.block(ip, 30 * 60 * 1000) // 30 minutes
        
        return secureResponse(
          { error: 'Too many failed login attempts. Please try again later.' },
          429
        )
      }

      // Attempt authentication
      const result = await authenticateUser(email, password)
      
      // Clear failed attempts on success
      failedAttempts.delete(ip)
      
      return secureResponse(result)
      
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Track failed attempt
      const attempts = failedAttempts.get(ip) || []
      attempts.push(Date.now())
      failedAttempts.set(ip, attempts)
      
      // Clean up old attempts
      setTimeout(() => {
        const current = failedAttempts.get(ip) || []
        const recent = current.filter(time => Date.now() - time < 15 * 60 * 1000)
        if (recent.length === 0) {
          failedAttempts.delete(ip)
        } else {
          failedAttempts.set(ip, recent)
        }
      }, 15 * 60 * 1000)
      
      return secureResponse(
        { error: 'Invalid email or password' },
        401
      )
    }
  },
  {
    rateLimit: 'auth',
    validateBody: true,
    maxBodySizeKB: 10
  }
)