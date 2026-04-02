import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json()
    const { category, items, userEmail, pdfAttachment, pdfFilename } = body

    if (!category || !items || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate totals
    const totalItems = items.length
    const boughtItems = items.filter((i: any) => i.isBought).length
    const variance = category.realCost - category.expectedCost
    const varianceText = variance > 0 
      ? `₹${Math.abs(variance).toLocaleString()} over budget`
      : variance < 0
      ? `₹${Math.abs(variance).toLocaleString()} saved`
      : 'On budget'

    // Create HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shopping Bill - ${category.name}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🛒 Shopping Bill</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Shopping List Management System</p>
                  </td>
                </tr>

                <!-- Category Info -->
                <tr>
                  <td style="padding: 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <h2 style="margin: 0 0 5px 0; color: #1f2937; font-size: 24px;">${category.name}</h2>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">Shopping Category</p>
                          ${category.isActive 
                            ? '<span style="display: inline-block; margin-top: 10px; padding: 4px 12px; background-color: #10b981; color: #ffffff; border-radius: 12px; font-size: 12px; font-weight: bold;">ACTIVE</span>'
                            : '<span style="display: inline-block; margin-top: 10px; padding: 4px 12px; background-color: #ef4444; color: #ffffff; border-radius: 12px; font-size: 12px; font-weight: bold;">INACTIVE</span>'
                          }
                        </td>
                        <td align="right">
                          <p style="margin: 0; color: #6b7280; font-size: 12px;">Generated</p>
                          <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 14px; font-weight: bold;">${new Date().toLocaleDateString('en-IN')}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Financial Summary -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px;">
                      <tr>
                        <td width="33%" style="border-right: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; font-weight: bold;">EXPECTED COST</p>
                          <p style="margin: 0; color: #3b82f6; font-size: 20px; font-weight: bold;">₹${category.expectedCost.toLocaleString()}</p>
                          <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">Estimated Amount</p>
                        </td>
                        <td width="33%" style="border-right: 1px solid #e5e7eb; padding-left: 15px;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; font-weight: bold;">ACTUAL COST</p>
                          <p style="margin: 0; color: #10b981; font-size: 20px; font-weight: bold;">₹${category.realCost.toLocaleString()}</p>
                          <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">Total Spent</p>
                        </td>
                        <td width="34%" style="padding-left: 15px;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; font-weight: bold;">DIFFERENCE</p>
                          <p style="margin: 0; color: ${variance > 0 ? '#ef4444' : '#10b981'}; font-size: 20px; font-weight: bold;">${variance > 0 ? '+' : ''}₹${Math.abs(variance).toLocaleString()}</p>
                          <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">${varianceText}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Summary -->
                <tr>
                  <td style="padding: 0 30px 20px 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Shopping Items</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 10px; text-align: left; color: #6b7280; font-size: 12px; font-weight: bold; border-bottom: 2px solid #e5e7eb;">#</th>
                        <th style="padding: 10px; text-align: left; color: #6b7280; font-size: 12px; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Item</th>
                        <th style="padding: 10px; text-align: left; color: #6b7280; font-size: 12px; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Qty</th>
                        <th style="padding: 10px; text-align: right; color: #6b7280; font-size: 12px; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Expected</th>
                        <th style="padding: 10px; text-align: right; color: #6b7280; font-size: 12px; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Actual</th>
                        <th style="padding: 10px; text-align: center; color: #6b7280; font-size: 12px; font-weight: bold; border-bottom: 2px solid #e5e7eb;">Status</th>
                      </tr>
                      ${items.map((item: any, index: number) => `
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                          <td style="padding: 12px 10px; color: #6b7280; font-size: 13px;">${index + 1}</td>
                          <td style="padding: 12px 10px; color: #1f2937; font-size: 13px; font-weight: 500;">${item.name}</td>
                          <td style="padding: 12px 10px; color: #6b7280; font-size: 13px;">${item.quantity} ${item.unit}</td>
                          <td style="padding: 12px 10px; color: #3b82f6; font-size: 13px; font-weight: bold; text-align: right;">₹${item.expectedPrice.toLocaleString()}</td>
                          <td style="padding: 12px 10px; color: #10b981; font-size: 13px; font-weight: bold; text-align: right;">${item.actualPrice ? '₹' + item.actualPrice.toLocaleString() : '-'}</td>
                          <td style="padding: 12px 10px; text-align: center;">
                            ${item.isBought 
                              ? '<span style="display: inline-block; padding: 3px 8px; background-color: #10b981; color: #ffffff; border-radius: 10px; font-size: 11px; font-weight: bold;">✓ Bought</span>'
                              : '<span style="display: inline-block; padding: 3px 8px; background-color: #f59e0b; color: #ffffff; border-radius: 10px; font-size: 11px; font-weight: bold;">Pending</span>'
                            }
                          </td>
                        </tr>
                      `).join('')}
                    </table>
                  </td>
                </tr>

                <!-- Summary Stats -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #f9fafb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Total Items: <strong style="color: #1f2937;">${totalItems}</strong></p>
                        </td>
                        <td width="50%" align="right">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Bought: <strong style="color: #10b981;">${boughtItems}</strong> | Pending: <strong style="color: #f59e0b;">${totalItems - boughtItems}</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; color: #9ca3af; font-size: 12px;">This is a computer-generated shopping bill.</p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">Generated on ${new Date().toLocaleString('en-IN')}</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    // Send email with PDF attachment
    await sendEmail({
      to: userEmail,
      subject: `Shopping Bill - ${category.name}`,
      html: htmlContent,
      attachments: pdfAttachment ? [{
        filename: pdfFilename,
        content: pdfAttachment,
        encoding: 'base64'
      }] : undefined
    })

    return NextResponse.json({
      success: true,
      message: 'Shopping bill sent successfully'
    })
  } catch (error: any) {
    console.error('Shopping export email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
})
