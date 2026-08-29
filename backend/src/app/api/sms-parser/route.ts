import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { parseBankSMS, parseBatchBankSMS } from '@/lib/smsParser'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json()
    const { text, batch } = body

    if (Array.isArray(batch)) {
      const results = parseBatchBankSMS(batch)
      return NextResponse.json({ success: true, count: results.length, transactions: results })
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'SMS text is required' }, { status: 400 })
    }

    const parsed = parseBankSMS(text)
    return NextResponse.json({ success: true, transaction: parsed })
  } catch (error: any) {
    console.error('SMS parser error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse SMS' }, { status: 500 })
  }
})
