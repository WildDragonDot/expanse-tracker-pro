import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, RATE_LIMIT_CONFIGS } from './rateLimiter'
import { isSuspiciousInput, isValidBodySize, logSecurityEvent, validateRequestHeaders } from './security'

interface ApiHandlerOptions {
  rateLimit?: keyof typeof RATE_LIMIT_CONFIGS
  requireAuth?: boolean
  validateBody?: boolean
  maxBodySizeKB?: number
}

/**
 * Secure API handler wrapper with built-in security checks
 */
export function withSecurity(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
) {
  return async (request: NextRequest, context?: any) => {
    const ip = rateLimiter.getClientIP(request)
    const pathname = request.nextUrl.pathname
    
    try {
      // 1. Check authentication status first (for rate limiting)
      let isAuthenticated = false
      let userId: string | undefined
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const { verifyToken } = await import('./database')
          const decoded = verifyToken(token)
          if (decoded) {
            isAuthenticated = true
            userId = decoded.userId
            // Mark user as authenticated for better rate limits
            rateLimiter.markAuthenticated(ip)
          }
        } catch (error) {
          // Will be handled by auth check below if requireAuth is true
        }
      }
      
      // 2. Rate Limiting (with authentication awareness)
      if (options.rateLimit) {
        const config = RATE_LIMIT_CONFIGS[options.rateLimit]
        const result = rateLimiter.check(ip, config, isAuthenticated)
        
        if (!result.allowed) {
          logSecurityEvent({
            type: 'rate_limit',
            ip,
            endpoint: pathname,
            details: { 
              blocked: result.blocked,
              trustScore: result.trustScore,
              authenticated: isAuthenticated
            }
          })
          
          return NextResponse.json(
            { 
              error: result.blocked 
                ? 'Your IP has been temporarily blocked due to suspicious activity. Please contact support if you believe this is an error.'
                : 'Too many requests. Please slow down and try again later.',
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
              trustScore: result.trustScore
            },
            { 
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
                'X-RateLimit-Limit': String(config.maxRequests),
                'X-RateLimit-Remaining': String(result.remaining),
                'X-RateLimit-Reset': String(result.resetTime),
                'X-Trust-Score': String(result.trustScore || 50)
              }
            }
          )
        }
      }
      
      // 2. Validate request headers
      const headerValidation = validateRequestHeaders(request)
      if (!headerValidation.valid) {
        logSecurityEvent({
          type: 'suspicious_input',
          ip,
          endpoint: pathname,
          details: { errors: headerValidation.errors }
        })
        
        return NextResponse.json(
          { error: 'Invalid request headers' },
          { status: 400 }
        )
      }
      
      // 3. Validate and sanitize request body
      if (options.validateBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json()
          
          // Check body size
          if (!isValidBodySize(body, options.maxBodySizeKB)) {
            return NextResponse.json(
              { error: 'Request body too large' },
              { status: 413 }
            )
          }
          
          // Check for suspicious input
          const bodyString = JSON.stringify(body)
          if (isSuspiciousInput(bodyString)) {
            logSecurityEvent({
              type: 'suspicious_input',
              ip,
              endpoint: pathname,
              details: { body: bodyString.substring(0, 200) }
            })
            
            return NextResponse.json(
              { error: 'Invalid input detected' },
              { status: 400 }
            )
          }
          
          // Attach sanitized body to request
          ;(request as any).validatedBody = body
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
          )
        }
      }
      
      // 4. Check authentication if required
      if (options.requireAuth) {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                      request.cookies.get('token')?.value
        
        if (!token) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          )
        }
      }
      
      // 5. Execute the actual handler
      return await handler(request, context)
      
    } catch (error: any) {
      console.error('API Handler Error:', error)
      
      // Don't expose internal errors to client
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Create a secure API response with security headers
 */
export function secureResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

/**
 * Handle errors securely without exposing sensitive information
 */
export function handleApiError(error: any, ip: string, endpoint: string): NextResponse {
  console.error('API Error:', error)
  
  // Log security-relevant errors
  if (error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
    logSecurityEvent({
      type: 'invalid_token',
      ip,
      endpoint,
      details: { error: error.message }
    })
  }
  
  // Generic error response
  return secureResponse(
    { error: 'An error occurred processing your request' },
    500
  )
}
