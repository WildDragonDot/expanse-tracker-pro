import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

// Force dynamic rendering - uses request headers
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, email: string }
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
        <meta charset="utf-8">
        <title>Category Expense Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">${category.icon} ${category.name}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Category Expense Report</p>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #667eea;">Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Category Type:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${category.type}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Expected Cost:</strong></td>
              <td style="padding: 8px 0; text-align: right; color: #3b82f6;">₹${category.expectedCost.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Real Cost:</strong></td>
              <td style="padding: 8px 0; text-align: right; color: #10b981;">₹${category.realCost.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Variance:</strong></td>
              <td style="padding: 8px 0; text-align: right; color: ${variance > 0 ? '#ef4444' : '#10b981'};">
                ${variance > 0 ? '+' : ''}₹${variance.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Progress:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${progress}%</td>
            </tr>
            ${category.startDate ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Start Date:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${new Date(category.startDate).toLocaleDateString()}</td>
            </tr>
            ` : ''}
            ${category.endDate ? `
            <tr>
              <td style="padding: 8px 0;"><strong>End Date:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${new Date(category.endDate).toLocaleDateString()}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #667eea;">Expenses (${expenses.length})</h2>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #667eea; color: white;">
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Title</th>
                <th style="padding: 12px; text-align: right;">Expected</th>
                <th style="padding: 12px; text-align: right;">Actual</th>
                <th style="padding: 12px; text-align: center;">Completed</th>
              </tr>
            </thead>
            <tbody>
              ${expensesHTML}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280;">
          <p>Generated from Expense Tracker on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    // Verify transporter configuration
    try {
      await transporter.verify()
      console.log('SMTP connection verified successfully')
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError)
      throw new Error('SMTP configuration error. Please check your email settings.')
    }

    // Prepare email with PDF attachment
    const mailOptions: any = {
      from: `"Expense Tracker" <${process.env.SMTP_USER}>`,
      to: userEmail || decoded.email,
      subject: `Expense Report: ${category.name}`,
      html: emailHTML
    }

    // Add PDF attachment if provided
    if (pdfAttachment && pdfFilename) {
      mailOptions.attachments = [
        {
          filename: pdfFilename,
          content: pdfAttachment,
          encoding: 'base64'
        }
      ]
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error: any) {
    console.error('Error sending category email:', error)
    const errorMessage = error.message || 'Failed to send email'
    return NextResponse.json({ 
      error: errorMessage,
      details: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
