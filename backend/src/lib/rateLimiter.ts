import { NextRequest } from 'next/server'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  blockDurationMs?: number
  burstAllowance?: number // Allow burst for legitimate users
}

interface RateLimitRecord {
  count: number
  resetTime: number
  blocked?: boolean
  blockUntil?: number
  violations: number // Track violations
  lastRequestTime: number // Track request timing
  requestTimings: number[] // Track request pattern
}

interface UserBehavior {
  totalRequests: number
  violations: number
  lastViolation: number
  trustScore: number // 0-100, higher is more trusted
  isAuthenticated: boolean
}

class RateLimiter {
  private store = new Map<string, RateLimitRecord>()
  private suspiciousIPs = new Map<string, number>()
  private userBehavior = new Map<string, UserBehavior>()
  
  constructor() {
    // Cleanup old entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000)
    }
  }
  
  private cleanup() {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime && (!value.blocked || now > (value.blockUntil || 0))) {
        this.store.delete(key)
      }
    }
    
    // Cleanup suspicious IPs older than 1 hour
    for (const [ip, timestamp] of this.suspiciousIPs.entries()) {
      if (now - timestamp > 60 * 60 * 1000) {
        this.suspiciousIPs.delete(ip)
      }
    }
  }
  
  getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    return cfConnectingIP || forwarded?.split(',')[0] || realIP || 'unknown'
  }
  
  // Calculate trust score based on user behavior
  private calculateTrustScore(identifier: string): number {
    const behavior = this.userBehavior.get(identifier)
    if (!behavior) return 50 // Neutral for new users
    
    let score = 100
    
    // Reduce score for violations
    score -= behavior.violations * 10
    
    // Increase score for authenticated users
    if (behavior.isAuthenticated) {
      score += 20
    }
    
    // Reduce score for recent violations
    const timeSinceViolation = Date.now() - behavior.lastViolation
    if (timeSinceViolation < 60 * 1000) { // Within 1 minute
      score -= 30
    } else if (timeSinceViolation < 5 * 60 * 1000) { // Within 5 minutes
      score -= 15
    }
    
    // Increase score for consistent, normal usage
    if (behavior.totalRequests > 50 && behavior.violations === 0) {
      score += 10
    }
    
    return Math.max(0, Math.min(100, score))
  }
  
  // Detect if request pattern is suspicious (bot-like behavior)
  private isSuspiciousPattern(record: RateLimitRecord): boolean {
    if (!record.requestTimings || record.requestTimings.length < 3) {
      return false
    }
    
    // Check if requests are too uniform (bot-like)
    const intervals: number[] = []
    for (let i = 1; i < record.requestTimings.length; i++) {
      intervals.push(record.requestTimings[i] - record.requestTimings[i - 1])
    }
    
    // Calculate variance
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / intervals.length
    
    // Very low variance = bot-like (requests at exact intervals)
    // Very high frequency = potential attack
    const isUniform = variance < 100 && avg < 1000 // Less than 1 second apart with low variance
    const isTooFast = avg < 100 // Less than 100ms between requests
    
    return isUniform || isTooFast
  }
  
  check(identifier: string, config: RateLimitConfig, isAuthenticated: boolean = false): { 
    allowed: boolean
    remaining: number
    resetTime: number
    blocked?: boolean
    trustScore?: number
  } {
    const now = Date.now()
    const record = this.store.get(identifier)
    
    // Update user behavior
    let behavior = this.userBehavior.get(identifier)
    if (!behavior) {
      behavior = {
        totalRequests: 0,
        violations: 0,
        lastViolation: 0,
        trustScore: 50,
        isAuthenticated
      }
      this.userBehavior.set(identifier, behavior)
    }
    behavior.totalRequests++
    behavior.isAuthenticated = isAuthenticated
    
    // Calculate trust score
    const trustScore = this.calculateTrustScore(identifier)
    behavior.trustScore = trustScore
    
    // Check if IP is blocked
    if (record?.blocked && record.blockUntil && now < record.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockUntil,
        blocked: true,
        trustScore
      }
    }
    
    // Reset if window expired
    if (!record || now > record.resetTime) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
        violations: 0,
        lastRequestTime: now,
        requestTimings: [now]
      })
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
        trustScore
      }
    }
    
    // Track request timing
    record.lastRequestTime = now
    if (!record.requestTimings) record.requestTimings = []
    record.requestTimings.push(now)
    // Keep only last 10 timings
    if (record.requestTimings.length > 10) {
      record.requestTimings.shift()
    }
    
    // Adjust limit based on trust score and authentication
    let effectiveLimit = config.maxRequests
    
    // High trust users get more allowance
    if (trustScore >= 80) {
      effectiveLimit = Math.floor(config.maxRequests * 1.5) // 50% more
    } else if (trustScore >= 60) {
      effectiveLimit = Math.floor(config.maxRequests * 1.2) // 20% more
    }
    
    // Authenticated users get burst allowance
    if (isAuthenticated && config.burstAllowance) {
      effectiveLimit += config.burstAllowance
    }
    
    // Check for suspicious patterns
    const isSuspicious = this.isSuspiciousPattern(record)
    if (isSuspicious) {
      effectiveLimit = Math.floor(config.maxRequests * 0.5) // Reduce limit by 50%
      console.warn(`Suspicious pattern detected for ${identifier}`)
    }
    
    // Check if limit exceeded
    if (record.count >= effectiveLimit) {
      record.violations = (record.violations || 0) + 1
      behavior.violations++
      behavior.lastViolation = now
      
      // Mark as suspicious if repeatedly hitting limit
      const suspiciousCount = (this.suspiciousIPs.get(identifier) || 0) + 1
      this.suspiciousIPs.set(identifier, suspiciousCount)
      
      // Only block if:
      // 1. Low trust score (likely attacker)
      // 2. Multiple violations in short time
      // 3. Suspicious pattern detected
      const shouldBlock = (
        (trustScore < 30 && suspiciousCount >= 3) || // Low trust + violations
        (isSuspicious && suspiciousCount >= 2) || // Suspicious pattern
        (suspiciousCount >= 10) // Too many violations regardless
      )
      
      if (shouldBlock && config.blockDurationMs) {
        record.blocked = true
        record.blockUntil = now + config.blockDurationMs
        console.warn(`IP ${identifier} blocked for ${config.blockDurationMs}ms (Trust: ${trustScore}, Violations: ${suspiciousCount}, Suspicious: ${isSuspicious})`)
      }
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        blocked: record.blocked,
        trustScore
      }
    }
    
    // Increment counter
    record.count++
    return {
      allowed: true,
      remaining: effectiveLimit - record.count,
      resetTime: record.resetTime,
      trustScore
    }
  }
  
  reset(identifier: string) {
    this.store.delete(identifier)
    this.suspiciousIPs.delete(identifier)
    this.userBehavior.delete(identifier)
  }
  
  // Mark user as authenticated (increases trust)
  markAuthenticated(identifier: string) {
    let behavior = this.userBehavior.get(identifier)
    if (!behavior) {
      behavior = {
        totalRequests: 0,
        violations: 0,
        lastViolation: 0,
        trustScore: 70, // Start with higher trust for authenticated users
        isAuthenticated: true
      }
    } else {
      behavior.isAuthenticated = true
      behavior.trustScore = Math.min(100, behavior.trustScore + 20)
    }
    this.userBehavior.set(identifier, behavior)
  }
  
  // Get user's trust score
  getTrustScore(identifier: string): number {
    return this.calculateTrustScore(identifier)
  }
  
  block(identifier: string, durationMs: number) {
    const now = Date.now()
    this.store.set(identifier, {
      count: 0,
      resetTime: now + durationMs,
      blocked: true,
      blockUntil: now + durationMs,
      violations: 0,
      lastRequestTime: now,
      requestTimings: []
    })
  }
  
  isBlocked(identifier: string): boolean {
    const record = this.store.get(identifier)
    if (!record?.blocked || !record.blockUntil) return false
    return Date.now() < record.blockUntil
  }
}

