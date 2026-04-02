import { rateLimiter } from '@/lib/rateLimiter'

describe('rateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('extracts client ip from standard proxy headers', () => {
    expect(
      rateLimiter.getClientIP({
        headers: new Headers({ 'cf-connecting-ip': '1.1.1.1' }),
      } as any)
    ).toBe('1.1.1.1')

    expect(
      rateLimiter.getClientIP({
        headers: new Headers({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' }),
      } as any)
    ).toBe('2.2.2.2')

    expect(
      rateLimiter.getClientIP({
        headers: new Headers({ 'x-real-ip': '4.4.4.4' }),
      } as any)
    ).toBe('4.4.4.4')
  })

  it('allows requests until the configured limit and then blocks the next one', () => {
    const identifier = 'rate-basic'
    const config = { maxRequests: 2, windowMs: 60_000 }

    expect(rateLimiter.check(identifier, config).allowed).toBe(true)
    jest.advanceTimersByTime(1_200)
    expect(rateLimiter.check(identifier, config).allowed).toBe(true)
    jest.advanceTimersByTime(1_500)
    expect(rateLimiter.check(identifier, config).allowed).toBe(true)
    jest.advanceTimersByTime(1_800)

    const blocked = rateLimiter.check(identifier, config)

    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)

    rateLimiter.reset(identifier)
  })

  it('gives authenticated users more room when burst allowance is configured', () => {
    const identifier = 'rate-authenticated'
    const config = { maxRequests: 2, windowMs: 60_000, burstAllowance: 2 }

    expect(rateLimiter.check(identifier, config, true).allowed).toBe(true)
    jest.advanceTimersByTime(1_100)
    expect(rateLimiter.check(identifier, config, true).allowed).toBe(true)
    jest.advanceTimersByTime(1_400)
    expect(rateLimiter.check(identifier, config, true).allowed).toBe(true)
    jest.advanceTimersByTime(1_700)
    expect(rateLimiter.check(identifier, config, true).allowed).toBe(true)
    jest.advanceTimersByTime(1_900)
    expect(rateLimiter.check(identifier, config, true).allowed).toBe(true)
    jest.advanceTimersByTime(2_100)
    expect(rateLimiter.check(identifier, config, true).allowed).toBe(false)

    rateLimiter.reset(identifier)
  })

  it('supports manual blocking, trust score lookup and reset', () => {
    const identifier = 'rate-manual'

    rateLimiter.markAuthenticated(identifier)
    expect(rateLimiter.getTrustScore(identifier)).toBeGreaterThanOrEqual(70)

    rateLimiter.block(identifier, 5_000)
    expect(rateLimiter.isBlocked(identifier)).toBe(true)

    jest.advanceTimersByTime(5_001)
    expect(rateLimiter.isBlocked(identifier)).toBe(false)

    rateLimiter.reset(identifier)
    expect(rateLimiter.getTrustScore(identifier)).toBe(50)
  })
})
