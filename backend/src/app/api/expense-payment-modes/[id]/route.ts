import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/database'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()

    const mode = await prisma.expensePaymentMode.findFirst({
      where: { id: params.id, userId: decoded.userId }
    })

    if (!mode) {
      return NextResponse.json({ error: 'Payment mode not found' }, { status: 404 })
    }

    const updated = await prisma.expensePaymentMode.update({
      where: { id: params.id },
      data: {
        name: body.name !== undefined ? body.name.trim() : mode.name,
        icon: body.icon !== undefined ? body.icon : mode.icon
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Payment mode name already exists' }, { status: 400 })
    }
    console.error('Error updating payment mode:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const mode = await prisma.expensePaymentMode.findFirst({
      where: { id: params.id, userId: decoded.userId }
    })

    if (!mode) {
      return NextResponse.json({ error: 'Payment mode not found' }, { status: 404 })
    }

    if (mode.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default payment mode' }, { status: 400 })
    }

    await prisma.expensePaymentMode.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Payment mode deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment mode:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
