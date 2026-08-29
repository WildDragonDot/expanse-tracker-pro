import nodemailer from 'nodemailer'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { prisma } from './database'

// Track if checker is already running
let isCheckerRunning = false
let checkInterval: NodeJS.Timeout | null = null

// Helper function to generate PDF
async function generateCategoryPDF(category: any, expenses: any[], userEmail?: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(41, 98, 255)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('EXPENSE TRACKER', 14, 16)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Personal Finance Management System', 14, 23)
  
  if (userEmail) {
    doc.setFontSize(8)
    doc.text(`Account: ${userEmail}`, 14, 30)
  }
  
  const today = new Date().toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
  doc.setFontSize(9)
  doc.text(`Generated: ${today}`, pageWidth - 14, 16, { align: 'right' })
  doc.text(`Statement ID: ${category.id.substring(0, 8).toUpperCase()}`, pageWidth - 14, 23, { align: 'right' })
  
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  })
  doc.setFontSize(8)
  doc.text(`${currentTime}`, pageWidth - 14, 30, { align: 'right' })
  
  doc.setTextColor(0, 0, 0)
  
  // Category Details
  doc.setFillColor(245, 247, 250)
  doc.rect(14, 50, pageWidth - 28, 45, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(14, 50, pageWidth - 28, 45, 'S')
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(category.name, 20, 60)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Category Type: ${category.type.toUpperCase()}`, 20, 68)
  
  if (category.startDate || category.endDate) {
    const startDate = category.startDate ? new Date(category.startDate).toLocaleDateString('en-IN') : 'N/A'
    const endDate = category.endDate ? new Date(category.endDate).toLocaleDateString('en-IN') : 'N/A'
    doc.text(`Period: ${startDate} to ${endDate}`, 20, 74)
  }
  
  doc.setFillColor(239, 68, 68)
  doc.roundedRect(20, 78, 24, 6, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('EXPIRED', 32, 82, { align: 'center' })
  
  // Financial Summary
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(200, 200, 200)
  doc.rect(14, 100, pageWidth - 28, 32, 'FD')
  
  const colWidth = (pageWidth - 28) / 3
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('EXPECTED BUDGET', 20, 108)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246)
  doc.text(`₹ ${category.expectedCost.toLocaleString('en-IN')}`, 20, 118)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('ACTUAL SPENT', 20 + colWidth, 108)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text(`₹ ${category.realCost.toLocaleString('en-IN')}`, 20 + colWidth, 118)
  
  const variance = category.realCost - category.expectedCost
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('VARIANCE', 20 + colWidth * 2, 108)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(variance > 0 ? 239 : 34, variance > 0 ? 68 : 197, variance > 0 ? 68 : 94)
  doc.text(`${variance > 0 ? '+' : ''}₹ ${Math.abs(variance).toLocaleString('en-IN')}`, 20 + colWidth * 2, 118)
  
  // Transaction Details
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('TRANSACTION DETAILS', 14, 143)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Total Transactions: ${expenses.length}`, pageWidth - 14, 143, { align: 'right' })
  
  const tableData = expenses.map((expense: any, index: number) => [
    (index + 1).toString(),
    new Date(expense.date).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }),
    expense.title,
    expense.description || '-',
    `₹ ${expense.amount.toLocaleString('en-IN')}`,
    expense.isCompleted ? 'Yes' : 'No'
  ])
  
  autoTable(doc as any, {
    startY: 150,
    head: [['#', 'Date', 'Description', 'Notes', 'Amount', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [41, 98, 255],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 45 },
      3: { cellWidth: 45 },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 15, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 14, right: 14 }
  })
  
  const finalY = (doc as any).lastAutoTable.finalY || 145
  
  if (finalY < 250) {
    doc.setDrawColor(200, 200, 200)
    doc.line(14, finalY + 10, pageWidth - 14, finalY + 10)
    
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'italic')
    doc.text('This is a computer-generated statement and does not require a signature.', pageWidth / 2, finalY + 18, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, finalY + 24, { align: 'center' })
  }
  
  return doc
}

