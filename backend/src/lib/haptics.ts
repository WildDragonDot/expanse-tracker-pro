/**
 * Haptic Feedback Utility
 * Provides vibration feedback for mobile devices to enhance UX
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

/**
 * Check if vibration API is supported
 */
export const isHapticsSupported = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator
}

/**
 * Trigger haptic feedback with predefined patterns
 */
export const haptic = (pattern: HapticPattern = 'light'): void => {
  if (!isHapticsSupported()) return

  // Check if user has disabled haptics in settings
  const hapticsEnabled = localStorage.getItem('hapticsEnabled')
  if (hapticsEnabled === 'false') return

  const patterns: Record<HapticPattern, number | number[]> = {
    light: 10,           // Quick tap
    medium: 20,          // Button press
    heavy: 30,           // Important action
    success: [10, 50, 10], // Double tap for success
    warning: [20, 100, 20], // Alert pattern
    error: [30, 100, 30, 100, 30], // Strong alert
    selection: 5,        // Very light for selections/scrolling
  }

  try {
    navigator.vibrate(patterns[pattern])
  } catch (error) {
    console.debug('Haptic feedback not available:', error)
  }
}

/**
 * Enable or disable haptics
 */
export const setHapticsEnabled = (enabled: boolean): void => {
  localStorage.setItem('hapticsEnabled', enabled.toString())
}

/**
 * Check if haptics are enabled
 */
export const isHapticsEnabled = (): boolean => {
  const setting = localStorage.getItem('hapticsEnabled')
  return setting !== 'false' // Default to enabled
}

/**
 * Haptic feedback for common UI interactions
 */
export const haptics = {
  // Button interactions
  buttonPress: () => haptic('medium'),
  buttonLight: () => haptic('light'),
  
  // Navigation
  tabSwitch: () => haptic('light'),
  pageTransition: () => haptic('light'),
  
  // Form interactions
  inputFocus: () => haptic('light'),
  inputSuccess: () => haptic('success'),
  inputError: () => haptic('error'),
  
  // Actions
  delete: () => haptic('warning'),
  save: () => haptic('success'),
  cancel: () => haptic('light'),
  
  // Notifications
  notificationSuccess: () => haptic('success'),
  notificationError: () => haptic('error'),
  notificationWarning: () => haptic('warning'),
  notificationInfo: () => haptic('light'),
  
  // Selections
  select: () => haptic('selection'),
  toggle: () => haptic('light'),
  
  // Gestures
  swipe: () => haptic('light'),
  longPress: () => haptic('medium'),
  
  // Special
  refresh: () => haptic('medium'),
  impact: () => haptic('heavy'),
}
