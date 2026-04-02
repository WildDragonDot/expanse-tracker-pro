import nodemailer from 'nodemailer'

// Email configuration - supports Mailgun, Gmail, and generic SMTP
const getEmailConfig = () => {
  // Priority 1: Mailgun (recommended for production)
  if (process.env.MAILGUN_LOGIN && process.env.MAILGUN_PASSWORD) {
    return {
      host: 'smtp.mailgun.org',
      port: 2525,
      secure: false,
      auth: {
        user: process.env.MAILGUN_LOGIN,
        pass: process.env.MAILGUN_PASSWORD,
      },
    }
  }

  // Priority 2: Generic SMTP configuration
  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.GMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
      },
    }
  }

  // Priority 3: Gmail (fallback)
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
  type: process.env.MAILGUN_LOGIN
    ? 'Mailgun'
    : process.env.SMTP_HOST
    ? 'SMTP'
    : 'Gmail',
  host: emailConfig.host || 'gmail',
  port: emailConfig.port || '587',
  user: emailConfig.auth?.user ? '✅ Set' : '❌ Not set',
  pass: emailConfig.auth?.pass ? '✅ Set' : '❌ Not set',
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
      process.env.SMTP_USER ||
      process.env.GMAIL_USER

    if (!fromEmail) {
      throw new Error(
        'Email sender not configured. Set MAILGUN_LOGIN, GMAIL_USER, or SMTP_USER environment variable.'
      )
    }

    console.log(`📧 Sending email to ${to}: ${subject}`)

    const info = await transporter.sendMail({
      from: `"FinanceTracker" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
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
    subject: 'Welcome to FinanceTracker!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to FinanceTracker!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your journey to financial freedom starts here</p>
        </div>
        
        <div style="padding: 0 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${name}! 👋</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining FinanceTracker! We're excited to help you take control of your finances and achieve your financial goals.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">🚀 Get Started:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Add your first expense to start tracking</li>
              <li>Set up your budget and financial goals</li>
              <li>Explore our smart analytics and insights</li>
              <li>Connect your bank accounts for automatic sync</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Need help? Reply to this email or contact us at support@financetracker.com
          </p>
        </div>
      </div>
    `,
  }),

  expenseAlert: (name: string, expense: any) => ({
    subject: `New Expense Added: ₹${expense.amount.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">💸 Expense Alert</h1>
        </div>
        
        <p style="color: #333;">Hi ${name},</p>
        <p style="color: #666;">A new expense has been added to your account:</p>
        
        <div style="background: #fff; border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; color: #333;">${expense.title}</h3>
            <span style="font-size: 20px; font-weight: bold; color: #f5576c;">₹${expense.amount.toLocaleString()}</span>
          </div>
          <p style="margin: 5px 0; color: #666;"><strong>Category:</strong> ${expense.category}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString()}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Payment:</strong> ${expense.paymentMode} - ${expense.bank}</p>
          ${expense.notes ? `<p style="margin: 10px 0 0 0; color: #666;"><strong>Notes:</strong> ${expense.notes}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/expenses" 
             style="background: #f5576c; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View All Expenses
          </a>
        </div>
      </div>
    `,
  }),

  budgetWarning: (name: string, category: string, spent: number, budget: number) => ({
    subject: `⚠️ Budget Alert: ${category} spending at ${Math.round((spent/budget)*100)}%`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2d3436; margin: 0; font-size: 24px;">⚠️ Budget Warning</h1>
        </div>
        
        <p style="color: #333;">Hi ${name},</p>
        <p style="color: #666;">You're approaching your budget limit for <strong>${category}</strong>:</p>
        
        <div style="background: #fff; border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span style="color: #666;">Spent this month:</span>
              <span style="font-weight: bold; color: #e17055;">₹${spent.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666;">Budget limit:</span>
              <span style="font-weight: bold; color: #333;">₹${budget.toLocaleString()}</span>
            </div>
            <div style="background: #f1f2f6; height: 10px; border-radius: 5px; overflow: hidden;">
              <div style="background: ${spent/budget > 0.9 ? '#e17055' : '#fdcb6e'}; height: 100%; width: ${Math.min((spent/budget)*100, 100)}%; transition: width 0.3s ease;"></div>
            </div>
            <p style="text-align: center; margin: 10px 0 0 0; font-weight: bold; color: ${spent/budget > 0.9 ? '#e17055' : '#fdcb6e'};">
              ${Math.round((spent/budget)*100)}% of budget used
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #fdcb6e; color: #2d3436; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Dashboard
          </a>
        </div>
      </div>
    `,
  }),

  monthlyReport: (name: string, data: any) => ({
    subject: `📊 Your Monthly Financial Report - ${data.month} ${data.year}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📊 Monthly Report</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">${data.month} ${data.year}</p>
        </div>
        
        <p style="color: #333;">Hi ${name},</p>
        <p style="color: #666;">Here's your financial summary for the month:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
          <div style="background: #00b894; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">Total Income</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold;">₹${data.totalIncome.toLocaleString()}</p>
          </div>
          <div style="background: #e17055; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">Total Expenses</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold;">₹${data.totalExpenses.toLocaleString()}</p>
          </div>
        </div>
        
        <div style="background: ${data.savings >= 0 ? '#00b894' : '#e17055'}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px;">${data.savings >= 0 ? 'Savings' : 'Deficit'}</h3>
          <p style="margin: 0; font-size: 28px; font-weight: bold;">₹${Math.abs(data.savings).toLocaleString()}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Top Spending Categories:</h3>
          ${data.topCategories.map((cat: any, index: number) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: ${index < data.topCategories.length - 1 ? '1px solid #e1e5e9' : 'none'};">
              <span style="color: #666;">${cat.category}</span>
              <span style="font-weight: bold; color: #333;">₹${cat.amount.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/reports" 
             style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Detailed Report
          </a>
        </div>
      </div>
    `,
  }),
}