export const rateLimiter = new RateLimiter()

// Preset configurations with intelligent limits
export const RATE_LIMIT_CONFIGS = {
  auth: {
    maxRequests: 5, // Base limit for unauthenticated
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 60 * 60 * 1000, // 1 hour block after violations
    burstAllowance: 0 // No burst for auth endpoints
  },
  api: {
    maxRequests: process.env.NODE_ENV === 'development' ? 200 : 60, // Higher limit in dev
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 10 * 60 * 1000, // 10 minutes block
    burstAllowance: process.env.NODE_ENV === 'development' ? 100 : 40 // More burst in dev
  },
  strict: {
    maxRequests: process.env.NODE_ENV === 'development' ? 50 : 10, // Higher limit in dev
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    burstAllowance: process.env.NODE_ENV === 'development' ? 25 : 5 // More burst in dev
  },
  upload: {
    maxRequests: process.env.NODE_ENV === 'development' ? 50 : 20, // Higher limit in dev
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 15 * 60 * 1000, // 15 minutes block
    burstAllowance: process.env.NODE_ENV === 'development' ? 25 : 10 // More burst in dev
  },
  generous: {
    maxRequests: process.env.NODE_ENV === 'development' ? 300 : 100, // Higher limit in dev
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block
    burstAllowance: process.env.NODE_ENV === 'development' ? 150 : 50 // More burst in dev
  }
}
