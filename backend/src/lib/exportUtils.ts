// Enhanced Export utilities for Excel, PDF, JSON, and sharing
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportFilters {
  dateFrom?: string
  dateTo?: string
  category?: string
  type?: 'day' | 'month' | 'year'
}

export function exportToExcel(data: any[], filename: string, filters?: ExportFilters) {
  // Create CSV content
  let csvContent = ''
  
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Determine data type and create appropriate headers
  const firstItem = data[0]
  let headers: string[] = []
  
  if (firstItem.category !== undefined) {
    // Expense data
    headers = ['Date', 'Title', 'Amount (₹)', 'Category', 'Bank', 'Payment Mode', 'Tags', 'Notes']
    csvContent = headers.join(',') + '\n'
    
    data.forEach(item => {
      const row = [
        new Date(item.date).toLocaleDateString('en-IN'),
        `"${item.title}"`,
        item.amount,
        item.category,
        item.bank || '',
        item.paymentMode || '',
        Array.isArray(item.tags) ? `"${item.tags.join(', ')}"` : `"${item.tags || ''}"`,
        `"${item.notes || ''}"`
      ]
      csvContent += row.join(',') + '\n'
    })
  } else if (firstItem.source !== undefined) {
    // Income data
    headers = ['Date', 'Source', 'Amount (₹)', 'Notes']
    csvContent = headers.join(',') + '\n'
    
    data.forEach(item => {
      const row = [
        new Date(item.date).toLocaleDateString('en-IN'),
        `"${item.source}"`,
        item.amount,
        `"${item.notes || ''}"`
      ]
      csvContent += row.join(',') + '\n'
    })
  } else {
    // Generic data
    headers = Object.keys(firstItem)
    csvContent = headers.join(',') + '\n'
    
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header]
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value || ''
      })
      csvContent += row.join(',') + '\n'
    })
  }

  // Add summary at the end
  if (firstItem.amount !== undefined) {
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0)
    csvContent += '\n'
    csvContent += `Total,₹${total.toLocaleString('en-IN')}\n`
    csvContent += `Count,${data.length} transactions\n`
    
    if (filters) {
      csvContent += `Period,${filters.dateFrom || 'All'} to ${filters.dateTo || 'All'}\n`
      if (filters.category && filters.category !== 'All') {
        csvContent += `Category,${filters.category}\n`
      }
    }
    csvContent += `Generated,${new Date().toLocaleString('en-IN')}\n`
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function generateFinancialSummary(expenses: any[], incomes: any[], filters?: ExportFilters) {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0

  // Category breakdown
  const categoryBreakdown = expenses.reduce((acc: any, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)

  // Payment mode breakdown
  const paymentModeBreakdown = expenses.reduce((acc: any, e) => {
    const mode = e.paymentMode || 'Cash'
    acc[mode] = (acc[mode] || 0) + e.amount
    return acc
  }, {})

  return {
    summary: {
      totalExpenses,
      totalIncome,
      savings,
      savingsRate: Math.round(savingsRate * 100) / 100,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
      period: filters ? `${filters.dateFrom || 'All'} to ${filters.dateTo || 'All'}` : 'All time'
    },
    categoryBreakdown: topCategories,
    paymentModeBreakdown: Object.entries(paymentModeBreakdown),
    recentExpenses: expenses.slice(0, 10),
    recentIncomes: incomes.slice(0, 10)
  }
}

export function exportDetailedReport(expenses: any[], incomes: any[], filters?: ExportFilters) {
  const report = generateFinancialSummary(expenses, incomes, filters)
  
  let csvContent = 'FINANCIAL REPORT\n'
  csvContent += `Generated on: ${new Date().toLocaleString('en-IN')}\n`
  csvContent += `Period: ${report.summary.period}\n\n`
  
  // Summary section
  csvContent += 'SUMMARY\n'
  csvContent += `Total Income,₹${report.summary.totalIncome.toLocaleString('en-IN')}\n`
  csvContent += `Total Expenses,₹${report.summary.totalExpenses.toLocaleString('en-IN')}\n`
  csvContent += `Net Savings,₹${report.summary.savings.toLocaleString('en-IN')}\n`
  csvContent += `Savings Rate,${report.summary.savingsRate}%\n`
  csvContent += `Total Transactions,${report.summary.expenseCount + report.summary.incomeCount}\n\n`
  
  // Category breakdown
  csvContent += 'EXPENSE BREAKDOWN BY CATEGORY\n'
  csvContent += 'Category,Amount (₹),Percentage\n'
  report.categoryBreakdown.forEach(([category, amount]: [string, any]) => {
    const percentage = report.summary.totalExpenses > 0 ? ((amount / report.summary.totalExpenses) * 100).toFixed(1) : '0'
    csvContent += `${category},₹${amount.toLocaleString('en-IN')},${percentage}%\n`
  })
  csvContent += '\n'
  
  // Payment mode breakdown
  csvContent += 'EXPENSE BREAKDOWN BY PAYMENT MODE\n'
  csvContent += 'Payment Mode,Amount (₹)\n'
  report.paymentModeBreakdown.forEach(([mode, amount]: [string, any]) => {
    csvContent += `${mode},₹${amount.toLocaleString('en-IN')}\n`
  })
  csvContent += '\n'
  
  // Recent transactions
  if (report.recentExpenses.length > 0) {
    csvContent += 'RECENT EXPENSES\n'
    csvContent += 'Date,Title,Amount (₹),Category\n'
    report.recentExpenses.forEach((expense: any) => {
      csvContent += `${new Date(expense.date).toLocaleDateString('en-IN')},"${expense.title}",₹${expense.amount.toLocaleString('en-IN')},${expense.category}\n`
    })
    csvContent += '\n'
  }
  
  if (report.recentIncomes.length > 0) {
    csvContent += 'RECENT INCOMES\n'
    csvContent += 'Date,Source,Amount (₹)\n'
    report.recentIncomes.forEach((income: any) => {
      csvContent += `${new Date(income.date).toLocaleDateString('en-IN')},"${income.source}",₹${income.amount.toLocaleString('en-IN')}\n`
    })
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function getDateRangeFilters(type: 'day' | 'month' | 'year', date?: Date) {
  const targetDate = date || new Date()
  let dateFrom: string
  let dateTo: string

  switch (type) {
    case 'day':
      dateFrom = targetDate.toISOString().split('T')[0]
      dateTo = dateFrom
      break
    case 'month':
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
      dateFrom = startOfMonth.toISOString().split('T')[0]
      dateTo = endOfMonth.toISOString().split('T')[0]
      break
    case 'year':
      const startOfYear = new Date(targetDate.getFullYear(), 0, 1)
      const endOfYear = new Date(targetDate.getFullYear(), 11, 31)
      dateFrom = startOfYear.toISOString().split('T')[0]
      dateTo = endOfYear.toISOString().split('T')[0]
      break
  }

  return { dateFrom, dateTo }
}

// Enhanced Export Functions for Phase 1

/**
 * Export data to Premium PDF format with professional bill-like appearance
 */
export async function exportToPDF(
  expenses: any[], 
  incomes: any[], 
  analyticsData?: any,
  options: {
    includeCharts?: boolean
    includeSmartScore?: boolean
    includeSubscriptions?: boolean
    title?: string
    userInfo?: { name?: string, email?: string }
    reportType?: 'day' | 'month' | 'year'
    dateFrom?: string
    dateTo?: string
    category?: string
  } = {}
) {
  try {
    const { 
      includeCharts = true, 
      includeSmartScore = true, 
      includeSubscriptions = true,
      title = 'Premium Financial Report',
      userInfo = {},
      reportType = 'month',
      dateFrom,
      dateTo,
      category
    } = options

    const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPosition = 20

  // Premium Header with Gradient Effect (simulated with colors)
  doc.setFillColor(102, 126, 234) // Indigo gradient start
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  doc.setFillColor(139, 92, 246) // Purple gradient end
  doc.rect(0, 25, pageWidth, 25, 'F')

  // Company Logo Area (placeholder)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(15, 10, 30, 30, 5, 5, 'F')
  
  // Logo Text
  doc.setTextColor(102, 126, 234)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('ET', 30, 30, { align: 'center' })

  // Header Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Professional Financial Analysis & Reporting', pageWidth / 2, 35, { align: 'center' })
  
  // Report type and period subtitle
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  const periodText = dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time'
  const reportTypeText = reportType.charAt(0).toUpperCase() + reportType.slice(1) + 'ly Report'
  doc.text(`${reportTypeText} | ${periodText}${category && category !== 'All' ? ` | ${category}` : ''}`, pageWidth / 2, 42, { align: 'center' })

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
  doc.text(periodText, 60, yPosition + 21)

  // Right side - User details
  if (userInfo.name) {
    doc.setFont('helvetica', 'normal')
    doc.text('Prepared for:', pageWidth - 80, yPosition)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(139, 92, 246)
    doc.text(userInfo.name, pageWidth - 80, yPosition + 7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
  }
  
  if (userInfo.email) {
    doc.setTextColor(100, 100, 100)
    doc.text(userInfo.email, pageWidth - 80, yPosition + 14)
    doc.setTextColor(0, 0, 0)
  }
  
  // Category filter info
  if (category && category !== 'All') {
    doc.text('Category Filter:', pageWidth - 80, yPosition + 21)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(239, 68, 68)
    doc.text(category, pageWidth - 80, yPosition + 28)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
  }

  yPosition += 40

  // Separator line
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPosition, pageWidth - 20, yPosition)
  yPosition += 15

  // Executive Summary Box
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(15, yPosition, pageWidth - 30, 80, 5, 5, 'F')
  doc.setDrawColor(139, 92, 246)
  doc.setLineWidth(0.5)
  doc.roundedRect(15, yPosition, pageWidth - 30, 80, 5, 5, 'S')

  const report = generateFinancialSummary(expenses, incomes, { dateFrom, dateTo, category, type: reportType })
  
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

  // Summary metrics in a grid
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')

  const summaryY = yPosition + 25
  
  // Row 1
  doc.text('Total Income:', 25, summaryY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 197, 94)
  doc.text(`₹ ${report.summary.totalIncome.toLocaleString('en-IN')}`, 80, summaryY)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Total Expenses:', 120, summaryY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(239, 68, 68)
  doc.text(`₹ ${report.summary.totalExpenses.toLocaleString('en-IN')}`, 175, summaryY)

  // Row 2
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Net Balance:', 25, summaryY + 10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(report.summary.savings >= 0 ? 34 : 239, report.summary.savings >= 0 ? 197 : 68, report.summary.savings >= 0 ? 94 : 68)
  doc.text(`₹ ${Math.abs(report.summary.savings).toLocaleString('en-IN')}`, 80, summaryY + 10)
  doc.text(report.summary.savings >= 0 ? '(Surplus)' : '(Deficit)', 140, summaryY + 10)

  // Row 3
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Savings Rate:', 25, summaryY + 20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(102, 126, 234)
  doc.text(`${report.summary.savingsRate}%`, 80, summaryY + 20)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Transactions:', 120, summaryY + 20)
  doc.setFont('helvetica', 'bold')
  doc.text(`${report.summary.expenseCount + report.summary.incomeCount}`, 175, summaryY + 20)
  
  // Additional metrics row
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Avg Daily Expense:', 25, summaryY + 30)
  const avgDaily = report.summary.totalExpenses / Math.max(1, expenses.length > 0 ? 
    Math.ceil((new Date(Math.max(...expenses.map(e => new Date(e.date).getTime()))).getTime() - 
               new Date(Math.min(...expenses.map(e => new Date(e.date).getTime()))).getTime()) / (1000 * 60 * 60 * 24)) : 1)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(102, 126, 234)
  doc.text(`₹ ${avgDaily.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 80, summaryY + 30)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Report Status:', 120, summaryY + 30)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 197, 94)
  doc.text('Complete', 175, summaryY + 30)

  yPosition += 100

  // Financial Health Score (if available)
  if (includeSmartScore && analyticsData?.healthScore) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFillColor(252, 252, 252)
    doc.roundedRect(15, yPosition, pageWidth - 30, 40, 5, 5, 'F')
    doc.setDrawColor(34, 197, 94)
    doc.setLineWidth(0.5)
    doc.roundedRect(15, yPosition, pageWidth - 30, 40, 5, 5, 'S')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94)
    doc.text('Financial Health Score', 25, yPosition + 15)

    const healthScore = analyticsData.healthScore
    const scoreColor = healthScore >= 80 ? [34, 197, 94] : 
                     healthScore >= 60 ? [251, 191, 36] : [239, 68, 68]
    
    doc.setFontSize(28)
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
    doc.text(`${healthScore}%`, pageWidth - 80, yPosition + 20)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const healthDescription = healthScore >= 80 ? 'Excellent Financial Health' :
                            healthScore >= 60 ? 'Good Financial Management' :
                            'Needs Improvement'
    doc.text(healthDescription, pageWidth - 80, yPosition + 30)

    yPosition += 55
  }

  // Detailed Expense Analysis
  if (expenses.length > 0) {
    if (yPosition > pageHeight - 120) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(139, 92, 246)
    doc.text('Detailed Expense Analysis', 20, yPosition)
    yPosition += 15

    // Category breakdown with enhanced formatting
    const categoryData = report.categoryBreakdown.map(([category, amount]: [string, any]) => {
      const percentage = report.summary.totalExpenses > 0 ? 
        ((amount / report.summary.totalExpenses) * 100).toFixed(1) : '0'
      return [
        category, 
        `₹ ${amount.toLocaleString('en-IN')}`, 
        `${percentage}%`,
        '|'.repeat(Math.min(Math.floor(parseFloat(percentage) / 5), 10)) // Visual bar
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
  if (expenses.length > 0) {
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(139, 92, 246)
    doc.text('Payment Mode Analysis', 20, yPosition)
    yPosition += 15

    const paymentModeData = report.paymentModeBreakdown.map(([mode, amount]: [string, any]) => {
      const percentage = report.summary.totalExpenses > 0 ? 
        ((amount / report.summary.totalExpenses) * 100).toFixed(1) : '0'
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

  // Transaction Details
  if (expenses.length > 0 || incomes.length > 0) {
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 20
    }

    // Expenses Table
    if (expenses.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(239, 68, 68)
      doc.text('Expense Transactions', 20, yPosition)
      yPosition += 10

      const expenseData = expenses.slice(0, 15).map((expense: any) => [
        new Date(expense.date).toLocaleDateString('en-IN'),
        expense.title || 'N/A',
        expense.category || 'Uncategorized',
        expense.paymentMode || 'Cash',
        `₹ ${expense.amount.toLocaleString('en-IN')}`
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Description', 'Category', 'Payment', 'Amount (₹)']],
        body: expenseData,
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

    // Incomes Table
    if (incomes.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(34, 197, 94)
      doc.text('Income Transactions', 20, yPosition)
      yPosition += 10

      const incomeData = incomes.slice(0, 10).map((income: any) => [
        new Date(income.date).toLocaleDateString('en-IN'),
        income.source || 'N/A',
        income.notes || '-',
        `₹ ${income.amount.toLocaleString('en-IN')}`
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Source', 'Notes', 'Amount (₹)']],
        body: incomeData,
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
  
  // Generate insights based on data
  if (report.summary.savingsRate > 20) {
    insights.push('EXCELLENT: Savings rate above 20% - You are saving more than 20% of your income.')
  } else if (report.summary.savingsRate > 10) {
    insights.push('GOOD: Savings rate above 10% - Consider increasing to 20% for better financial security.')
  } else {
    insights.push('ATTENTION: Low savings rate - Focus on reducing expenses or increasing income.')
  }

  if (report.categoryBreakdown.length > 0) {
    const topCategory = report.categoryBreakdown[0]
    const topCategoryPercentage = ((topCategory[1] as number) / report.summary.totalExpenses * 100).toFixed(1)
    insights.push(`ANALYSIS: Your highest expense category is "${topCategory[0]}" (${topCategoryPercentage}% of total expenses).`)
  }

  if (report.summary.totalExpenses > report.summary.totalIncome) {
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
  doc.text(`Data Points Analyzed: ${expenses.length + incomes.length}`, 25, statsY + 8)
  doc.text(`Categories Tracked: ${Object.keys(report.categoryBreakdown).length}`, pageWidth - 80, statsY)
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

    // Download the PDF
    const filename = `premium_financial_report_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('PDF Export Error:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Export data to JSON format for backup/restore
 */
export function exportToJSON(expenses: any[], incomes: any[], subscriptions?: any[], options: {
  includeMetadata?: boolean
  filename?: string
} = {}) {
  const { includeMetadata = true, filename = 'financial_data_backup' } = options

  const exportData: any = {
    expenses,
    incomes,
    ...(subscriptions && { subscriptions }),
    ...(includeMetadata && {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
        totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
        expenseCount: expenses.length,
        incomeCount: incomes.length,
        dateRange: {
          earliest: expenses.length > 0 ? 
            new Date(Math.min(...expenses.map(e => new Date(e.date).getTime()))).toISOString() : null,
          latest: expenses.length > 0 ? 
            new Date(Math.max(...expenses.map(e => new Date(e.date).getTime()))).toISOString() : null
        }
      }
    })
  }

  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Generate WhatsApp share summary
 */
export function generateWhatsAppSummary(expenses: any[], incomes: any[], period: string = 'this month') {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : '0'

  // Top 3 categories
  const categoryBreakdown = expenses.reduce((acc: any, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([category, amount]) => `${category}: ₹${(amount as number).toLocaleString('en-IN')}`)

  const message = `💰 My Financial Summary (${period})

📊 Overview:
• Income: ₹${totalIncome.toLocaleString('en-IN')}
• Expenses: ₹${totalExpenses.toLocaleString('en-IN')}
• ${savings >= 0 ? 'Savings' : 'Deficit'}: ₹${Math.abs(savings).toLocaleString('en-IN')}
• Savings Rate: ${savingsRate}%

🏆 Top Spending Categories:
${topCategories.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

📱 Tracked with ExpenseTracker`

  return message
}

/**
 * Share via WhatsApp
 */
export function shareViaWhatsApp(expenses: any[], incomes: any[], period: string = 'this month') {
  const message = generateWhatsAppSummary(expenses, incomes, period)
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
  
  window.open(whatsappUrl, '_blank')
}

/**
 * Share via Email
 */
export function shareViaEmail(
  expenses: any[], 
  incomes: any[], 
  options: {
    subject?: string
    recipient?: string
    includeAttachment?: boolean
  } = {}
) {
  const { 
    subject = 'Financial Report', 
    recipient = '',
    includeAttachment = false 
  } = options

  const report = generateFinancialSummary(expenses, incomes)
  
  const emailBody = `Hi,

Here's my financial summary:

📊 Financial Overview:
• Total Income: ₹${report.summary.totalIncome.toLocaleString('en-IN')}
• Total Expenses: ₹${report.summary.totalExpenses.toLocaleString('en-IN')}
• Net Savings: ₹${report.summary.savings.toLocaleString('en-IN')}
• Savings Rate: ${report.summary.savingsRate}%
• Total Transactions: ${report.summary.expenseCount + report.summary.incomeCount}

🏆 Top Expense Categories:
${report.categoryBreakdown.slice(0, 5).map(([category, amount]: [string, any], i: number) => 
  `${i + 1}. ${category}: ₹${amount.toLocaleString('en-IN')}`
).join('\n')}

Generated on: ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

Best regards,
ExpenseTracker User`

  const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
  window.open(mailtoUrl)
}

/**
 * Generate secure public share link (placeholder - would need backend implementation)
 */
export function generatePublicShareLink(
  expenses: any[], 
  incomes: any[], 
  options: {
    expiresIn?: number // hours
    password?: string
    allowedViews?: number
  } = {}
) {
  // This would typically involve:
  // 1. Sending data to backend
  // 2. Generating secure token
  // 3. Storing data with expiration
  // 4. Returning public URL
  
  // For now, return a placeholder implementation
  const token = btoa(JSON.stringify({
    timestamp: Date.now(),
    dataHash: btoa(JSON.stringify({ expenses: expenses.length, incomes: incomes.length })),
    ...options
  }))
  
  const baseUrl = window.location.origin
  const shareUrl = `${baseUrl}/share/${token}`
  
  // Copy to clipboard
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert('Share link copied to clipboard!\n\nNote: This is a demo implementation. In production, this would create a secure, time-limited share link.')
  })
  
  return shareUrl
}

/**
 * Enhanced CSV export with better formatting
 */
export function exportToCSV(
  data: any[], 
  filename: string, 
  options: {
    includeHeaders?: boolean
    customHeaders?: string[]
    includeMetadata?: boolean
  } = {}
) {
  const { includeHeaders = true, customHeaders, includeMetadata = true } = options
  
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  let csvContent = ''
  
  // Add metadata header if requested
  if (includeMetadata) {
    csvContent += `# Financial Data Export\n`
    csvContent += `# Generated: ${new Date().toLocaleString('en-IN')}\n`
    csvContent += `# Records: ${data.length}\n`
    csvContent += `# \n`
  }

  const firstItem = data[0]
  let headers: string[] = customHeaders || []
  
  if (!customHeaders) {
    if (firstItem.category !== undefined) {
      // Expense data
      headers = ['Date', 'Title', 'Amount', 'Category', 'Bank', 'Payment Mode', 'Tags', 'Notes']
    } else if (firstItem.source !== undefined) {
      // Income data
      headers = ['Date', 'Source', 'Amount', 'Notes']
    } else {
      // Generic data
      headers = Object.keys(firstItem)
    }
  }
  
  if (includeHeaders) {
    csvContent += headers.join(',') + '\n'
  }
  
  data.forEach(item => {
    const row = headers.map(header => {
      let value = item[header.toLowerCase()] || item[header] || ''
      
      // Special formatting for different data types
      if (header.toLowerCase() === 'date' && value) {
        value = new Date(value).toLocaleDateString('en-IN')
      } else if (header.toLowerCase() === 'amount' && typeof value === 'number') {
        value = value.toString()
      } else if (Array.isArray(value)) {
        value = value.join('; ')
      } else if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`
      }
      
      return value
    })
    csvContent += row.join(',') + '\n'
  })

  // Add summary if it's financial data
  if (includeMetadata && firstItem.amount !== undefined) {
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0)
    csvContent += '\n'
    csvContent += `# Summary\n`
    csvContent += `Total Amount,₹${total.toLocaleString('en-IN')}\n`
    csvContent += `Transaction Count,${data.length}\n`
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Copy financial summary to clipboard
 */
export async function copyToClipboard(expenses: any[], incomes: any[], format: 'text' | 'markdown' = 'text') {
  const report = generateFinancialSummary(expenses, incomes)
  
  let content = ''
  
  if (format === 'markdown') {
    content = `# Financial Summary

## Overview
- **Total Income:** ₹${report.summary.totalIncome.toLocaleString('en-IN')}
- **Total Expenses:** ₹${report.summary.totalExpenses.toLocaleString('en-IN')}
- **Net Savings:** ₹${report.summary.savings.toLocaleString('en-IN')}
- **Savings Rate:** ${report.summary.savingsRate}%

## Top Categories
${report.categoryBreakdown.slice(0, 5).map(([category, amount]: [string, any], i: number) => 
  `${i + 1}. **${category}:** ₹${amount.toLocaleString('en-IN')}`
).join('\n')}

*Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*`
  } else {
    content = `Financial Summary

Total Income: ₹${report.summary.totalIncome.toLocaleString('en-IN')}
Total Expenses: ₹${report.summary.totalExpenses.toLocaleString('en-IN')}
Net Savings: ₹${report.summary.savings.toLocaleString('en-IN')}
Savings Rate: ${report.summary.savingsRate}%

Top Categories:
${report.categoryBreakdown.slice(0, 5).map(([category, amount]: [string, any], i: number) => 
  `${i + 1}. ${category}: ₹${amount.toLocaleString('en-IN')}`
).join('\n')}

Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
  }

  try {
    await navigator.clipboard.writeText(content)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}