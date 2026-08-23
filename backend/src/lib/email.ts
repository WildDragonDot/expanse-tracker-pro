import nodemailer from 'nodemailer'

// Email configuration - supports Mailgun API (recommended for EC2/Cloud), Mailgun SMTP, Gmail, and generic SMTP
const getEmailConfig = () => {
  if (process.env.MAILGUN_LOGIN && process.env.MAILGUN_PASSWORD) {
    return {
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_LOGIN,
        pass: process.env.MAILGUN_PASSWORD,
      },
    }
  }

  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER || process.env.GMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
      },
    }
  }

  return {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  }
}

const emailConfig = getEmailConfig()

console.log('📧 Email Configuration:', {
  type: (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN)
    ? 'Mailgun HTTP API (Ultra-Fast)'
    : process.env.MAILGUN_LOGIN
    ? 'Mailgun SMTP'
    : process.env.SMTP_HOST
    ? 'SMTP'
    : 'Gmail',
  host: process.env.MAILGUN_DOMAIN || emailConfig.host || 'gmail',
  user: (process.env.MAILGUN_API_KEY || emailConfig.auth?.user) ? '✅ Set' : '❌ Not set',
})

const transporter = nodemailer.createTransport(emailConfig)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string
    encoding: string
  }>
}

export async function sendEmail({ to, subject, html, text, attachments }: EmailOptions) {
  try {
    const fromEmail =
      process.env.MAILGUN_FROM ||
      (process.env.MAILGUN_DOMAIN ? `postmaster@${process.env.MAILGUN_DOMAIN}` : null) ||
      process.env.SMTP_USER ||
      process.env.GMAIL_USER

    if (!fromEmail && !process.env.MAILGUN_API_KEY) {
      throw new Error(
        'Email sender not configured. Set MAILGUN_API_KEY, MAILGUN_LOGIN, GMAIL_USER, or SMTP_USER environment variable.'
      )
    }

    console.log(`📧 Sending email to ${to}: ${subject}`)

    // Priority 1: Direct Mailgun HTTP REST API (Bypasses all ISP/EC2 SMTP port firewalls)
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      const apiKey = process.env.MAILGUN_API_KEY
      const domain = process.env.MAILGUN_DOMAIN
      const sender = fromEmail?.includes('<') ? fromEmail : `"ExpenseTracker Pro" <${fromEmail || `postmaster@${domain}`}>`

      const formData = new URLSearchParams()
      formData.append('from', sender)
      formData.append('to', to)
      formData.append('subject', subject)
      formData.append('html', html)
      if (text) formData.append('text', text)
      else formData.append('text', html.replace(/<[^>]*>/g, ''))

      const authHeader = 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64')
      const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || `Mailgun API error status ${response.status}`)
      }

      console.log('✅ Email sent via Mailgun API successfully:', data.id)
      return { success: true, messageId: data.id }
    }

    // Priority 2: Nodemailer SMTP Transport
    const info = await transporter.sendMail({
      from: fromEmail?.includes('<') ? fromEmail : `"ExpenseTracker Pro" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      attachments
    })

    console.log('✅ Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to ExpenseTracker Pro!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 26px;">Welcome to ExpenseTracker Pro! 🚀</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 15px;">Smart AI-Powered Personal Finance & Budgeting</p>
        </div>
        
        <div style="padding: 0 16px;">
          <h2 style="color: #f1f5f9; margin-bottom: 16px;">Hi ${name}! 👋</h2>
          <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining ExpenseTracker Pro! Your account is active and ready to help you track expenses, automate bills, and manage cash flow with AI.
          </p>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.08);">
            <h3 style="color: #38bdf8; margin-top: 0;">⚡ Quick Start:</h3>
            <ul style="color: #cbd5e1; line-height: 1.8;">
              <li>Log your daily income and expenses</li>
              <li>Monitor autonomous Financial Health Score</li>
              <li>Track recurring bills and monthly budgets</li>
              <li>Chat with your AI Financial Copilot</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://expensetracker.chandandev.online" 
               style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Open Web Dashboard
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  otpVerification: (otp: string) => ({
    subject: `Your Verification Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #6366f1; text-align: center; margin-bottom: 8px;">ExpenseTracker Pro</h2>
        <p style="color: #94a3b8; text-align: center; margin-bottom: 24px;">Use the verification code below to verify your account:</p>
        
        <div style="background: #1e293b; border: 1px solid #6366f1; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8;">${otp}</span>
        </div>
        
        <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 24px;">
          This code expires in 10 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
    `,
  }),

  budgetWarning: (name: string, category: string, spent: number, limit: number) => ({
    subject: `⚠️ Budget Alert: ${category} spending is at ${Math.round((spent / limit) * 100)}%`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #f59e0b; margin-top: 0;">⚠️ Budget Threshold Warning</h2>
        <p style="color: #cbd5e1;">Hi ${name}, you've spent <strong>₹${spent.toLocaleString()}</strong> out of your <strong>₹${limit.toLocaleString()}</strong> budget for <strong>${category}</strong>.</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid rgba(245,158,11,0.3);">
          <p style="color: #f59e0b; margin: 0; font-weight: bold;">Budget Burn: ${Math.round((spent / limit) * 100)}% used</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Review your recent expenses on ExpenseTracker Pro to stay within your monthly target.</p>
      </div>
    `,
  }),

  monthlyReport: (name: string, reportData: any) => ({
    subject: `📊 Your Monthly Financial Report: ${reportData.month} ${reportData.year}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #6366f1; margin-top: 0;">Monthly Financial Summary</h2>
        <p style="color: #cbd5e1;">Hi ${name}, here is your spending and savings snapshot for <strong>${reportData.month} ${reportData.year}</strong>.</p>
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <p style="color: #10b981; margin: 8px 0;"><strong>Total Income:</strong> ₹${Number(reportData.totalIncome || 0).toLocaleString()}</p>
          <p style="color: #ef4444; margin: 8px 0;"><strong>Total Expenses:</strong> ₹${Number(reportData.totalExpenses || 0).toLocaleString()}</p>
          <p style="color: #38bdf8; margin: 8px 0;"><strong>Net Savings:</strong> ₹${Number(reportData.netSavings || 0).toLocaleString()}</p>
        </div>
      </div>
    `,
  }),
}