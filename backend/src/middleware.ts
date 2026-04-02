import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// IP-based rate limiting configuration
const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes for auth
  api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute for API
  strict: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute for sensitive endpoints
}

// Blocked IPs (can be loaded from database)
const blockedIPs = new Set<string>()

// Suspicious patterns
const suspiciousPatterns = [
  /(\.\.|\/\/)/g, // Path traversal
  /(union|select|insert|update|delete|drop|create|alter|exec|script)/gi, // SQL injection
  /<script|javascript:|onerror=/gi, // XSS attempts
  /\.\.(\/|\\)/g, // Directory traversal
]

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIP || 'unknown'
}

function isRateLimited(ip: string, limitType: keyof typeof RATE_LIMITS): boolean {
  const now = Date.now()
  const limit = RATE_LIMITS[limitType]
  const key = `${ip}:${limitType}`
  
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs })
    return false
  }
  
  if (record.count >= limit.maxRequests) {
    return true
  }
  
  record.count++
  return false
}

function containsSuspiciousPattern(url: string): boolean {
  return suspiciousPatterns.some(pattern => pattern.test(url))
}

function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

function getAllowedOrigin(request: NextRequest) {
  const requestOrigin = request.headers.get('origin')
  const configuredOrigins = [
    process.env.CORS_ORIGIN,
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean)

  if (requestOrigin && configuredOrigins.includes(requestOrigin)) {
    return requestOrigin
  }

  return configuredOrigins[0] || '*'
}

function applyCorsHeaders(response: NextResponse, request: NextRequest) {
  const allowedOrigin = getAllowedOrigin(request)
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Vary', 'Origin')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With')
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIP(request)

  if (request.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), request)
  }
  
  // Block known malicious IPs
  if (blockedIPs.has(ip)) {
    return applyCorsHeaders(new NextResponse('Forbidden', { status: 403 }), request)
  }
  
  // Check for suspicious patterns
  if (containsSuspiciousPattern(pathname)) {
    console.warn(`Suspicious request detected from ${ip}: ${pathname}`)
    return applyCorsHeaders(new NextResponse('Bad Request', { status: 400 }), request)
  }
  
  // Apply rate limiting based on endpoint
  let limitType: keyof typeof RATE_LIMITS = 'api'
  
  if (pathname.startsWith('/api/auth')) {
    limitType = 'auth'
  } else if (
    pathname.includes('/password') ||
    pathname.includes('/delete') ||
    pathname.includes('/admin')
  ) {
    limitType = 'strict'
  }
  
  if (isRateLimited(ip, limitType)) {
    const limit = RATE_LIMITS[limitType]
    return applyCorsHeaders(new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(limit.windowMs / 1000)
      }), 
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(limit.windowMs / 1000)),
          'X-RateLimit-Limit': String(limit.maxRequests),
          'X-RateLimit-Remaining': '0',
        }
      }
    ), request)
  }
  
  // Security headers
  const response = NextResponse.next()
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none';"
  )
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  
  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  return applyCorsHeaders(response, request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
