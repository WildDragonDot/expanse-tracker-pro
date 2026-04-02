import { NextRequest } from 'next/server'
import { verifyToken } from './database'

export async function getAuthUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return null
    }

    return decoded
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export function withAuth(handler: (request: NextRequest, context: { userId: string }) => Promise<Response>) {
  return async (request: NextRequest) => {
    const auth = await getAuthUser(request)
    
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return handler(request, { userId: auth.userId })
  }
}