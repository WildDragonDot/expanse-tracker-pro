import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { sendEmail, emailTemplates } from '@/lib/email'

export const dynamic = 'force-dynamic'

export const POST = async (request: NextRequest) => {
  try {
    const auth = await getAuthUser(request).catch(() => null)
    const body = await request.json().catch(() => ({}))
    const { title, amount, dueDate, category, frequency, isAutoDebit, recipientEmail, userName: bodyUserName } = body

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 })
    }

    let user = null
    if (auth?.userId) {
      user = await prisma.user.findUnique({
        where: { id: auth.userId },
      }).catch(() => null)
    }

    const targetEmail = recipientEmail || user?.email || 'vishwakarmachandan336@gmail.com'
    const userName = bodyUserName || user?.name || targetEmail.split('@')[0] || 'Valued Member'

    const template = emailTemplates.billReminder(userName, {
      title,
      amount: Number(amount),
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      category: category || 'Utilities',
      frequency: frequency || 'Monthly',
      isAutoDebit: !!isAutoDebit,
    })

    const result = await sendEmail({
      to: targetEmail,
      subject: template.subject,
      html: template.html,
    })

    if (!result.success) {
      console.warn('sendEmail returned unsuccessful result:', result)
    }

    return NextResponse.json({
      success: true,
      message: `Official bill reminder email sent to ${targetEmail}`,
      result,
    })
  } catch (error: any) {
    console.error('Send bill reminder email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send reminder email' },
      { status: 500 }
    )
  }
}

