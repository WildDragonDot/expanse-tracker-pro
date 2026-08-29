import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/database'
import { sendEmail } from '@/lib/email'

// Force dynamic rendering - uses request headers
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token) as { userId: string; email?: string } | null
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { category, expenses, userEmail, pdfAttachment, pdfFilename } = body

    const variance = category.realCost - category.expectedCost
    const progress = category.expectedCost > 0 ? ((category.realCost / category.expectedCost) * 100).toFixed(1) : 0

    // Build expense list HTML
    let expensesHTML = ''
    expenses.forEach((expense: any) => {
      expensesHTML += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date(expense.date).toLocaleDateString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${expense.title}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${expense.amount.toLocaleString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${expense.actualAmount ? `₹${expense.actualAmount.toLocaleString()}` : '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${expense.isCompleted ? '✓' : '-'}</td>
        </tr>
      `
    })

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center; }
          .header h1 { margin: 0 0 10px 0; font-size: 24px; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .metric-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #f3f4f6; }
          .metric-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .metric-value { font-size: 18px; font-weight: bold; margin-top: 5px; }
          .progress-bar-bg { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin: 20px 0; }
          .progress-bar-fill { background: ${variance > 0 ? '#ef4444' : '#10b981'}; height: 100%; width: ${Math.min(Number(progress), 100)}%; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${category.name}</h1>
            <span class="badge">Expense Planning Report</span>
          </div>
          <div class="content">
            <p>Here is your comprehensive expense report for the <strong>${category.name}</strong> category.</p>
            
            <div class="metrics">
              <div class="metric-card">
                <div class="metric-label">Expected Budget</div>
                <div class="metric-value" style="color: #3b82f6;">₹${category.expectedCost.toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Actual Spent</div>
                <div class="metric-value" style="color: #10b981;">₹${category.realCost.toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Variance</div>
                <div class="metric-value" style="color: ${variance > 0 ? '#ef4444' : '#10b981'};">
                  ${variance > 0 ? '+' : ''}₹${Math.abs(variance).toLocaleString()}
                </div>
              </div>
            </div>

            <div style="margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-bottom: 5px;">
                <span>Budget Utilization</span>
                <span>${progress}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill"></div>
              </div>
            </div>

            <h3 style="margin-top: 30px; margin-bottom: 10px; color: #111827;">Transaction Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                  <th style="text-align: right;">Actual</th>
                  <th style="text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${expensesHTML}
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>Generated by Expense Tracker Pro • Attached PDF contains full documentation</p>
          </div>
        </div>
      </body>
      </html>
    `

    const attachments: Array<{ filename: string; content: string; encoding: string }> = []
    if (pdfAttachment && pdfFilename) {
      attachments.push({
        filename: pdfFilename,
        content: pdfAttachment,
        encoding: 'base64'
      })
    }

    const recipient = userEmail || decoded.email || 'work@chandandev.online'
    const result = await sendEmail({
      to: recipient,
      subject: `Expense Report: ${category.name}`,
      html: emailHTML,
      attachments
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error: any) {
    console.error('Error sending category email:', error)
    const errorMessage = error.message || 'Failed to send email'
    return NextResponse.json({ 
      error: errorMessage,
      details: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
