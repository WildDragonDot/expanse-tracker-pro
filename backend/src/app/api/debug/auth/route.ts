import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getUserById } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    
    if (!auth) {
      return NextResponse.json({ 
        error: 'No auth token found',
        hasAuthHeader: !!request.headers.get('authorization')
      }, { status: 401 })
    }

    // Try to find the user
    const user = await getUserById(auth.userId)

    return NextResponse.json({
      tokenUserId: auth.userId,
      userExists: !!user,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email
      } : null
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
