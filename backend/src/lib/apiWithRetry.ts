// Enhanced API client with retry logic and better error messages

interface RetryConfig {
  maxRetries?: number
  retryDelay?: number
  retryOn?: number[]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn: [408, 429, 500, 502, 503, 504] // Retry on these status codes
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = {}
): Promise<Response> {
  const { maxRetries, retryDelay, retryOn } = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= (maxRetries || 0); attempt++) {
    try {
      const response = await fetch(url, options)

      // If response is ok or shouldn't retry, return it
      if (response.ok || !retryOn?.includes(response.status)) {
        return response
      }

      // If we should retry, throw to trigger retry logic
      lastError = new ApiError(
        `Request failed with status ${response.status}`,
        response.status
      )

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, (retryDelay || 1000) * Math.pow(2, attempt)))
    } catch (error) {
      lastError = error as Error

      // Don't retry on network errors on last attempt
      if (attempt === maxRetries) {
        throw new ApiError(
          'Network error. Please check your internet connection.',
          0,
          'NETWORK_ERROR'
        )
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, (retryDelay || 1000) * Math.pow(2, attempt)))
    }
  }

  throw lastError || new Error('Request failed')
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input.'
      case 401:
        return 'You need to log in to continue.'
      case 403:
        return 'You don\'t have permission to perform this action.'
      case 404:
        return 'The requested resource was not found.'
      case 408:
        return 'Request timeout. Please try again.'
      case 429:
        return 'Too many requests. Please wait a moment.'
      case 500:
        return 'Server error. Please try again later.'
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again.'
      default:
        return error.message || 'An unexpected error occurred.'
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return 'Network error. Please check your internet connection.'
    }
    return error.message
  }

  return 'An unexpected error occurred.'
}
