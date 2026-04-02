/**
 * Ensures a minimum loading time for smooth UX
 * @param promise - The async operation to perform
 * @param minLoadingTime - Minimum time in milliseconds (default: 1000ms)
 * @returns Promise that resolves after both the operation and minimum time
 */
export async function withMinimumLoadingTime<T>(
  promise: Promise<T>,
  minLoadingTime: number = 1000
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await promise
    
    // Calculate remaining time to reach minimum loading time
    const elapsedTime = Date.now() - startTime
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
    
    // Wait for remaining time if needed
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    }
    
    return result
  } catch (error) {
    // Still wait minimum time even on error for consistent UX
    const elapsedTime = Date.now() - startTime
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    }
    
    throw error
  }
}

/**
 * Wrapper for data loading functions that ensures minimum loading time
 * @param loadFn - The async function that loads data
 * @param minLoadingTime - Minimum time in milliseconds (default: 1000ms)
 */
export async function loadWithMinimumTime<T>(
  loadFn: () => Promise<T>,
  minLoadingTime: number = 1000
): Promise<T> {
  return withMinimumLoadingTime(loadFn(), minLoadingTime)
}