// Main checker function
export async function checkExpiredCategories() {
  try {
    const now = new Date()
    
    // Find expired categories that haven't sent email yet
    const expiredCategories = await prisma.planningCategory.findMany({
      where: {
        expiryDate: {
          lte: now
        },
        expiryEmailSent: false,
        isActive: true
      },
      include: {
        user: true,
        expenses: {
          orderBy: {
            date: 'asc'
          }
        }
      }
    })

    if (expiredCategories.length === 0) {
      console.log(`[${new Date().toISOString()}] No expired categories found`)
      return { processed: 0, results: [] }
    }

    console.log(`[${new Date().toISOString()}] Found ${expiredCategories.length} expired categories`)

    const results = []

    for (const category of expiredCategories) {
      try {
        // Generate PDF
        const doc = await generateCategoryPDF(category, category.expenses, category.user.email)
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
        const pdfBase64 = pdfBuffer.toString('base64')

        // Create email transporter
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

        const variance = category.realCost - category.expectedCost
        const progress = category.expectedCost > 0 ? ((category.realCost / category.expectedCost) * 100).toFixed(1) : 0

        let expensesHTML = ''
        category.expenses.forEach((expense: any) => {
          expensesHTML += `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date(expense.date).toLocaleDateString()}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${expense.title}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${expense.amount.toLocaleString()}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${expense.isCompleted ? '✓' : '-'}</td>
            </tr>
          `
        })

        const emailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Category Expired - Final Report</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px;">⏰ Category Expired</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${category.icon} ${category.name}</p>
            </div>

            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 0; font-weight: bold; color: #dc2626;">Your category "${category.name}" has expired!</p>
              <p style="margin: 10px 0 0 0; color: #991b1b;">This is your final expense report. The category has been automatically marked as inactive.</p>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #667eea;">Final Summary</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Category Type:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${category.type}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Expired On:</strong></td>
                  <td style="padding: 8px 0; text-align: right; color: #dc2626;">${new Date(category.expiryDate!).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Expected Budget:</strong></td>
                  <td style="padding: 8px 0; text-align: right; color: #3b82f6;">₹${category.expectedCost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Actual Spent:</strong></td>
                  <td style="padding: 8px 0; text-align: right; color: #10b981;">₹${category.realCost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Variance:</strong></td>
                  <td style="padding: 8px 0; text-align: right; color: ${variance > 0 ? '#ef4444' : '#10b981'};">
                    ${variance > 0 ? '+' : ''}₹${variance.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Budget Usage:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${progress}%</td>
                </tr>
              </table>
            </div>

            ${category.expenses.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #667eea;">All Expenses (${category.expenses.length})</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: #667eea; color: white;">
                    <th style="padding: 12px; text-align: left;">Date</th>
                    <th style="padding: 12px; text-align: left;">Title</th>
                    <th style="padding: 12px; text-align: right;">Amount</th>
                    <th style="padding: 12px; text-align: center;">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  ${expensesHTML}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="margin: 0; color: #0369a1;">📎 <strong>Attached:</strong> Complete PDF statement for your records</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280;">
              <p>Generated automatically by Expense Tracker on ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
          </html>
        `

        const mailOptions = {
          from: `"Expense Tracker" <${process.env.SMTP_USER}>`,
          to: category.user.email,
          subject: `⏰ Category Expired: ${category.name} - Final Report`,
          html: emailHTML,
          attachments: [
            {
              filename: `${category.name.replace(/[^a-z0-9]/gi, '_')}_Final_Statement_${new Date().toISOString().split('T')[0]}.pdf`,
              content: pdfBase64,
              encoding: 'base64'
            }
          ]
        }

        await transporter.sendMail(mailOptions)

        // Mark as sent and inactive - THIS ENSURES ONE-TIME EMAIL
        await prisma.planningCategory.update({
          where: { id: category.id },
          data: {
            isActive: false,
            expiryEmailSent: true,
            expiryEmailSentAt: now
          }
        })

        results.push({
          categoryId: category.id,
          categoryName: category.name,
          userEmail: category.user.email,
          status: 'success'
        })

        console.log(`✅ [${new Date().toISOString()}] Sent expiry email: ${category.name} → ${category.user.email}`)
      } catch (error: any) {
        console.error(`❌ [${new Date().toISOString()}] Failed to send email for ${category.id}:`, error.message)
        results.push({
          categoryId: category.id,
          categoryName: category.name,
          status: 'failed',
          error: error.message
        })
      }
    }

    return { processed: expiredCategories.length, results }
  } catch (error: any) {
    console.error(`❌ [${new Date().toISOString()}] Expiry checker error:`, error.message)
    throw error
  }
}

// Start automatic checker (runs every 5 minutes)
export function startExpiryChecker() {
  if (isCheckerRunning) {
    console.log('⚠️  Expiry checker already running')
    return
  }

  isCheckerRunning = true
  console.log('🚀 Starting automatic expiry checker (every 5 minutes)...')

  // Run immediately on start
  checkExpiredCategories().catch(console.error)

  // Then run every 5 minutes
  checkInterval = setInterval(() => {
    checkExpiredCategories().catch(console.error)
  }, 5 * 60 * 1000) // 5 minutes

  console.log('✅ Expiry checker started successfully')
}

// Stop checker
export function stopExpiryChecker() {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
    isCheckerRunning = false
    console.log('🛑 Expiry checker stopped')
  }
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    stopExpiryChecker()
  })
  
  process.on('SIGTERM', () => {
    stopExpiryChecker()
  })
}
