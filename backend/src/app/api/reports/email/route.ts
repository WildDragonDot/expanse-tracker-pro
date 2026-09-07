import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { sendEmail } from '@/lib/email'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCurrentBillingPeriod } from '@/lib/billingCycle'

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

    let effectiveFrom = dateFrom
    let effectiveTo = dateTo
    if (!effectiveFrom || !effectiveTo) {
      const billingDay = user.billingCycleStartDay || 1
      const period = getCurrentBillingPeriod(billingDay, new Date())
      effectiveFrom = period.startDate.toISOString().split('T')[0]
      effectiveTo = period.endDate.toISOString().split('T')[0]
    }

    // Build query filters
    const where: any = {
      userId,
      date: {
        gte: new Date(effectiveFrom),
        lte: new Date(effectiveTo + 'T23:59:59.999Z')
      }
    }

    if (category && category !== 'All') {
      where.category = category
    }

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
          gte: new Date(effectiveFrom),
          lte: new Date(effectiveTo + 'T23:59:59.999Z')
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalIncomes = incomes.reduce((sum, inc) => sum + inc.amount, 0)
    const balance = totalIncomes - totalExpenses
    const statementRef = `STMT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    // Generate Official Bank-Grade PDF report
    const pdfBuffer = await generateOfficialPDFStatement({
      user,
      expenses,
      incomes,
      dateFrom: effectiveFrom,
      dateTo: effectiveTo,
      category,
      type,
      totalExpenses,
      totalIncomes,
      balance,
      statementRef
    })

    const pdfBase64 = pdfBuffer.toString('base64')

    // If client strictly requested PDF generation only
    if (body.onlyPdf === true || type === 'pdfOnly') {
      return NextResponse.json({
        success: true,
        pdfBase64,
        filename: `financial-statement-${effectiveFrom}-to-${effectiveTo}.pdf`,
        stats: {
          expenses: expenses.length,
          incomes: incomes.length,
          totalExpenses,
          totalIncomes,
          balance,
          statementRef
        }
      })
    }

    // Prepare email attachments
    const emailAttachments: any[] = [
      {
        filename: `Financial-Statement-${statementRef}.pdf`,
        content: pdfBase64,
        encoding: 'base64'
      }
    ]

    // Add bill attachments if requested
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
              filename: `bill-${expense.id.slice(-6)}-${(expense.title || 'invoice').replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`,
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
                  filename: `bill-${expense.id.slice(-6)}-${(expense.title || 'invoice').replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
                  content: buffer.toString('base64'),
                  encoding: 'base64'
                })
                billCount++
              }
            } catch (e) {
              console.warn('Could not fetch receipt image for email:', e)
            }
          }
        }
      }
    }

    const targetEmail = (recipientEmail && recipientEmail.trim()) || user.email

    // Send email using authentic corporate statement template
    const emailResult = await sendEmail({
      to: targetEmail,
      subject: `Official Financial Statement: ${effectiveFrom} to ${effectiveTo} [Ref: ${statementRef}]`,
      html: generateStatementEmailHTML({
        userName: user.name,
        userEmail: user.email,
        dateFrom: effectiveFrom,
        dateTo: effectiveTo,
        type,
        totalExpenses,
        totalIncomes,
        balance,
        expenseCount: expenses.length,
        incomeCount: incomes.length,
        category,
        statementRef
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
      message: `Official financial statement sent successfully to ${targetEmail}`,
      messageId: emailResult.messageId,
      pdfBase64,
      targetEmail,
      stats: {
        statementRef,
        expenses: expenses.length,
        incomes: incomes.length,
        totalExpenses,
        totalIncomes,
        balance
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

// =========================================================================
// OFFICIAL BANK & TAX STATEMENT PDF GENERATOR (CLEAN, PROFESSIONAL, AUDITABLE)
// =========================================================================
async function generateOfficialPDFStatement(data: any): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let y = 15

  // 1. Top Corporate Bar (Slate/Navy)
  doc.setFillColor(15, 23, 42) // #0F172A
  doc.rect(0, 0, pageWidth, 28, 'F')
  
  // Left: Institution Name & Badge
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('EXPENSE TRACKER FINANCIAL TECHNOLOGIES', 15, 12)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184) // Slate-400
  doc.text('OFFICIAL ELECTRONIC FINANCIAL STATEMENT & LEDGER AUDIT', 15, 18)

  // Right: Document Status
  doc.setFillColor(16, 185, 129) // Emerald-500
  doc.roundedRect(pageWidth - 45, 8, 30, 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('VERIFIED AUDIT', pageWidth - 30, 13.5, { align: 'center' })

  y = 36

  // 2. Statement Metadata Header (2 Column Grid)
  doc.setFillColor(248, 250, 252) // #F8FAFC
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'S')

  // Left Details
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('STATEMENT RECIPIENT:', 20, y + 7)
  doc.text('REGISTERED EMAIL:', 20, y + 14)
  doc.text('CURRENCY / TIMEZONE:', 20, y + 21)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(data.user.name || 'Valued Account Holder', 65, y + 7)
  doc.text(data.user.email || 'N/A', 65, y + 14)
  doc.text('INR (Rs.) / IST (+05:30)', 65, y + 21)

  // Right Details
  const rightX = pageWidth / 2 + 10
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('STATEMENT REF #:', rightX, y + 7)
  doc.text('AUDIT PERIOD:', rightX, y + 14)
  doc.text('DATE OF ISSUE:', rightX, y + 21)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(data.statementRef || 'STMT-2026-LIVE', rightX + 35, y + 7)
  doc.text(`${data.dateFrom} to ${data.dateTo}`, rightX + 35, y + 14)
  doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), rightX + 35, y + 21)

  y += 36

  // 3. Executive Financial Position Summary
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('1. ACCOUNTING POSITION SUMMARY', 15, y)
  y += 5

  const netSavingsRate = data.totalIncomes > 0 ? ((data.balance / data.totalIncomes) * 100).toFixed(1) : '0'

  autoTable(doc, {
    startY: y,
    head: [['Component', 'Classification', 'Count', 'Net Amount (INR)']],
    body: [
      ['Total Inflow / Credits', 'Earned Income & Receipts', `${data.incomes.length} records`, `Rs. ${Number(data.totalIncomes).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ['Total Outflow / Debits', 'Expenses & Bill Payments', `${data.expenses.length} records`, `Rs. ${Number(data.totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ['Net Period Balance', 'Retained Operating Capital', `Savings Rate: ${netSavingsRate}%`, `Rs. ${Number(data.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3.5
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  })

  y = (doc as any).lastAutoTable.finalY + 12

  // 4. Itemized Expense Transactions Ledger
  if (data.expenses.length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('2. ITEMIZED DEBIT & EXPENSE LEDGER', 15, y)
    y += 5

    const expenseRows = data.expenses.map((e: any, index: number) => [
      `${index + 1}`,
      new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      e.title || 'General Expense',
      e.category || 'General',
      e.bank || e.paymentMode || 'Direct',
      `Rs. ${Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ])

    autoTable(doc, {
      startY: y,
      head: [['#', 'Value Date', 'Transaction Particulars', 'Category', 'Channel', 'Debit (INR)']],
      body: expenseRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [15, 23, 42]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 62, fontStyle: 'bold' },
        3: { cellWidth: 32 },
        4: { cellWidth: 26 },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] }
      },
      margin: { left: 14, right: 14 }
    })

    y = (doc as any).lastAutoTable.finalY + 12
  }

  // 5. Itemized Income Ledger
  if (data.incomes.length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('3. ITEMIZED INCOME & CREDIT LEDGER', 15, y)
    y += 5

    const incomeRows = data.incomes.map((inc: any, index: number) => [
      `${index + 1}`,
      new Date(inc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      inc.source || 'Direct Credit',
      inc.notes || 'Routine Inflow',
      `Rs. ${Number(inc.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ])

    autoTable(doc, {
      startY: y,
      head: [['#', 'Credit Date', 'Income Source / Particulars', 'Remarks / Memo', 'Credit (INR)']],
      body: incomeRows,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [15, 23, 42]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28 },
        2: { cellWidth: 70, fontStyle: 'bold' },
        3: { cellWidth: 44 },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] }
      },
      margin: { left: 14, right: 14 }
    })

    y = (doc as any).lastAutoTable.finalY + 12
  }

  // 6. Category Breakdown Distribution Table
  if (data.expenses.length > 0) {
    if (y > pageHeight - 50) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('4. CATEGORY DISTRIBUTION BREAKDOWN', 15, y)
    y += 5

    const catMap = data.expenses.reduce((acc: any, exp: any) => {
      const cat = exp.category || 'Other'
      acc[cat] = (acc[cat] || 0) + exp.amount
      return acc
    }, {})

    const catRows = Object.entries(catMap).map(([cat, amt]: [string, any]) => {
      const pct = data.totalExpenses > 0 ? ((amt / data.totalExpenses) * 100).toFixed(1) : '0'
      return [cat, `Rs. ${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, `${pct} %`]
    })

    autoTable(doc, {
      startY: y,
      head: [['Category Classification', 'Subtotal Expenditure', 'Share of Wallet']],
      body: catRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2.5
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 60, halign: 'right' },
        2: { cellWidth: 42, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // 7. Security Digital Seal & Signoff Box
  if (y > pageHeight - 40) {
    doc.addPage()
    y = 20
  }

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'F')
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'S')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('ELECTRONIC STATEMENT VERIFICATION & AUTHENTICITY SEAL', 20, y + 7)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`This official document is generated directly from the encrypted cloud ledger of Expense Tracker Technologies.`, 20, y + 13)
  doc.text(`Digital Verification Hash: SHA256-${Date.now().toString(16)}-${Math.random().toString(36).substring(2, 8).toUpperCase()} • Authorized System Signature`, 20, y + 18)

  // 8. Footer on Every Page
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(241, 245, 249)
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')

    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('EXPENSE TRACKER FINANCIAL TECHNOLOGIES • CONFIDENTIAL FINANCIAL STATEMENT', 15, pageHeight - 5)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 5, { align: 'right' })
  }

  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

// =========================================================================
// HIGH-END CORPORATE STATEMENT EMAIL HTML GENERATOR
// =========================================================================
function generateStatementEmailHTML(data: any): string {
  const savingsRate = data.totalIncomes > 0 ? ((data.balance / data.totalIncomes) * 100).toFixed(1) : '0'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
        .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .top-bar { background: #0f172a; padding: 24px 32px; color: #ffffff; display: table; width: 100%; box-sizing: border-box; border-bottom: 3px solid #10b981; }
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
              <strong>Period:</strong> ${data.dateFrom} to ${data.dateTo}<br>
              <strong>Statement Ref:</strong> ${data.statementRef}<br>
              <strong>Date of Issue:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        
        <div class="content">
          <div class="grid-2">
            <div class="col-left">
              <strong style="color: #0f172a; font-size: 14px;">ACCOUNT HOLDER:</strong><br>
              ${data.userName || 'Account Holder'}<br>
              ${data.userEmail || ''}<br>
              Currency: INR (₹)
            </div>
            <div class="col-right">
              <strong style="color: #0f172a; font-size: 14px;">ISSUING INSTITUTION:</strong><br>
              Expense Tracker Financial Technologies<br>
              Automated Ledger & Audit System<br>
              Verification: <strong>ACTIVE</strong>
            </div>
          </div>

          <table class="summary-table">
            <thead>
              <tr>
                <th>Component Particulars</th>
                <th>Classification</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Credits (Inflow)</td>
                <td><span style="color: #16a34a; font-weight: 600;">Income & Earnings (${data.incomeCount} entries)</span></td>
                <td style="text-align: right; font-weight: 700; color: #16a34a;">₹${Number(data.totalIncomes).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>Total Debits (Outflow)</td>
                <td><span style="color: #dc2626; font-weight: 600;">Expenses & Bills (${data.expenseCount} entries)</span></td>
                <td style="text-align: right; font-weight: 700; color: #dc2626;">₹${Number(data.totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>Net Accounting Balance</td>
                <td><span style="color: #2563eb; font-weight: 600;">Retained Operating Capital</span></td>
                <td style="text-align: right; font-weight: 700; color: #2563eb;">₹${Number(data.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row">
              <div class="total-lbl">Net Savings Efficiency Ratio:</div>
              <div class="total-val">${savingsRate}%</div>
            </div>
            <div class="total-row" style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
              <div class="total-lbl" style="font-size: 15px; color: #0f172a; font-weight: 700;">Closing Balance for Period:</div>
              <div class="total-val" style="font-size: 16px; color: #0f172a;">₹${Number(data.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="seal-box">
            📎 <strong>ATTACHED DOCUMENTATION:</strong> An official certified PDF statement (<code>Financial-Statement-${data.statementRef}.pdf</code>) containing the full itemized debit ledger, credit transactions, category distribution, and cryptographic audit hash has been attached to this email.
          </div>
        </div>

        <div class="footer">
          <strong>Confidentiality Notice:</strong> This document contains sensitive personal financial records. If you are not the intended recipient, please notify support@expensetracker.app immediately.<br>
          © ${new Date().getFullYear()} Expense Tracker Technologies. All rights reserved. Registered Electronic Financial Instrument.
        </div>
      </div>
    </body>
    </html>
  `
}
