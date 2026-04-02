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

const hasActiveUserGesture = (): boolean => {
  if (typeof navigator === 'undefined') return false

  const activation = navigator.userActivation
  if (!activation) return true

  return activation.isActive || activation.hasBeenActive
}

const hasUserInteracted = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem('hasUserInteracted') === 'true'
}

if (typeof window !== 'undefined') {
  const markInteraction = () => {
    window.sessionStorage.setItem('hasUserInteracted', 'true')
    window.removeEventListener('pointerdown', markInteraction)
    window.removeEventListener('keydown', markInteraction)
    window.removeEventListener('touchstart', markInteraction)
  }

  window.addEventListener('pointerdown', markInteraction, { once: true })
  window.addEventListener('keydown', markInteraction, { once: true })
  window.addEventListener('touchstart', markInteraction, { once: true })
}

/**
 * Trigger haptic feedback with predefined patterns
 */
export const haptic = (pattern: HapticPattern = 'light'): void => {
  if (!isHapticsSupported()) return
  if (!hasUserInteracted()) return
  if (!hasActiveUserGesture()) return

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
    const didVibrate = navigator.vibrate(patterns[pattern])
    if (!didVibrate) return
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
