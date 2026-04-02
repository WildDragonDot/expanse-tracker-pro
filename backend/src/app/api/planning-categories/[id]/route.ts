import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/database'

// Force dynamic rendering - uses request headers
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()

    const category = await prisma.planningCategory.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if expiry date is being updated and auto-set isActive
    let isActive = body.isActive
    if (body.expiryDate !== undefined) {
      isActive = body.expiryDate ? new Date(body.expiryDate) > new Date() : true
    }

    const updated = await prisma.planningCategory.update({
      where: { id: params.id },
      data: {
        name: body.name,
        icon: body.icon,
        color: body.color,
        expectedCost: body.expectedCost ? parseFloat(body.expectedCost) : undefined,
        realCost: body.realCost !== undefined ? parseFloat(body.realCost) : undefined,
        type: body.type,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        expiryDate: body.expiryDate !== undefined ? (body.expiryDate ? new Date(body.expiryDate) : null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating planning category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const category = await prisma.planningCategory.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await prisma.planningCategory.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting planning category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
