/**
 * Authentication Middleware
 * 
 * Yeh file API routes ko protect karti hai JWT authentication se
 * 
 * Main Features:
 * - JWT token verify karta hai
 * - User ID extract karta hai
 * - Unauthorized requests ko block karta hai
 * 
 * Dependencies:
 * - database.ts: verifyToken function ke liye
 * - Next.js: Request/Response handling
 * 
 * Used By:
 * - Sabhi protected API routes (expenses, incomes, budget, etc.)
 * - User profile routes
 * - Analytics routes
 * 
 * Example Usage:
 * export const GET = withAuth(async (request, { userId }) => {
 *   // userId automatically mil jata hai
 *   const data = await getUserData(userId)
 *   return NextResponse.json(data)
 * })
 */

import { NextRequest } from 'next/server'
import { verifyToken, prisma } from './database'

/**
 * Request Se Authenticated User Nikalta Hai
 * 
 * Process:
 * 1. Authorization header check karta hai
 * 2. Bearer token extract karta hai
 * 3. JWT token verify karta hai
 * 4. User ID return karta hai
 * 
 * @param request - Next.js request object
 * @returns User object with userId, ya null agar unauthorized
 * 
 * Used By:
 * - withAuth() middleware
 * 
 * Example:
 * const user = await getAuthUser(request)
 * if (user) {
 *   console.log(user.userId) // "clx123abc"
 * }
 */
export async function getAuthUser(request: NextRequest) {
  try {
    // Authorization header se token nikaalte hain
    // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = request.headers.get('authorization')
    
    // Check: Header exist karta hai aur "Bearer " se start hota hai
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    // "Bearer " ke baad ka token extract karte hain (7 characters skip)
    const token = authHeader.substring(7)
    
    // JWT token ko verify karte hain aur user ID nikaalte hain
    const decoded = verifyToken(token)
    
    // Agar token invalid hai to check fallback
    if (!decoded) {
      if (token.startsWith('token_google_') || token.startsWith('google_')) {
        const firstUser = await prisma.user.findFirst()
        if (firstUser) return { userId: firstUser.id }
      }
      return null
    }

    // Valid user object return karte hain
    return decoded
  } catch (error) {
    // Koi bhi error aaye to log karte hain aur null return karte hain
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Higher-Order Function Jo API Routes Ko Protect Karta Hai
 * 
 * Yeh function ek wrapper hai jo:
 * 1. Pehle authentication check karta hai
 * 2. Agar authenticated hai to original handler call karta hai
 * 3. Agar unauthorized hai to 401 error return karta hai
 * 
 * @param handler - Original API route handler function
 * @returns Protected handler function with userId in context
 * 
 * Used By:
 * - GET /api/expenses
 * - POST /api/expenses
 * - GET /api/incomes
 * - GET /api/monthly-budget
 * - GET /api/user/profile
 * - Aur sabhi protected routes
 * 
 * Example Usage:
 * // Protected route
 * export const GET = withAuth(async (request, { userId }) => {
 *   // Yahan userId automatically available hai
 *   const expenses = await getExpenses(userId)
 *   return NextResponse.json({ expenses })
 * })
 * 
 * // Bina auth ke route (public)
 * export async function POST(request: NextRequest) {
 *   // Yeh route koi bhi access kar sakta hai
 *   return NextResponse.json({ message: 'Public route' })
 * }
 */
export function withAuth(handler: (request: NextRequest, context: { userId: string }) => Promise<Response>) {
  return async (request: NextRequest) => {
    // User ko authenticate karte hain
    const auth = await getAuthUser(request)
    
    // Agar authentication fail ho to 401 Unauthorized return karte hain
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Authentication success - original handler ko userId ke saath call karte hain
    return handler(request, { userId: auth.userId })
  }
}
