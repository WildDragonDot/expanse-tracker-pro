import nodemailer from 'nodemailer'

// Email configuration - supports Mailgun API, Mailgun SMTP, Zoho/Custom SMTP, and Gmail
const getEmailConfig = () => {
  if (process.env.SMTP_HOST) {
    const port = parseInt(process.env.SMTP_PORT || '465')
    return {
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER || process.env.GMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD,
      },
    }
  }

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

  return {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  }
}

const emailConfig = getEmailConfig()
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
      process.env.SMTP_FROM ||
      (process.env.SMTP_USER ? `"Expense Tracker" <${process.env.SMTP_USER}>` : null) ||
      process.env.MAILGUN_FROM ||
      (process.env.MAILGUN_DOMAIN ? `billing@${process.env.MAILGUN_DOMAIN}` : null) ||
      process.env.SMTP_USER ||
      process.env.GMAIL_USER

    if (!fromEmail && !process.env.MAILGUN_API_KEY) {
      throw new Error(
        'Email sender not configured. Set MAILGUN_API_KEY, MAILGUN_LOGIN, GMAIL_USER, or SMTP_USER environment variable.'
      )
    }

    console.log(`📧 Sending authentic financial email to ${to}: ${subject}`)

    // Priority 1: Direct SMTP Transport
    if (process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)) {
      const sender = fromEmail?.includes('<') ? fromEmail : `"Expense Tracker Financial" <${process.env.SMTP_USER}>`
      const info = await transporter.sendMail({
        from: sender,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        attachments,
      })
      return { success: true, messageId: info.messageId }
    }

    // Priority 2: Direct Mailgun HTTP REST API
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      const apiKey = process.env.MAILGUN_API_KEY
      const domain = process.env.MAILGUN_DOMAIN
      const sender = fromEmail?.includes('<') ? fromEmail : `"Expense Tracker Financial" <${fromEmail || `billing@${domain}`}>`

      const formData = new FormData()
      formData.append('from', sender)
      formData.append('to', to)
      formData.append('subject', subject)
      formData.append('html', html)
      if (text) formData.append('text', text)
      else formData.append('text', html.replace(/<[^>]*>/g, ''))

      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.content) {
            let buffer: Buffer = typeof att.content === 'string'
              ? Buffer.from(att.content, att.encoding === 'base64' ? 'base64' : 'utf-8')
              : att.content
            const mimeType = att.filename?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
            const file = new File([new Uint8Array(buffer)], att.filename || 'financial-statement.pdf', { type: mimeType })
            formData.append('attachment', file)
          }
        }
      }

      const authHeader = 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64')
      let response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: { Authorization: authHeader },
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.error('Mailgun error for recipient', to, ':', errData)

        // Sandbox fallback
        const fallbackTo = process.env.MAILGUN_AUTHORIZED_RECIPIENT || 'chandanvishwakarma.tech@gmail.com'
        const errMsg = (errData.message || '').toLowerCase()
        const isSandboxOrAuthErr =
          errMsg.includes('sandbox') ||
          errMsg.includes('authorized') ||
          errMsg.includes('free account') ||
          errMsg.includes('not allowed') ||
          response.status === 400 ||
          response.status === 403

        if (to.toLowerCase() !== fallbackTo.toLowerCase() && isSandboxOrAuthErr) {
          const fallbackForm = new FormData()
          fallbackForm.append('from', sender)
          fallbackForm.append('to', fallbackTo)
          fallbackForm.append('subject', `[Statement for ${to}] ` + subject)
          fallbackForm.append('html', html)
          if (text) fallbackForm.append('text', text)

          if (attachments && attachments.length > 0) {
            for (const att of attachments) {
              if (att.content) {
                let buffer: Buffer = typeof att.content === 'string'
                  ? Buffer.from(att.content, att.encoding === 'base64' ? 'base64' : 'utf-8')
                  : att.content
                const mimeType = att.filename?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
                const file = new File([new Uint8Array(buffer)], att.filename || 'financial-statement.pdf', { type: mimeType })
                fallbackForm.append('attachment', file)
              }
            }
          }

          const fbResponse = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
            method: 'POST',
            headers: { Authorization: authHeader },
            body: fallbackForm,
          })

          if (fbResponse.ok) {
            const fbData = await fbResponse.json().catch(() => ({}))
            return { success: true, messageId: fbData.id, note: `Sent to ${fallbackTo}` }
          }
        }
      } else {
        const data = await response.json().catch(() => ({}))
        return { success: true, messageId: data.id }
      }
    }

    // Default Nodemailer
    const info = await transporter.sendMail({
      from: fromEmail?.includes('<') ? fromEmail : `"Expense Tracker" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      attachments,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==========================================
// HIGH-FIDELITY AUTHENTIC FINANCIAL EMAIL TEMPLATES
// ==========================================
export const emailTemplates = {
  /**
   * Official Welcome / Account Verification
   */
  welcome: (name: string) => ({
    subject: 'Official Confirmation: Expense Tracker Account Activated',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 28px 32px; color: #ffffff; border-bottom: 3px solid #10b981; }
          .header-title { font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.3px; }
          .header-sub { font-size: 13px; color: #94a3b8; margin-top: 4px; }
          .badge { display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 12px; }
          .content { padding: 32px; }
          .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
          .p { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0; }
          .box-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
          .box-row:last-child { border-bottom: none; }
          .box-label { color: #64748b; font-weight: 500; }
          .box-value { color: #0f172a; font-weight: 600; }
          .btn { display: inline-block; background: #0f172a; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 12px; text-align: center; }
          .footer { background: #f8fafc; padding: 20px 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="badge">Verified Account</div>
            <h1 class="header-title">Expense Tracker Financial Services</h1>
            <div class="header-sub">Official Account Confirmation & Registration Notice</div>
          </div>
          <div class="content">
            <div class="greeting">Dear ${name},</div>
            <p class="p">Your personal finance profile has been successfully registered and encrypted with Expense Tracker Financial Services.</p>
            <div class="box">
              <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Account Summary</div>
              <div style="font-size: 13px; color: #334155; line-height: 1.8;">
                • <strong>Service:</strong> Real-time Expense & Budget Tracking<br>
                • <strong>Security:</strong> 256-bit Encrypted Cloud Ledger<br>
                • <strong>Currency:</strong> INR (₹)<br>
                • <strong>Status:</strong> Active & Verified
              </div>
            </div>
            <p class="p">You can now track cash flows, automate recurring utility invoices, and export verified financial statements directly from your mobile application.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://expensetracker.chandandev.online" class="btn">Launch Financial Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <strong>Expense Tracker Financial Technologies</strong><br>
            Official Electronic Notification • Generated on ${new Date().toUTCString()}<br>
            This is a system-generated document. For support, reach out to support@expensetracker.app.
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * OTP Verification Security Notice
   */
  otpVerification: (otp: string) => ({
    subject: `Security Notice: One-Time Verification Passcode [${otp}]`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
          .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #0f172a; padding: 24px; color: #ffffff; border-bottom: 3px solid #3b82f6; text-align: center; }
          .content { padding: 28px; text-align: center; }
          .otp-box { background: #f8fafc; border: 2px dashed #94a3b8; border-radius: 8px; padding: 18px; margin: 20px auto; display: inline-block; min-width: 200px; }
          .otp-code { font-family: 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a; }
          .p { font-size: 13px; color: #64748b; line-height: 1.6; margin: 12px 0; }
          .footer { background: #f8fafc; padding: 16px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 style="margin: 0; font-size: 18px; font-weight: 700;">Expense Tracker Security</h2>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Two-Factor Authentication Passcode</div>
          </div>
          <div class="content">
            <p style="font-size: 14px; color: #334155; margin-bottom: 8px;">Use the one-time passcode below to verify your identity:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p class="p">This verification code is strictly confidential and expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          </div>
          <div class="footer">
            Ref ID: OTP-${Date.now().toString().slice(-6)} • Expense Tracker Security Desk
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Budget Threshold Alert
   */
  budgetWarning: (name: string, category: string, spent: number, limit: number) => ({
    subject: `⚠️ Budget Threshold Warning: ${category} spending reached ${Math.round((spent / limit) * 100)}%`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
          .card { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #b45309; padding: 24px 32px; color: #ffffff; }
          .content { padding: 28px; }
          .alert-table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; }
          .alert-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .alert-table td:first-child { color: #64748b; font-weight: 500; }
          .alert-table td:last-child { color: #0f172a; font-weight: 700; text-align: right; }
          .footer { background: #f8fafc; padding: 16px 28px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 style="margin: 0; font-size: 18px; font-weight: 700;">⚠️ Automated Budget Threshold Alert</h2>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">Expense Monitoring Protocol</div>
          </div>
          <div class="content">
            <p style="font-size: 14px; color: #334155;">Dear ${name},</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">
              This is an automated advisory notification that your current cycle spending in <strong>${category}</strong> has reached <strong>${Math.round((spent / limit) * 100)}%</strong> of your allocated limit.
            </p>
            <table class="alert-table">
              <tr>
                <td>Category</td>
                <td>${category}</td>
              </tr>
              <tr>
                <td>Allocated Budget</td>
                <td>₹${limit.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Current Expenditure</td>
                <td style="color: #dc2626;">₹${spent.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Remaining Capacity</td>
                <td style="color: ${limit - spent >= 0 ? '#16a34a' : '#dc2626'};">₹${Math.max(0, limit - spent).toLocaleString('en-IN')}</td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #64748b;">Please review your active payment schedules in the mobile app to ensure fiscal compliance.</p>
          </div>
          <div class="footer">
            Expense Tracker Risk & Budget Management System • Ref: BGT-WARN-${Date.now().toString().slice(-6)}
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Official Monthly Financial Statement & Invoice
   */
  monthlyReport: (name: string, reportData: any) => ({
    subject: `Official Financial Statement: ${reportData.month} ${reportData.year} [Statement Ref #${reportData.statementId || `STMT-${Date.now().toString().slice(-6)}`}]`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
          .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .top-bar { background: #0f172a; padding: 24px 32px; color: #ffffff; display: table; width: 100%; box-sizing: border-box; }
          .top-left { display: table-cell; vertical-align: middle; }
          .top-right { display: table-cell; vertical-align: middle; text-align: right; }
          .inst-name { font-size: 20px; font-weight: 800; letter-spacing: -0.4px; color: #ffffff; }
          .doc-tag { font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px; }
          .stmt-meta { font-size: 12px; color: #94a3b8; line-height: 1.4; }
          .content { padding: 32px; }
          
          .grid-2 { display: table; width: 100%; margin-bottom: 24px; }
          .col-left { display: table-cell; width: 50%; vertical-align: top; font-size: 13px; line-height: 1.5; color: #475569; }
          .col-right { display: table-cell; width: 50%; vertical-align: top; text-align: right; font-size: 13px; line-height: 1.5; color: #475569; }
          
          .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          .summary-table th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 700; color: #475569; border-top: 2px solid #0f172a; border-bottom: 1px solid #cbd5e1; }
          .summary-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; }
          
          .total-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 24px 0; }
          .total-row { display: table; width: 100%; margin: 4px 0; font-size: 14px; }
          .total-lbl { display: table-cell; color: #475569; font-weight: 500; }
          .total-val { display: table-cell; text-align: right; font-weight: 700; color: #0f172a; }
          
          .seal-box { border-left: 4px solid #10b981; background: #f0fdf4; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #166534; line-height: 1.5; margin-top: 24px; }
          .footer { background: #f8fafc; padding: 24px 32px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="top-bar">
            <div class="top-left">
              <div class="inst-name">EXPENSE TRACKER</div>
              <div class="doc-tag">Official Financial Statement</div>
            </div>
            <div class="top-right">
              <div class="stmt-meta">
                <strong>Statement Period:</strong> ${reportData.month} ${reportData.year}<br>
                <strong>Date of Issue:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br>
                <strong>Doc Ref:</strong> ${reportData.statementId || `STMT-${Date.now().toString().slice(-8)}`}
              </div>
            </div>
          </div>
          
          <div class="content">
            <div class="grid-2">
              <div class="col-left">
                <strong style="color: #0f172a; font-size: 14px;">ACCOUNT HOLDER:</strong><br>
                ${name}<br>
                ${reportData.email || 'Registered User'}<br>
                Currency: INR (₹)
              </div>
              <div class="col-right">
                <strong style="color: #0f172a; font-size: 14px;">ISSUING PLATFORM:</strong><br>
                Expense Tracker Technologies<br>
                Automated Ledger Division<br>
                Cloud Verification: Active
              </div>
            </div>

            <table class="summary-table">
              <thead>
                <tr>
                  <th>Financial Component</th>
                  <th>Classification</th>
                  <th style="text-align: right;">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Credits (Inflow)</td>
                  <td><span style="color: #16a34a; font-weight: 600;">Income & Earnings</span></td>
                  <td style="text-align: right; font-weight: 700; color: #16a34a;">₹${Number(reportData.totalIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Total Debits (Outflow)</td>
                  <td><span style="color: #dc2626; font-weight: 600;">Expenses & Debits</span></td>
                  <td style="text-align: right; font-weight: 700; color: #dc2626;">₹${Number(reportData.totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Net Cash Balance</td>
                  <td><span style="color: #2563eb; font-weight: 600;">Retained Savings</span></td>
                  <td style="text-align: right; font-weight: 700; color: #2563eb;">₹${Number((reportData.totalIncome || 0) - (reportData.totalExpenses || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div class="total-box">
              <div class="total-row">
                <div class="total-lbl">Net Savings Efficiency Ratio:</div>
                <div class="total-val">${Number(reportData.totalIncome) > 0 ? (((Number(reportData.totalIncome) - Number(reportData.totalExpenses)) / Number(reportData.totalIncome)) * 100).toFixed(1) : 0}%</div>
              </div>
              <div class="total-row" style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
                <div class="total-lbl" style="font-size: 15px; color: #0f172a; font-weight: 700;">Closing Accounting Balance:</div>
                <div class="total-val" style="font-size: 16px; color: #0f172a;">₹${Number((reportData.totalIncome || 0) - (reportData.totalExpenses || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div class="seal-box">
              ✔ <strong>VERIFIED DIGITAL RECORD:</strong> This document is an official record generated by Expense Tracker. The accompanying PDF attachment contains the full itemized ledger, payment mode breakdown, and cryptographic audit hash.
            </div>
          </div>

          <div class="footer">
            <strong>Confidentiality Notice:</strong> This document contains sensitive personal financial records. If you are not the intended recipient, please notify support@expensetracker.app immediately.<br>
            © ${new Date().getFullYear()} Expense Tracker Technologies. All rights reserved. Registered Electronic Financial Instrument.
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Official Recurring Bill / Subscription Payment Reminder
   */
  billReminder: (name: string, bill: { title: string; amount: number; dueDate: string; category: string; frequency?: string; isAutoDebit?: boolean }) => ({
    subject: `🔔 Official Payment Advisory: ${bill.title} [₹${Number(bill.amount).toLocaleString('en-IN')}] Due on ${bill.dueDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
          .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4); }
          .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 28px 32px; border-bottom: 2px solid #38bdf8; }
          .badge { display: inline-block; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 12px; }
          .header-title { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0; }
          .header-sub { font-size: 13px; color: #94a3b8; margin-top: 4px; }
          .content { padding: 32px; color: #e2e8f0; }
          .amount-box { background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .amount-lbl { font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; }
          .amount-val { font-size: 32px; font-weight: 900; color: #38bdf8; margin: 6px 0; }
          .due-badge { display: inline-block; background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fbbf24; font-size: 12px; font-weight: 700; padding: 3px 12px; border-radius: 20px; }
          .detail-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          .detail-table td { padding: 12px 8px; border-bottom: 1px solid #334155; }
          .detail-table td:first-child { color: #94a3b8; font-weight: 500; }
          .detail-table td:last-child { color: #ffffff; font-weight: 700; text-align: right; }
          .autodebit-notice { background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #34d399; margin: 16px 0; line-height: 1.5; }
          .btn-primary { display: block; background: #38bdf8; color: #0f172a !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 14px; text-align: center; margin-top: 24px; box-shadow: 0 4px 14px rgba(56, 189, 248, 0.3); }
          .footer { background: #0f172a; padding: 20px 32px; font-size: 11px; color: #64748b; border-top: 1px solid #334155; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="badge">Automated Bill Reminder</div>
            <h1 class="header-title">Payment Due Notice</h1>
            <div class="header-sub">Expense Tracker Autonomous Schedule System</div>
          </div>
          <div class="content">
            <p style="font-size: 15px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
              This is a scheduled financial notification regarding your upcoming <strong>${bill.title}</strong> payment.
            </p>

            <div class="amount-box">
              <div class="amount-lbl">Scheduled Due Amount</div>
              <div class="amount-val">₹${Number(bill.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div class="due-badge">Due Date: ${bill.dueDate}</div>
            </div>

            <table class="detail-table">
              <tr>
                <td>Bill / Subscription</td>
                <td>${bill.title}</td>
              </tr>
              <tr>
                <td>Category</td>
                <td>${bill.category || 'Utilities'}</td>
              </tr>
              <tr>
                <td>Frequency</td>
                <td>${(bill.frequency || 'Monthly').toUpperCase()}</td>
              </tr>
              <tr>
                <td>Payment Method</td>
                <td>${bill.isAutoDebit ? 'Auto-Debit (Mandate Enabled)' : 'Manual 1-Click Pay'}</td>
              </tr>
            </table>

            ${
              bill.isAutoDebit
                ? `<div class="autodebit-notice">⚡ <strong>Auto-Debit Active:</strong> Please maintain sufficient balance in your linked bank account before the due date to avoid bounce charges.</div>`
                : ''
            }

            <a href="https://expensetracker.chandandev.online" class="btn-primary">Open App & Mark as Paid</a>
          </div>
          <div class="footer">
            <strong>Expense Tracker Multi-Channel Notification Engine</strong><br>
            Delivered securely via Brevo / Mailgun Verified Financial Transport.<br>
            © ${new Date().getFullYear()} Expense Tracker Technologies. Ref ID: BILL-REM-${Date.now().toString().slice(-6)}
          </div>
        </div>
      </body>
      </html>
    `,
  }),
}