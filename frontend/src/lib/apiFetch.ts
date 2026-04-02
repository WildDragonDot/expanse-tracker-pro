/**
 * API Fetch Utility
 * 
 * Yeh file backend API calls ke liye helper functions provide karti hai
 * 
 * Main Features:
 * - Backend URL configuration
 * - Path normalization
 * - Centralized API calling
 * 
 * Dependencies:
 * - Environment variables: NEXT_PUBLIC_BACKEND_URL
 * - Browser fetch API
 * 
 * Used By:
 * - api.ts: All API helper functions
 * - Components: Direct API calls
 * - Pages: Data fetching
 * 
 * Example Usage:
 * import { apiFetch } from '@/lib/apiFetch'
 * 
 * const response = await apiFetch('/api/expenses', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${token}`
 *   },
 *   body: JSON.stringify(data)
 * })
 */

// Default backend URL - production deployment ka URL
// Agar environment variable set nahi hai to yeh use hoga
const DEFAULT_BACKEND_URL = 'https://expanse-tracker-pro-1.onrender.com'

/**
 * Path Ko Normalize Karta Hai
 * 
 * Ensure karta hai ki path "/" se start ho
 * 
 * @param path - API path (with or without leading slash)
 * @returns Normalized path with leading slash
 * 
 * Examples:
 * normalizePath('api/expenses') → '/api/expenses'
 * normalizePath('/api/expenses') → '/api/expenses'
 * 
 * Used By:
 * - getApiUrl()
 */
function normalizePath(path: string) {
  // Check: Path already "/" se start hota hai ya nahi
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Backend API Ka Base URL Return Karta Hai
 * 
 * Priority order:
 * 1. NEXT_PUBLIC_BACKEND_URL (environment variable)
 * 2. BACKEND_URL (fallback environment variable)
 * 3. DEFAULT_BACKEND_URL (hardcoded fallback)
 * 
 * @returns Backend base URL without trailing slash
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_BACKEND_URL: Frontend se accessible (browser mein)
 * - BACKEND_URL: Server-side only
 * 
 * Examples:
 * Development: http://localhost:3001
 * Production: https://expanse-tracker-pro-1.onrender.com
 * 
 * Used By:
 * - getApiUrl()
 */
export function getApiBaseUrl() {
  // Environment variables se backend URL fetch karte hain
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||  // Browser mein available
    process.env.BACKEND_URL ||              // Server-side only
    DEFAULT_BACKEND_URL                     // Fallback

  // Trailing slash remove karte hain consistency ke liye
  // Example: "http://localhost:3001/" → "http://localhost:3001"
  return backendUrl.replace(/\/$/, '')
}

/**
 * Complete API URL Construct Karta Hai
 * 
 * Base URL aur path ko combine karke full URL banata hai
 * 
 * @param path - API endpoint path (e.g., '/api/expenses')
 * @returns Complete API URL
 * 
 * Process:
 * 1. Path ko normalize karta hai (leading slash ensure)
 * 2. Base URL fetch karta hai
 * 3. Dono ko combine karta hai
 * 
 * Examples:
 * getApiUrl('/api/expenses')
 *   → 'http://localhost:3001/api/expenses'
 * 
 * getApiUrl('api/user/profile')
 *   → 'http://localhost:3001/api/user/profile'
 * 
 * Used By:
 * - apiFetch()
 */
export function getApiUrl(path: string) {
  // Path ko normalize karte hain
  const normalizedPath = normalizePath(path)
  
  // Backend URL ke saath path combine karte hain
  // Always backend URL use karte hain (CORS properly configured hai)
  return `${getApiBaseUrl()}${normalizedPath}`
}

/**
 * API Call Karne Ka Main Function
 * 
 * Yeh wrapper function hai jo fetch API ko use karta hai
 * Automatically backend URL add kar deta hai
 * 
 * @param path - API endpoint path
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Fetch promise
 * 
 * Features:
 * - Automatic URL construction
 * - Standard fetch API interface
 * - Support for all HTTP methods
 * - Custom headers support
 * 
 * Common Usage Patterns:
 * 
 * 1. GET Request:
 * const response = await apiFetch('/api/expenses')
 * const data = await response.json()
 * 
 * 2. POST Request with Auth:
 * const response = await apiFetch('/api/expenses', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${token}`
 *   },
 *   body: JSON.stringify({ title: 'Grocery', amount: 5000 })
 * })
 * 
 * 3. DELETE Request:
 * const response = await apiFetch(`/api/expenses/${id}`, {
 *   method: 'DELETE',
 *   headers: {
 *     'Authorization': `Bearer ${token}`
 *   }
 * })
 * 
 * Error Handling:
 * try {
 *   const response = await apiFetch('/api/expenses')
 *   if (!response.ok) {
 *     throw new Error('API call failed')
 *   }
 *   const data = await response.json()
 * } catch (error) {
 *   console.error('Error:', error)
 * }
 * 
 * Used By:
 * - api.ts: All API helper functions
 * - Components: Direct API calls
 * - Pages: Server-side data fetching
 */
export function apiFetch(path: string, options?: RequestInit) {
  // Complete URL construct karke fetch call karte hain
  return fetch(getApiUrl(path), options)
}
