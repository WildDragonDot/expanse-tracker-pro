import { NextRequest } from 'next/server'

/**
 * Security utilities for input validation and sanitization
 */

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|eval)\b)/gi,
  /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
  /('|(\\')|(--)|(%27)|(%23)|(#))/gi,
]

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /eval\(/gi,
  /expression\(/gi,
]

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.(\/|\\)/g,
  /\.\.\\/g,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
]

// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$()]/g,
  /\n|\r/g,
]

/**
 * Check if input contains SQL injection attempts
 */
export function containsSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Check if input contains XSS attempts
 */
export function containsXSS(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Check if input contains path traversal attempts
 */
export function containsPathTraversal(input: string): boolean {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Check if input contains command injection attempts
 */
export function containsCommandInjection(input: string): boolean {
  return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Comprehensive security check
 */
export function isSuspiciousInput(input: string): boolean {
  return (
    containsSQLInjection(input) ||
    containsXSS(input) ||
    containsPathTraversal(input) ||
    containsCommandInjection(input)
  )
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate request body size
 */
export function isValidBodySize(body: any, maxSizeKB: number = 100): boolean {
  const bodySize = JSON.stringify(body).length / 1024
  return bodySize <= maxSizeKB
}

/**
 * Check for brute force patterns
 */
export function detectBruteForce(attempts: number[], windowMs: number = 60000): boolean {
  const now = Date.now()
  const recentAttempts = attempts.filter(time => now - time < windowMs)
  return recentAttempts.length >= 5
}

/**
 * Validate JWT token format
 */
export function isValidJWTFormat(token: string): boolean {
  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

/**
 * Extract and validate request headers
 */
export function validateRequestHeaders(request: NextRequest): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check Content-Type for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      errors.push('Invalid Content-Type header')
    }
  }
  
  // Check for suspicious User-Agent
  const userAgent = request.headers.get('user-agent')
  if (!userAgent || userAgent.length < 10) {
    errors.push('Invalid or missing User-Agent')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

/**
 * Check if IP is from a known cloud provider (potential bot)
 */
export function isCloudProviderIP(ip: string): boolean {
  // Common cloud provider IP ranges (simplified)
  const cloudRanges = [
    /^3\./,      // AWS
    /^13\./,     // AWS
    /^18\./,     // AWS
    /^34\./,     // Google Cloud
    /^35\./,     // Google Cloud
    /^104\./,    // Google Cloud
    /^20\./,     // Azure
    /^40\./,     // Azure
    /^51\./,     // Azure
  ]
  
  return cloudRanges.some(range => range.test(ip))
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false
  return token === storedToken
}

/**
 * Log security event
 */
export function logSecurityEvent(event: {
  type: 'suspicious_input' | 'rate_limit' | 'brute_force' | 'blocked_ip' | 'invalid_token'
  ip: string
  endpoint: string
  details?: any
}) {
  const timestamp = new Date().toISOString()
  console.warn(`[SECURITY] ${timestamp} - ${event.type}`, {
    ip: event.ip,
    endpoint: event.endpoint,
    details: event.details
  })
  
  // In production, send to logging service (e.g., Sentry, LogRocket, etc.)
  // Example: Sentry.captureMessage(`Security Event: ${event.type}`, { level: 'warning', extra: event })
}
