import { NextRequest, NextResponse } from 'next/server'
import { withSecurity, secureResponse, handleApiError } from '@/lib/apiHandler'

import { prisma } from '@/lib/database'

// GET - Get user's billing cycle start day
export const GET = withSecurity(
  async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const token = authHeader.replace('Bearer ', '')
      const { verifyToken } = await import('@/lib/database')
      const decoded = verifyToken(token)

      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { billingCycleStartDay: true }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return secureResponse({
        billingCycleStartDay: user.billingCycleStartDay || 1
      })
    } catch (error) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      return handleApiError(error, ip, 'billing-cycle-get')
    }
  },
  {
    rateLimit: 'api',
    requireAuth: true
  }
)

// PATCH - Update user's billing cycle start day
export const PATCH = withSecurity(
  async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const token = authHeader.replace('Bearer ', '')
      const { verifyToken } = await import('@/lib/database')
      const decoded = verifyToken(token)

      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      // Use validated body from withSecurity wrapper
      const body = (request as any).validatedBody || await request.json()
      const { billingCycleStartDay } = body

      // Validate day (1-31)
      if (!billingCycleStartDay || billingCycleStartDay < 1 || billingCycleStartDay > 31) {
        return NextResponse.json(
          { error: 'Billing cycle start day must be between 1 and 31' },
          { status: 400 }
        )
      }

      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: { billingCycleStartDay: parseInt(billingCycleStartDay) },
        select: {
          id: true,
          name: true,
          email: true,
          billingCycleStartDay: true
        }
      })

      return secureResponse({
        message: 'Billing cycle updated successfully',
        billingCycleStartDay: user.billingCycleStartDay
      })
    } catch (error) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      return handleApiError(error, ip, 'billing-cycle-update')
    }
  },
  {
    rateLimit: 'api',
    requireAuth: true,
    validateBody: true,
    maxBodySizeKB: 10
  }
)
