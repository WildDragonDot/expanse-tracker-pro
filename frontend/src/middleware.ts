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

function getAllowedConnectSources() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'https://expanse-tracker-pro-1.onrender.com'

  const sources = new Set([
    "'self'",
    'https:',
    backendUrl,
    'https://expanse-tracker-pro-1.onrender.com',
    'http://127.0.0.1:3001',
    'ws://localhost:3000',
    'ws://127.0.0.1:3000',
  ])

  return Array.from(sources).join(' ')
}

function getContentSecurityPolicy() {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  const connectSources = getAllowedConnectSources()

  return (
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; " +
    "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    `connect-src ${connectSources} https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com; ` +
    "frame-src 'self' https://www.googletagmanager.com; " +
    "frame-ancestors 'none';"
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIP(request)
  
  // Block known malicious IPs
  if (blockedIPs.has(ip)) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  
  // Check for suspicious patterns
  if (containsSuspiciousPattern(pathname)) {
    console.warn(`Suspicious request detected from ${ip}: ${pathname}`)
    return new NextResponse('Bad Request', { status: 400 })
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
    return new NextResponse(
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
    )
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
  
  const contentSecurityPolicy = getContentSecurityPolicy()
  if (contentSecurityPolicy) {
    response.headers.set('Content-Security-Policy', contentSecurityPolicy)
  }
  
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
  
  return response
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
