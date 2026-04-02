const DEFAULT_BACKEND_URL = 'http://localhost:3001'

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

export function getApiBaseUrl() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    DEFAULT_BACKEND_URL

  return backendUrl.replace(/\/$/, '')
}

export function getApiUrl(path: string) {
  const normalizedPath = normalizePath(path)

  // In the browser we prefer same-origin requests so Next rewrites,
  // CSP, and the service worker all stay aligned.
  if (typeof window !== 'undefined') {
    return normalizedPath
  }

  return `${getApiBaseUrl()}${normalizedPath}`
}

export function apiFetch(path: string, options?: RequestInit) {
  return fetch(getApiUrl(path), options)
}
