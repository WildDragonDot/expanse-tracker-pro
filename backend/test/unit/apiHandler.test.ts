jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init: ResponseInit = {}) => ({
      status: init.status ?? 200,
      headers: new Headers(init.headers),
      json: async () => body,
    }),
  },
}))

jest.mock('../../src/lib/rateLimiter', () => ({
  __esModule: true,
  rateLimiter: {
    getClientIP: jest.fn(),
    markAuthenticated: jest.fn(),
    check: jest.fn(),
  },
  RATE_LIMIT_CONFIGS: {
    api: { maxRequests: 3, windowMs: 60_000, blockDurationMs: 30_000 },
  },
}))

jest.mock('../../src/lib/security', () => ({
  __esModule: true,
  validateRequestHeaders: jest.fn(),
  isValidBodySize: jest.fn(),
  isSuspiciousInput: jest.fn(),
  logSecurityEvent: jest.fn(),
}))

jest.mock('../../src/lib/database', () => ({
  __esModule: true,
  verifyToken: jest.fn(),
}))

const { rateLimiter: mockRateLimiter } = jest.requireMock('../../src/lib/rateLimiter') as {
  rateLimiter: {
    getClientIP: jest.Mock
    markAuthenticated: jest.Mock
    check: jest.Mock
  }
}

const securityMocks = jest.requireMock('../../src/lib/security') as {
  validateRequestHeaders: jest.Mock
  isValidBodySize: jest.Mock
  isSuspiciousInput: jest.Mock
  logSecurityEvent: jest.Mock
}

const { verifyToken: mockVerifyToken } = jest.requireMock('../../src/lib/database') as {
  verifyToken: jest.Mock
}

import { handleApiError, secureResponse, withSecurity } from '@/lib/apiHandler'

describe('apiHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRateLimiter.getClientIP.mockReturnValue('127.0.0.1')
    securityMocks.validateRequestHeaders.mockReturnValue({ valid: true, errors: [] })
    securityMocks.isValidBodySize.mockReturnValue(true)
    securityMocks.isSuspiciousInput.mockReturnValue(false)
    mockRateLimiter.check.mockReturnValue({
      allowed: true,
      remaining: 2,
      resetTime: Date.now() + 60_000,
      trustScore: 70,
    })
    mockVerifyToken.mockReturnValue({ userId: 'user-1' })
  })

  function makeRequest(overrides: Partial<any> = {}) {
    return {
      method: 'POST',
      headers: new Headers({
        authorization: 'Bearer good-token',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Jest Test Agent)',
      }),
      cookies: { get: jest.fn() },
      nextUrl: { pathname: '/api/demo' },
      json: jest.fn().mockResolvedValue({ title: 'rent' }),
      ...overrides,
    }
  }

  it('passes sanitized control flow to the wrapped handler', async () => {
    const handler = jest.fn(async (request) => secureResponse({ body: (request as any).validatedBody }))
    const wrapped = withSecurity(handler, {
      rateLimit: 'api',
      requireAuth: true,
      validateBody: true,
      maxBodySizeKB: 5,
    })

    const response = await wrapped(makeRequest() as any)

    expect(mockRateLimiter.markAuthenticated).toHaveBeenCalledWith('127.0.0.1')
    expect(mockRateLimiter.check).toHaveBeenCalledWith(
      '127.0.0.1',
      expect.objectContaining({ maxRequests: 3 }),
      true
    )
    expect(handler).toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ body: { title: 'rent' } })
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
  })

  it('returns rate-limit responses with retry headers when blocked', async () => {
    mockRateLimiter.check.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 30_000,
      blocked: true,
      trustScore: 10,
    })

    const wrapped = withSecurity(async () => secureResponse({ ok: true }), { rateLimit: 'api' })
    const response = await wrapped(makeRequest() as any)

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringContaining('temporarily blocked'),
        trustScore: 10,
      })
    )
    expect(securityMocks.logSecurityEvent).toHaveBeenCalled()
  })

  it('rejects invalid headers, oversized bodies, suspicious payloads and missing auth', async () => {
    const wrapped = withSecurity(async () => secureResponse({ ok: true }), {
      validateBody: true,
      requireAuth: true,
    })

    securityMocks.validateRequestHeaders.mockReturnValueOnce({
      valid: false,
      errors: ['Invalid Content-Type header'],
    })
    const badHeaders = await wrapped(makeRequest() as any)
    expect(badHeaders.status).toBe(400)

    securityMocks.validateRequestHeaders.mockReturnValue({ valid: true, errors: [] })
    securityMocks.isValidBodySize.mockReturnValueOnce(false)
    const oversized = await wrapped(makeRequest() as any)
    expect(oversized.status).toBe(413)

    securityMocks.isValidBodySize.mockReturnValue(true)
    securityMocks.isSuspiciousInput.mockReturnValueOnce(true)
    const suspicious = await wrapped(makeRequest() as any)
    expect(suspicious.status).toBe(400)

    const missingAuth = await wrapped(
      makeRequest({
        headers: new Headers({
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0 (Jest Test Agent)',
        }),
      }) as any
    )
    expect(missingAuth.status).toBe(401)
  })

  it('wraps thrown errors in secure 500 responses', async () => {
    const wrapped = withSecurity(async () => {
      throw new Error('boom')
    })
    const response = await wrapped(makeRequest({ method: 'GET' }) as any)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' })

    const handled = handleApiError(new Error('unauthorized access'), '127.0.0.1', '/api/demo')
    expect(handled.status).toBe(500)
    expect(securityMocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'invalid_token',
        ip: '127.0.0.1',
        endpoint: '/api/demo',
      })
    )
  })
})
