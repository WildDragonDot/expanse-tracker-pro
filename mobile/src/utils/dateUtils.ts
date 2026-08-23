/**
 * Universal Date and Time Formatting Utility
 * Handles timezone conversions, human-readable relative dates, and local formats.
 */

export function parseDate(dateInput: string | Date | undefined | null): Date {
  if (!dateInput) return new Date()
  if (dateInput instanceof Date) return dateInput
  const parsed = new Date(dateInput)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

/**
 * Formats a transaction timestamp into a clean, human-friendly local string.
 * Example: "Today, 11:50 AM", "Yesterday, 04:15 PM", "21 Aug, 02:30 PM", or "15 Dec 2025"
 */
export function formatTransactionDate(dateInput: string | Date | undefined | null): string {
  const d = parseDate(dateInput)
  const now = new Date()

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()

  // Format time (e.g. 11:50 AM)
  const timeStr = d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  // Format month and day (e.g. 23 Aug)
  const dayMonthStr = d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })

  if (isToday) {
    return `Today, ${timeStr}`
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`
  }

  const isCurrentYear = d.getFullYear() === now.getFullYear()
  if (isCurrentYear) {
    return `${dayMonthStr}, ${timeStr}`
  }

  return `${dayMonthStr} ${d.getFullYear()}`
}

/**
 * Standard date display: "23 Aug 2026"
 */
export function formatLocalDate(dateInput: string | Date | undefined | null): string {
  const d = parseDate(dateInput)
  return d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Standard date and time display: "23 Aug 2026, 11:50 AM"
 */
export function formatLocalDateTime(dateInput: string | Date | undefined | null): string {
  const d = parseDate(dateInput)
  const datePart = d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timePart = d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return `${datePart}, ${timePart}`
}

/**
 * Relative time ago display: "2m ago", "1h ago", "Yesterday", "3d ago"
 */
export function formatTimeAgo(dateInput: string | Date | undefined | null): string {
  const d = parseDate(dateInput)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffSec < 45) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 172800) return 'Yesterday'
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`

  return formatLocalDate(d)
}
