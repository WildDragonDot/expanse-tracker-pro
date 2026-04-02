/**
 * Utility functions for billing cycle calculations
 * Handles custom billing cycle start days for monthly calculations
 */

export interface BillingPeriod {
  startDate: Date
  endDate: Date
  month: number
  year: number
}

/**
 * Get the current billing period based on user's billing cycle start day
 * @param billingCycleStartDay - Day of month when billing cycle starts (1-31)
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns BillingPeriod object with start and end dates
 */
export function getCurrentBillingPeriod(
  billingCycleStartDay: number = 1,
  referenceDate: Date = new Date()
): BillingPeriod {
  const today = new Date(referenceDate)
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let startDate: Date
  let endDate: Date
  let month: number
  let year: number

  if (currentDay >= billingCycleStartDay) {
    // We're in the current billing period
    startDate = new Date(currentYear, currentMonth, billingCycleStartDay)
    endDate = new Date(currentYear, currentMonth + 1, billingCycleStartDay - 1, 23, 59, 59, 999)
    month = currentMonth + 1 // 1-12
    year = currentYear
  } else {
    // We're still in the previous billing period
    startDate = new Date(currentYear, currentMonth - 1, billingCycleStartDay)
    endDate = new Date(currentYear, currentMonth, billingCycleStartDay - 1, 23, 59, 59, 999)
    month = currentMonth === 0 ? 12 : currentMonth // Previous month (1-12)
    year = currentMonth === 0 ? currentYear - 1 : currentYear
  }

  return { startDate, endDate, month, year }
}

/**
 * Get billing period for a specific month and year
 * @param month - Month (1-12)
 * @param year - Year
 * @param billingCycleStartDay - Day of month when billing cycle starts (1-31)
 * @returns BillingPeriod object
 */
export function getBillingPeriodForMonth(
  month: number,
  year: number,
  billingCycleStartDay: number = 1
): BillingPeriod {
  // Convert month from 1-12 to 0-11 for Date constructor
  const monthIndex = month - 1

  const startDate = new Date(year, monthIndex, billingCycleStartDay)
  const endDate = new Date(year, monthIndex + 1, billingCycleStartDay - 1, 23, 59, 59, 999)

  return { startDate, endDate, month, year }
}

/**
 * Get the previous billing period
 * @param billingCycleStartDay - Day of month when billing cycle starts (1-31)
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns BillingPeriod object
 */
export function getPreviousBillingPeriod(
  billingCycleStartDay: number = 1,
  referenceDate: Date = new Date()
): BillingPeriod {
  const current = getCurrentBillingPeriod(billingCycleStartDay, referenceDate)
  
  // Go back one month
  const prevMonth = current.month === 1 ? 12 : current.month - 1
  const prevYear = current.month === 1 ? current.year - 1 : current.year

  return getBillingPeriodForMonth(prevMonth, prevYear, billingCycleStartDay)
}

/**
 * Get the next billing period
 * @param billingCycleStartDay - Day of month when billing cycle starts (1-31)
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns BillingPeriod object
 */
export function getNextBillingPeriod(
  billingCycleStartDay: number = 1,
  referenceDate: Date = new Date()
): BillingPeriod {
  const current = getCurrentBillingPeriod(billingCycleStartDay, referenceDate)
  
  // Go forward one month
  const nextMonth = current.month === 12 ? 1 : current.month + 1
  const nextYear = current.month === 12 ? current.year + 1 : current.year

  return getBillingPeriodForMonth(nextMonth, nextYear, billingCycleStartDay)
}

/**
 * Check if a date falls within a billing period
 * @param date - Date to check
 * @param period - Billing period
 * @returns boolean
 */
export function isDateInBillingPeriod(date: Date, period: BillingPeriod): boolean {
  const checkDate = new Date(date)
  return checkDate >= period.startDate && checkDate <= period.endDate
}

/**
 * Get all billing periods for a year
 * @param year - Year
 * @param billingCycleStartDay - Day of month when billing cycle starts (1-31)
 * @returns Array of BillingPeriod objects
 */
export function getBillingPeriodsForYear(
  year: number,
  billingCycleStartDay: number = 1
): BillingPeriod[] {
  const periods: BillingPeriod[] = []
  
  for (let month = 1; month <= 12; month++) {
    periods.push(getBillingPeriodForMonth(month, year, billingCycleStartDay))
  }
  
  return periods
}

/**
 * Format billing period as string
 * @param period - Billing period
 * @returns Formatted string (e.g., "Nov 11 - Dec 10, 2024")
 */
export function formatBillingPeriod(period: BillingPeriod): string {
  const startStr = period.startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
  const endStr = period.endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  return `${startStr} - ${endStr}`
}

/**
 * Get days remaining in current billing period
 * @param billingCycleStartDay - Day of month when billing cycle starts (1-31)
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Number of days remaining
 */
export function getDaysRemainingInPeriod(
  billingCycleStartDay: number = 1,
  referenceDate: Date = new Date()
): number {
  const period = getCurrentBillingPeriod(billingCycleStartDay, referenceDate)
  const today = new Date(referenceDate)
  const diffTime = period.endDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Get progress percentage through current billing period
 * @param billingCycleStartDay - Day of month when billing cycle starts (1-31)
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Percentage (0-100)
 */
export function getBillingPeriodProgress(
  billingCycleStartDay: number = 1,
  referenceDate: Date = new Date()
): number {
  const period = getCurrentBillingPeriod(billingCycleStartDay, referenceDate)
  const today = new Date(referenceDate)
  
  const totalTime = period.endDate.getTime() - period.startDate.getTime()
  const elapsedTime = today.getTime() - period.startDate.getTime()
  
  const progress = (elapsedTime / totalTime) * 100
  return Math.max(0, Math.min(100, progress))
}
