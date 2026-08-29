import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { sendEmail } from '@/lib/email'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json()
    const { dateFrom, dateTo, category, type, selectedExpenseIds, includeBillAttachments, recipientEmail, returnPdfBase64 } = body

    // Fetch user
    let user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      user = await prisma.user.findFirst()
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build query filters
    const where: any = {
      userId,
      date: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      }
    }

    if (category && category !== 'All') {
      where.category = category
    }

    // If specific expenses are selected, filter by IDs
    if (selectedExpenseIds && selectedExpenseIds.length > 0) {
      where.id = { in: selectedExpenseIds }
    }

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    // Fetch incomes for the same period
    const incomes = await prisma.income.findMany({
      where: {
        userId,
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalIncomes = incomes.reduce((sum, inc) => sum + inc.amount, 0)
    const balance = totalIncomes - totalExpenses

    // Generate Premium PDF report
    const pdfBuffer = await generatePremiumPDFReport({
      user,
      expenses,
      incomes,
      dateFrom,
      dateTo,
      category,
      type,
      totalExpenses,
      totalIncomes,
      balance
    })

    const pdfBase64 = pdfBuffer.toString('base64')

    // If client strictly requested PDF generation only (e.g. for print/preview without email)
    if (body.onlyPdf === true || type === 'pdfOnly') {
      return NextResponse.json({
        success: true,
        pdfBase64,
        filename: `financial-statement-${dateFrom}-to-${dateTo}.pdf`,
        stats: {
          expenses: expenses.length,
          incomes: incomes.length,
          totalExpenses,
          totalIncomes,
          balance
        }
      })
    }

    // Prepare email attachments
    const emailAttachments: any[] = [
      {
        filename: `financial-statement-${dateFrom}-to-${dateTo}.pdf`,
        content: pdfBase64,
        encoding: 'base64'
      }
    ]

    // Add bill attachments if requested (limit to 10)
    if (includeBillAttachments) {
      let billCount = 0
      for (const expense of expenses) {
        if (billCount >= 10) break
        
        if (expense.receiptUrl) {
          if (expense.receiptUrl.startsWith('data:')) {
            const base64Data = expense.receiptUrl.split(',')[1]
            const mimeType = expense.receiptUrl.split(';')[0].split(':')[1] || 'image/jpeg'
            const extension = mimeType.split('/')[1] || 'jpg'
            emailAttachments.push({
              filename: `receipt-${expense.id.slice(-6)}-${(expense.title || 'bill').replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`,
              content: base64Data,
              encoding: 'base64'
            })
            billCount++
          } else if (expense.receiptUrl.startsWith('http')) {
            try {
              const imgRes = await fetch(expense.receiptUrl)
              if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                emailAttachments.push({
                  filename: `receipt-${expense.id.slice(-6)}-${(expense.title || 'bill').replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
                  content: buffer.toString('base64'),
                  encoding: 'base64'
                })
                billCount++
              }
            } catch (e) {
              console.warn('Could not fetch R2 image attachment for email:', e)
            }
          }
        }
      }
    }

    // Target recipient email (custom email if provided, else user's registered email)
    const targetEmail = (recipientEmail && recipientEmail.trim()) || user.email

    // Send email using the existing sendEmail utility
    const emailResult = await sendEmail({
      to: targetEmail,
      subject: `Official Financial Statement: ${dateFrom} to ${dateTo} | ExpenseTracker Pro`,
      html: generateEmailHTML({
        userName: user.name,
        dateFrom,
        dateTo,
        type,
        totalExpenses,
        totalIncomes,
        balance,
        expenseCount: expenses.length,
        incomeCount: incomes.length,
        category
      }),
      attachments: emailAttachments
    })

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Email sending failed',
        message: emailResult.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Financial statement sent successfully to ${targetEmail}`,
      messageId: emailResult.messageId,
      pdfBase64,
      targetEmail,
      stats: {
        expenses: expenses.length,
        incomes: incomes.length,
        attachments: emailAttachments.length
      }
    })

  } catch (error: any) {
    console.error('Email report error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email report' },
      { status: 500 }
    )
  }
})

async function generatePremiumPDFReport(data: any): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPosition = 20

  // Premium Header with Gradient Effect
  doc.setFillColor(102, 126, 234) // Indigo
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  doc.setFillColor(139, 92, 246) // Purple
  doc.rect(0, 25, pageWidth, 25, 'F')

  // Company Logo Area
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(15, 10, 30, 30, 5, 5, 'F')
  
  // Logo Text
  doc.setTextColor(102, 126, 234)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('ET', 30, 30, { align: 'center' })

  // Header Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Premium Financial Report', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const reportTypeText = data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) + 'ly Report' : 'Financial Report'
  doc.text(`${reportTypeText} | Period: ${data.dateFrom} to ${data.dateTo}`, pageWidth / 2, 35, { align: 'center' })

  yPosition = 65

  // Enhanced Bill Information Section
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Left side - Report details
  doc.text('Report ID:', 20, yPosition)
  doc.setFont('helvetica', 'bold')
  doc.text(`FIN-${Date.now().toString().slice(-8)}`, 60, yPosition)
  
  doc.setFont('helvetica', 'normal')
  doc.text('Generated:', 20, yPosition + 7)
  doc.setFont('helvetica', 'bold')
  doc.text(new Date().toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }), 60, yPosition + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.text('Report Type:', 20, yPosition + 14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(102, 126, 234)
  doc.text(reportTypeText, 60, yPosition + 14)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Period:', 20, yPosition + 21)
  doc.setFont('helvetica', 'bold')
  doc.text(`${data.dateFrom} to ${data.dateTo}`, 60, yPosition + 21)

  // Right side - User details
  doc.setFont('helvetica', 'normal')
  doc.text('Prepared for:', pageWidth - 80, yPosition)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(139, 92, 246)
  doc.text(data.user.name || 'Valued Customer', pageWidth - 80, yPosition + 7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  
  if (data.user.email) {
    doc.setTextColor(100, 100, 100)
    doc.text(data.user.email, pageWidth - 80, yPosition + 14)
    doc.setTextColor(0, 0, 0)
  }
  
  // Category filter info
  if (data.category && data.category !== 'All') {
    doc.text('Category Filter:', pageWidth - 80, yPosition + 21)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(239, 68, 68)
    doc.text(data.category, pageWidth - 80, yPosition + 28)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
  }

  yPosition += 40

  // Separator
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPosition, pageWidth - 20, yPosition)
  yPosition += 15

  // Executive Summary Box
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(15, yPosition, pageWidth - 30, 80, 5, 5, 'F')
  doc.setDrawColor(139, 92, 246)
  doc.setLineWidth(0.5)
  doc.roundedRect(15, yPosition, pageWidth - 30, 80, 5, 5, 'S')

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(139, 92, 246)
  doc.text('Executive Summary', 25, yPosition + 15)
  
  // Add premium badge
  doc.setFillColor(255, 215, 0)
  doc.roundedRect(pageWidth - 60, yPosition + 5, 35, 12, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('PREMIUM', pageWidth - 42, yPosition + 12, { align: 'center' })

  // Summary metrics
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')

  const summaryY = yPosition + 25
  
  // Row 1
  doc.text('Total Income:', 25, summaryY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 197, 94)
  doc.text(`₹ ${data.totalIncomes.toLocaleString('en-IN')}`, 80, summaryY)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Total Expenses:', 120, summaryY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(239, 68, 68)
  doc.text(`₹ ${data.totalExpenses.toLocaleString('en-IN')}`, 175, summaryY)

  // Row 2
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Net Balance:', 25, summaryY + 10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(data.balance >= 0 ? 34 : 239, data.balance >= 0 ? 197 : 68, data.balance >= 0 ? 94 : 68)
  doc.text(`₹ ${Math.abs(data.balance).toLocaleString('en-IN')}`, 80, summaryY + 10)
  doc.text(data.balance >= 0 ? '(Surplus)' : '(Deficit)', 140, summaryY + 10)

  // Row 3
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Transactions:', 25, summaryY + 20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(102, 126, 234)
  doc.text(`${data.expenses.length} expenses, ${data.incomes.length} incomes`, 80, summaryY + 20)

  // Savings Rate
  const savingsRate = data.totalIncomes > 0 ? ((data.balance / data.totalIncomes) * 100).toFixed(1) : '0'
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Savings Rate:', 25, summaryY + 30)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(102, 126, 234)
  doc.text(`${savingsRate}%`, 80, summaryY + 30)
  
  // Additional metrics row
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Avg Daily Expense:', 25, summaryY + 40)
  const avgDaily = data.totalExpenses / Math.max(1, data.expenses.length > 0 ? 
    Math.ceil((new Date(Math.max(...data.expenses.map((e: any) => new Date(e.date).getTime()))).getTime() - 
               new Date(Math.min(...data.expenses.map((e: any) => new Date(e.date).getTime()))).getTime()) / (1000 * 60 * 60 * 24)) : 1)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(102, 126, 234)
  doc.text(`₹ ${avgDaily.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 80, summaryY + 40)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Report Status:', 120, summaryY + 40)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 197, 94)
  doc.text('Complete', 175, summaryY + 40)

  yPosition += 100

  // Category Analysis
  if (data.expenses.length > 0) {
    if (yPosition > pageHeight - 120) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(139, 92, 246)
    doc.text('Expense Analysis by Category', 20, yPosition)
    yPosition += 15

    // Calculate category breakdown
    const categoryBreakdown = data.expenses.reduce((acc: any, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {})

    const categoryData = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([category, amount]: [string, any]) => {
        const percentage = data.totalExpenses > 0 ? 
          ((amount / data.totalExpenses) * 100).toFixed(1) : '0'
        return [
          category, 
          `₹ ${amount.toLocaleString('en-IN')}`, 
          `${percentage}%`,
          '|'.repeat(Math.min(Math.floor(parseFloat(percentage) / 5), 10))
        ]
      })

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Amount (₹)', 'Share', 'Distribution']],
      body: categoryData,
      theme: 'grid',
      headStyles: { 
        fillColor: [139, 92, 246],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'right', textColor: [239, 68, 68] },
        2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 35, halign: 'left', textColor: [139, 92, 246] }
      },
      margin: { left: 20, right: 20 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 20
  }

  // Payment Mode Analysis
  if (data.expenses.length > 0) {
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(139, 92, 246)
    doc.text('Payment Mode Analysis', 20, yPosition)
    yPosition += 15

    const paymentModeBreakdown = data.expenses.reduce((acc: any, e: any) => {
      const mode = e.paymentMode || 'Cash'
      acc[mode] = (acc[mode] || 0) + e.amount
      return acc
    }, {})

    const paymentModeData = Object.entries(paymentModeBreakdown).map(([mode, amount]: [string, any]) => {
      const percentage = data.totalExpenses > 0 ? 
        ((amount / data.totalExpenses) * 100).toFixed(1) : '0'
      return [
        mode, 
        `₹ ${amount.toLocaleString('en-IN')}`, 
        `${percentage}%`,
        '='.repeat(Math.min(Math.floor(parseFloat(percentage) / 3), 15))
      ]
    })

    autoTable(doc, {
      startY: yPosition,
      head: [['Payment Mode', 'Amount (₹)', 'Usage %', 'Distribution']],
      body: paymentModeData,
      theme: 'grid',
      headStyles: { 
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244]
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 45, halign: 'right', textColor: [34, 197, 94] },
        2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 50, halign: 'left', textColor: [34, 197, 94] }
      },
      margin: { left: 20, right: 20 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 20
  }

  // Detailed Transactions
  if (data.expenses.length > 0) {
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(239, 68, 68)
    doc.text('Expense Transactions', 20, yPosition)
    yPosition += 10

    const expenseRows = data.expenses.slice(0, 20).map((expense: any) => [
      new Date(expense.date).toLocaleDateString('en-IN'),
      expense.title || 'N/A',
      expense.category || 'Uncategorized',
      expense.paymentMode || 'Cash',
      `₹ ${expense.amount.toLocaleString('en-IN')}`
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Description', 'Category', 'Payment', 'Amount (₹)']],
      body: expenseRows,
      theme: 'striped',
      headStyles: { 
        fillColor: [239, 68, 68],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [254, 242, 242]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [239, 68, 68] }
      },
      margin: { left: 20, right: 20 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Income Transactions
  if (data.incomes.length > 0) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94)
    doc.text('Income Transactions', 20, yPosition)
    yPosition += 10

    const incomeRows = data.incomes.slice(0, 15).map((income: any) => [
      new Date(income.date).toLocaleDateString('en-IN'),
      income.source || 'N/A',
      income.notes || '-',
      `₹ ${income.amount.toLocaleString('en-IN')}`
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Source', 'Notes', 'Amount (₹)']],
      body: incomeRows,
      theme: 'striped',
      headStyles: { 
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244]
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 60 },
        2: { cellWidth: 50 },
        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [34, 197, 94] }
      },
      margin: { left: 20, right: 20 }
    })
  }

  // Financial Insights & Recommendations
  if (yPosition > pageHeight - 120) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(139, 92, 246)
  doc.text('Financial Insights & Recommendations', 20, yPosition)
  yPosition += 15

  // Create insights box
  doc.setFillColor(252, 252, 252)
  doc.roundedRect(15, yPosition, pageWidth - 30, 60, 5, 5, 'F')
  doc.setDrawColor(34, 197, 94)
  doc.setLineWidth(0.5)
  doc.roundedRect(15, yPosition, pageWidth - 30, 60, 5, 5, 'S')

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')

  const insights = []
  const currentSavingsRate = data.totalIncomes > 0 ? ((data.balance / data.totalIncomes) * 100) : 0
  
  // Generate insights based on data
  if (currentSavingsRate > 20) {
    insights.push('EXCELLENT: Savings rate above 20% - You are saving more than 20% of your income.')
  } else if (currentSavingsRate > 10) {
    insights.push('GOOD: Savings rate above 10% - Consider increasing to 20% for better financial security.')
  } else {
    insights.push('ATTENTION: Low savings rate - Focus on reducing expenses or increasing income.')
  }

  if (data.expenses.length > 0) {
    const categoryBreakdown = data.expenses.reduce((acc: any, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {})
    
    const topCategory = Object.entries(categoryBreakdown).sort(([,a], [,b]) => (b as number) - (a as number))[0]
    if (topCategory) {
      const topCategoryPercentage = ((topCategory[1] as number) / data.totalExpenses * 100).toFixed(1)
      insights.push(`ANALYSIS: Your highest expense category is "${topCategory[0]}" (${topCategoryPercentage}% of total expenses).`)
    }
  }

  if (data.totalExpenses > data.totalIncomes) {
    insights.push('WARNING: You are spending more than you earn - Consider budget optimization.')
  }

  // Add insights to PDF
  let insightY = yPosition + 15
  insights.forEach((insight, index) => {
    if (insightY > yPosition + 50) return // Don't overflow the box
    doc.text(`${index + 1}. ${insight}`, 25, insightY)
    insightY += 12
  })

  yPosition += 75

  // Report Summary Statistics
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(15, yPosition, pageWidth - 30, 40, 5, 5, 'F')
  doc.setDrawColor(102, 126, 234)
  doc.setLineWidth(0.5)
  doc.roundedRect(15, yPosition, pageWidth - 30, 40, 5, 5, 'S')

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(102, 126, 234)
  doc.text('Report Statistics', 25, yPosition + 15)

  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  
  const statsY = yPosition + 25
  doc.text(`Report Generated: ${new Date().toLocaleString('en-IN')}`, 25, statsY)
  doc.text(`Data Points Analyzed: ${data.expenses.length + data.incomes.length}`, 25, statsY + 8)
  
  const categoryCount = data.expenses.reduce((acc: any, e: any) => {
    acc[e.category] = true
    return acc
  }, {})
  doc.text(`Categories Tracked: ${Object.keys(categoryCount).length}`, pageWidth - 80, statsY)
  doc.text(`Premium Features: Enabled`, pageWidth - 80, statsY + 8)

  yPosition += 55

  // Premium Footer with branding
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Footer background
    doc.setFillColor(248, 250, 252)
    doc.rect(0, pageHeight - 25, pageWidth, 25, 'F')
    
    // Footer content
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('ExpenseTracker Premium Report', 20, pageHeight - 15)
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 20, pageHeight - 8)
    
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 15, { align: 'right' })
    doc.text('Confidential Financial Document', pageWidth - 30, pageHeight - 8, { align: 'right' })
    
    // Watermark
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(40)
    doc.text('PREMIUM', pageWidth / 2, pageHeight / 2, { 
      align: 'center', 
      angle: 45 
    })
  }

  // Convert to buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

function generateEmailHTML(data: any): string {
  const savingsRate = data.totalIncomes > 0 ? ((data.balance / data.totalIncomes) * 100).toFixed(1) : '0'
  const reportTypeText = data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) + 'ly Report' : 'Financial Report'
  const periodText = `${data.dateFrom} to ${data.dateTo}`
  const categoryText = data.category ? ` | Category: ${data.category}` : ''
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Premium Financial Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          background-color: #f9fafb;
        }
        .container { 
          max-width: 650px; 
          margin: 0 auto; 
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-radius: 16px;
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #8b5cf6 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        .header-content { position: relative; z-index: 1; }
        .logo { 
          width: 60px; 
          height: 60px; 
          background: rgba(255, 255, 255, 0.2); 
          border-radius: 12px; 
          margin: 0 auto 20px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 24px; 
          font-weight: bold;
          backdrop-filter: blur(10px);
        }
        .header h1 { 
          font-size: 28px; 
          font-weight: 700; 
          margin-bottom: 8px; 
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header p { 
          font-size: 16px; 
          opacity: 0.9; 
          font-weight: 500;
        }
        .header .subtitle {
          font-size: 14px;
          opacity: 0.8;
          margin-top: 5px;
        }
        .premium-badge {
          display: inline-block;
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          color: #000;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-left: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .content { 
          padding: 40px 30px; 
          background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%);
        }
        .greeting { 
          font-size: 18px; 
          font-weight: 600; 
          color: #1f2937; 
          margin-bottom: 16px; 
        }
        .intro { 
          color: #6b7280; 
          margin-bottom: 30px; 
          font-size: 15px; 
          line-height: 1.7;
        }
        .summary { 
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
          padding: 30px; 
          border-radius: 16px; 
          margin: 30px 0; 
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .summary-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
          text-align: center;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #f3f4f6;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .stat-label { 
          color: #6b7280; 
          font-size: 13px; 
          font-weight: 500; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
          margin-bottom: 8px;
        }
        .stat-value { 
          font-weight: 700; 
          font-size: 24px; 
          line-height: 1;
        }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .neutral { color: #6366f1; }
        .balance-section {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #0ea5e9;
        }
        .balance-label {
          color: #0369a1;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .balance-value {
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
        }
        .balance-subtitle {
          color: #0369a1;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 500;
        }
        .highlights {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        .highlights-title {
          color: #92400e;
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .highlights-list {
          color: #78350f;
          font-size: 14px;
          line-height: 1.6;
        }
        .cta {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin: 30px 0;
        }
        .cta-text {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .cta-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        .footer { 
          text-align: center; 
          color: #9ca3af; 
          font-size: 13px; 
          padding: 30px; 
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        .footer-brand {
          font-weight: 600;
          color: #6366f1;
          margin-bottom: 8px;
        }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .content { padding: 30px 20px; }
          .header { padding: 30px 20px; }
          .stats-grid { grid-template-columns: 1fr; }
          .stat-value { font-size: 20px; }
          .balance-value { font-size: 28px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <div class="logo">ET</div>
            <h1>Premium Financial Report<span class="premium-badge">PRO</span></h1>
            <p>${reportTypeText}</p>
            <div class="subtitle">${periodText}${categoryText}</div>
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.userName},</div>
          
          <div class="intro">
            Here's your comprehensive <strong>${reportTypeText.toLowerCase()}</strong> for the selected period${categoryText ? ` with category filter applied` : ''}. 
            This premium analysis includes detailed breakdowns, insights, bill attachments, and professional documentation with INR currency formatting.
          </div>
          
          <!-- Report Details Section -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #0ea5e9;">
            <h3 style="color: #0369a1; font-size: 16px; font-weight: 600; margin-bottom: 12px;">Report Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
              <div>
                <span style="color: #0369a1; font-weight: 500;">Report Type:</span><br>
                <strong>${reportTypeText}</strong>
              </div>
              <div>
                <span style="color: #0369a1; font-weight: 500;">Period:</span><br>
                <strong>${periodText}</strong>
              </div>
              <div>
                <span style="color: #0369a1; font-weight: 500;">Category Filter:</span><br>
                <strong>${data.category || 'All Categories'}</strong>
              </div>
              <div>
                <span style="color: #0369a1; font-weight: 500;">Currency:</span><br>
                <strong>Indian Rupees (₹)</strong>
              </div>
            </div>
          </div>
          
          <div class="summary">
            <div class="summary-title">📊 Financial Overview</div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Income</div>
                <div class="stat-value positive">₹${data.totalIncomes.toLocaleString('en-IN')}</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-label">Total Expenses</div>
                <div class="stat-value negative">₹${data.totalExpenses.toLocaleString('en-IN')}</div>
              </div>
            </div>
            
            <div class="balance-section">
              <div class="balance-label">Net Balance</div>
              <div class="balance-value ${data.balance >= 0 ? 'positive' : 'negative'}">
                ₹${Math.abs(data.balance).toLocaleString('en-IN')}
              </div>
              <div class="balance-subtitle">
                ${data.balance >= 0 ? '✅ Surplus' : '⚠️ Deficit'} • Savings Rate: ${savingsRate}%
              </div>
            </div>
          </div>
          
          <div class="highlights">
            <div class="highlights-title">Key Insights & Analytics</div>
            <div class="highlights-list">
              • <strong>Total Transactions:</strong> ${data.expenseCount} expenses, ${data.incomeCount} incomes<br>
              • <strong>Financial Health Score:</strong> ${parseFloat(savingsRate) >= 20 ? 'Excellent (80+)' : parseFloat(savingsRate) >= 10 ? 'Good (60-79)' : 'Needs Improvement (<60)'}<br>
              • <strong>Average Daily Spending:</strong> ₹${Math.round(data.totalExpenses / Math.max(1, 30)).toLocaleString('en-IN')}<br>
              • <strong>Savings Efficiency:</strong> ${parseFloat(savingsRate)}% of income saved<br>
              • <strong>Report Features:</strong> Premium Analysis with Bill Attachments & ₹ Symbol Formatting<br>
              • <strong>Document Security:</strong> Watermarked & Confidential<br>
              • <strong>Export Format:</strong> Professional PDF with Charts & Analytics
            </div>
          </div>
          
          <div class="cta">
            <div class="cta-text">📎 Complete Documentation Attached</div>
            <div class="cta-subtitle">
              Please find the detailed report and bill attachments in the PDF files attached to this email.
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin-top: 30px;">
            This premium report includes comprehensive financial analysis, category breakdowns, 
            transaction details, and all supporting bill attachments for your records.
          </p>
          
          <p style="color: #1f2937; font-weight: 600; margin-top: 30px;">
            Best regards,<br>
            <span style="color: #6366f1;">ExpenseTracker Premium Team</span>
          </p>
        </div>
        
        <div class="footer">
          <div class="footer-brand">ExpenseTracker Premium</div>
          <div>This is an automated premium report. Please do not reply to this email.</div>
          <div style="margin-top: 8px; font-size: 12px;">
            Generated on ${new Date().toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}


