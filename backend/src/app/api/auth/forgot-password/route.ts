import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

import { prisma } from '@/lib/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Rate limiting: Store last reset request time per email (only in production)
const resetRequestCache = new Map<string, number>()
const RATE_LIMIT_MINUTES = 5 // Allow one request every 5 minutes
const isProduction = process.env.NODE_ENV === 'production'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase()
    const now = Date.now()

    // Check rate limiting (only in production)
    if (isProduction) {
      const lastRequestTime = resetRequestCache.get(emailLower)
      
      if (lastRequestTime) {
        const timeSinceLastRequest = now - lastRequestTime
        const minutesSinceLastRequest = Math.floor(timeSinceLastRequest / 60000)
        
        if (timeSinceLastRequest < RATE_LIMIT_MINUTES * 60000) {
          const remainingMinutes = RATE_LIMIT_MINUTES - minutesSinceLastRequest
          return NextResponse.json(
            { 
              error: `Please wait ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} before requesting another password reset.` 
            },
            { status: 429 }
          )
        }
      }
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    })

    // Return error if user doesn't exist
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`)
      return NextResponse.json({ 
        error: 'No account found with this email address. Please check your email or sign up.' 
      }, { status: 404 })
    }

    // Check if there's a recent valid token (only in production)
    if (isProduction && user.resetTokenExpiry && user.resetTokenExpiry > new Date()) {
      const minutesRemaining = Math.ceil((user.resetTokenExpiry.getTime() - now) / 60000)
      return NextResponse.json(
        { 
          error: `A password reset link was already sent. Please check your email or wait ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} to request a new one.` 
        },
        { status: 429 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Update rate limit cache (only in production)
    if (isProduction) {
      resetRequestCache.set(emailLower, now)
    }

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    // Send email
    const emailResult = await sendEmail({
      to: user.email,
      subject: '🔐 Reset Your Password - FinanceTracker',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset</h1>
                      <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 16px;">Reset your FinanceTracker password</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Hi ${user.name}! 👋</h2>
                      
                      <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 15px;">
                        We received a request to reset your password for your FinanceTracker account. Click the button below to create a new password:
                      </p>
                      
                      <!-- Reset Button -->
                      <table role="presentation" style="width: 100%; margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 45px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                              Reset My Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Important Info Box -->
                      <table role="presentation" style="width: 100%; background-color: #f8f9fa; border-radius: 8px; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.6;">
                              <strong style="color: #333;">⏰ Important:</strong><br>
                              • This link will expire in <strong>1 hour</strong><br>
                              • The link can only be used <strong>once</strong><br>
                              • If you didn't request this, you can safely ignore this email
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Security Warning -->
                      <table role="presentation" style="width: 100%; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin: 20px 0;">
                        <tr>
                          <td style="padding: 15px 20px;">
                            <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                              <strong>🔒 Security Reminder:</strong><br>
                              Never share your password or reset link with anyone. FinanceTracker will never ask for your password via email.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Account Info -->
                      <table role="presentation" style="width: 100%; background-color: #e8f4f8; border-radius: 8px; margin: 20px 0;">
                        <tr>
                          <td style="padding: 15px 20px;">
                            <p style="color: #0c5460; margin: 0; font-size: 13px; line-height: 1.5;">
                              <strong>📧 Account Email:</strong> ${user.email}<br>
                              <strong>🕐 Request Time:</strong> ${new Date().toLocaleString('en-US', { 
                                dateStyle: 'medium', 
                                timeStyle: 'short' 
                              })}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Fallback Link -->
                      <p style="color: #999; font-size: 12px; margin: 30px 0 0 0; line-height: 1.5;">
                        <strong>Button not working?</strong> Copy and paste this link into your browser:<br>
                        <a href="${resetUrl}" style="color: #667eea; word-break: break-all; text-decoration: underline;">${resetUrl}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e1e5e9;">
                      <p style="color: #666; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">
                        <strong>Need help?</strong><br>
                        Contact us at <a href="mailto:support@financetracker.com" style="color: #667eea; text-decoration: none;">support@financetracker.com</a>
                      </p>
                      <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                        © ${new Date().getFullYear()} FinanceTracker. All rights reserved.<br>
                        This is an automated email, please do not reply.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      )
    }

    console.log(`✅ Password reset email sent to: ${user.email}`)

    return NextResponse.json({ 
      success: true,
      message: 'Password reset link has been sent to your email. Please check your inbox.' 
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}

// Clean up old entries from cache every hour to prevent memory leaks (only in production)
if (isProduction) {
  setInterval(() => {
    const now = Date.now()
    const expiredTime = now - (RATE_LIMIT_MINUTES * 60000)
    
    for (const [email, timestamp] of resetRequestCache.entries()) {
      if (timestamp < expiredTime) {
        resetRequestCache.delete(email)
      }
    }
  }, 3600000) // Run every hour
}
