import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from '@/lib/dateUtils'

describe('dateUtils', () => {
  it('normalizes a date to the start and end of day', () => {
    const date = new Date(2024, 2, 14, 16, 45, 12, 321)

    expect(startOfDay(date)).toEqual(new Date(2024, 2, 14, 0, 0, 0, 0))
    expect(endOfDay(date)).toEqual(new Date(2024, 2, 14, 23, 59, 59, 999))
  })

  it('calculates week boundaries from a mid-week date', () => {
    const date = new Date(2024, 2, 13, 9, 30, 0, 0)

    expect(startOfWeek(date)).toEqual(new Date(2024, 2, 10, 0, 0, 0, 0))
    expect(endOfWeek(date)).toEqual(new Date(2024, 2, 16, 23, 59, 59, 999))
  })

  it('builds month and year boundaries correctly, including leap years', () => {
    expect(startOfMonth(2024, 2)).toEqual(new Date(2024, 1, 1, 0, 0, 0, 0))
    expect(endOfMonth(2024, 2)).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999))
    expect(startOfYear(2024)).toEqual(new Date(2024, 0, 1, 0, 0, 0, 0))
    expect(endOfYear(2024)).toEqual(new Date(2024, 11, 31, 23, 59, 59, 999))
  })
})
