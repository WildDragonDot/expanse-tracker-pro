import {
  containsCommandInjection,
  containsPathTraversal,
  containsSQLInjection,
  containsXSS,
  detectBruteForce,
  generateCSRFToken,
  isCloudProviderIP,
  isStrongPassword,
  isSuspiciousInput,
  isValidBodySize,
  isValidEmail,
  isValidJWTFormat,
  sanitizeObject,
  sanitizeString,
  validateCSRFToken,
  validateRequestHeaders,
} from '@/lib/security'

describe('security', () => {
  beforeEach(() => {
    jest.useRealTimers()
  })

  it('detects common malicious payload patterns', () => {
    expect(containsSQLInjection("select * from users")).toBe(true)
    expect(containsXSS('<script>alert(1)</script>')).toBe(true)
    expect(containsPathTraversal('../etc/passwd')).toBe(true)
    expect(containsCommandInjection('rm -rf /; whoami')).toBe(true)
    expect(isSuspiciousInput('javascript:alert(1)')).toBe(true)
    expect(isSuspiciousInput('monthly grocery budget')).toBe(false)
  })

  it('sanitizes strings and nested objects', () => {
    expect(sanitizeString(' <img onload=alert(1)> javascript:foo ')).toBe('img alert(1) foo')

    expect(
      sanitizeObject({
        title: '<b>Rent</b>',
        nested: ['<script>x</script>', { note: 'javascript:bad' }],
      })
    ).toEqual({
      title: 'bRent/b',
      nested: ['scriptx/script', { note: 'bad' }],
    })
  })

  it('validates email, password, body size and jwt format', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('broken-email')).toBe(false)

    expect(isStrongPassword('Abcd1234!').valid).toBe(true)
    expect(isStrongPassword('weak').errors).toEqual(
      expect.arrayContaining([
        'Password must be at least 8 characters long',
        'Password must contain at least one uppercase letter',
        'Password must contain at least one number',
        'Password must contain at least one special character',
      ])
    )

    expect(isValidBodySize({ notes: 'x'.repeat(1024) }, 2)).toBe(true)
    expect(isValidBodySize({ notes: 'x'.repeat(4096) }, 2)).toBe(false)

    expect(isValidJWTFormat('a.b.c')).toBe(true)
    expect(isValidJWTFormat('abc.def')).toBe(false)
  })

  it('detects brute force attempts inside the configured window', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-10T10:00:00.000Z'))

    const now = Date.now()
    const attempts = [0, 10_000, 20_000, 30_000, 40_000].map((offset) => now - offset)

    expect(detectBruteForce(attempts)).toBe(true)
    expect(detectBruteForce([now - 70_000, now - 65_000, now - 61_000, now - 59_000])).toBe(false)
  })

  it('validates request headers and cloud provider IPs', () => {
    const validRequest = {
      method: 'POST',
      headers: new Headers({
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Jest Test Agent)',
      }),
    }

    const invalidRequest = {
      method: 'POST',
      headers: new Headers({
        'content-type': 'text/plain',
        'user-agent': 'bot',
      }),
    }

    expect(validateRequestHeaders(validRequest as any)).toEqual({ valid: true, errors: [] })
    expect(validateRequestHeaders(invalidRequest as any)).toEqual({
      valid: false,
      errors: ['Invalid Content-Type header', 'Invalid or missing User-Agent'],
    })

    expect(isCloudProviderIP('34.10.20.30')).toBe(true)
    expect(isCloudProviderIP('192.168.1.10')).toBe(false)
  })

  it('generates and validates csrf tokens', () => {
    const token = generateCSRFToken()

    expect(token).toHaveLength(64)
    expect(validateCSRFToken(token, token)).toBe(true)
    expect(validateCSRFToken(token, `${token}x`)).toBe(false)
    expect(validateCSRFToken('', token)).toBe(false)
  })
})
