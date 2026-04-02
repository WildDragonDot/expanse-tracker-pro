import {
  formatBillingPeriod,
  getBillingPeriodForMonth,
  getBillingPeriodProgress,
  getCurrentBillingPeriod,
  getDaysRemainingInPeriod,
  getNextBillingPeriod,
  getPreviousBillingPeriod,
  isDateInBillingPeriod,
} from '@/lib/billingCycle'

describe('billingCycle', () => {
  it('returns the current period when reference day is on or after cycle start', () => {
    const period = getCurrentBillingPeriod(10, new Date(2024, 0, 20, 12, 0, 0, 0))

    expect(period.month).toBe(1)
    expect(period.year).toBe(2024)
    expect(period.startDate).toEqual(new Date(2024, 0, 10))
    expect(period.endDate).toEqual(new Date(2024, 1, 9, 23, 59, 59, 999))
  })

  it('falls back to the previous month when reference day is before cycle start', () => {
    const period = getCurrentBillingPeriod(15, new Date(2024, 0, 10, 12, 0, 0, 0))

    expect(period.month).toBe(12)
    expect(period.year).toBe(2023)
    expect(period.startDate).toEqual(new Date(2023, 11, 15))
    expect(period.endDate).toEqual(new Date(2024, 0, 14, 23, 59, 59, 999))
  })

  it('moves to previous and next billing periods across year boundaries', () => {
    const previous = getPreviousBillingPeriod(10, new Date(2024, 0, 20, 12, 0, 0, 0))
    const next = getNextBillingPeriod(10, new Date(2024, 11, 20, 12, 0, 0, 0))

    expect(previous.month).toBe(12)
    expect(previous.year).toBe(2023)
    expect(previous.startDate).toEqual(new Date(2023, 11, 10))

    expect(next.month).toBe(1)
    expect(next.year).toBe(2025)
    expect(next.startDate).toEqual(new Date(2025, 0, 10))
  })

  it('checks billing period boundaries inclusively', () => {
    const period = getBillingPeriodForMonth(1, 2024, 10)

    expect(isDateInBillingPeriod(new Date(2024, 0, 10), period)).toBe(true)
    expect(isDateInBillingPeriod(new Date(2024, 1, 9, 23, 59, 59, 999), period)).toBe(true)
    expect(isDateInBillingPeriod(new Date(2024, 1, 10), period)).toBe(false)
  })

  it('formats periods and reports remaining days and progress', () => {
    const period = getBillingPeriodForMonth(1, 2024, 10)
    const referenceDate = new Date(2024, 0, 20, 0, 0, 0, 0)

    expect(formatBillingPeriod(period)).toBe('Jan 10 - Feb 9, 2024')
    expect(getDaysRemainingInPeriod(10, referenceDate)).toBe(21)
    expect(getBillingPeriodProgress(10, referenceDate)).toBeGreaterThan(30)
    expect(getBillingPeriodProgress(10, referenceDate)).toBeLessThan(35)
  })
})
