import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function exportCategoryToPDF(category: any, expenses: any[], userEmail?: string) {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header - Bank Statement Style
  doc.setFillColor(41, 98, 255) // Blue header
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Company/App Name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('EXPENSE TRACKER', 14, 16)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Personal Finance Management System', 14, 23)
  
  // User Email
  if (userEmail) {
    doc.setFontSize(8)
    doc.text(`Account: ${userEmail}`, 14, 30)
  }
  
  // Statement Date
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
  
  // Reset text color
  doc.setTextColor(0, 0, 0)
  
  // Category Details Box
  doc.setFillColor(245, 247, 250)
  doc.rect(14, 50, pageWidth - 28, 45, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(14, 50, pageWidth - 28, 45, 'S')
  
  // Category Icon and Name
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  // Skip emoji icon as jsPDF doesn't support it well
  doc.text(category.name, 20, 60)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Category Type: ${category.type.toUpperCase()}`, 20, 68)
  
  // Period Information
  if (category.startDate || category.endDate) {
    const startDate = category.startDate ? new Date(category.startDate).toLocaleDateString('en-IN') : 'N/A'
    const endDate = category.endDate ? new Date(category.endDate).toLocaleDateString('en-IN') : 'N/A'
    doc.text(`Period: ${startDate} to ${endDate}`, 20, 74)
  }
  
  // Status Badge
  const status = category.isActive ? 'ACTIVE' : 'INACTIVE'
  const statusColor = category.isActive ? [34, 197, 94] : [239, 68, 68]
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.roundedRect(20, 78, 20, 6, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(status, 30, 82, { align: 'center' })
  
  // Financial Summary Box
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(200, 200, 200)
  doc.rect(14, 100, pageWidth - 28, 32, 'FD')
  
  const colWidth = (pageWidth - 28) / 3
  
  // Expected Cost
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('EXPECTED BUDGET', 20, 108)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246)
  doc.text(`INR ${category.expectedCost.toLocaleString('en-IN')}`, 20, 118)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Planned Amount', 20, 124)
  
  // Real Cost
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('ACTUAL SPENT', 20 + colWidth, 108)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text(`INR ${category.realCost.toLocaleString('en-IN')}`, 20 + colWidth, 118)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Total Expenses', 20 + colWidth, 124)
  
  // Variance
  const variance = category.realCost - category.expectedCost
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('VARIANCE', 20 + colWidth * 2, 108)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(variance > 0 ? 239 : 34, variance > 0 ? 68 : 197, variance > 0 ? 68 : 94)
  doc.text(`${variance > 0 ? '+' : ''}INR ${Math.abs(variance).toLocaleString('en-IN')}`, 20 + colWidth * 2, 118)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(variance > 0 ? 'Over Budget' : 'Under Budget', 20 + colWidth * 2, 124)
  
  // Transaction Details Header
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('TRANSACTION DETAILS', 14, 143)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Total Transactions: ${expenses.length}`, pageWidth - 14, 143, { align: 'right' })
  
  // Expenses Table - Bank Statement Style
  const tableData = expenses.map((expense, index) => [
    (index + 1).toString(),
    new Date(expense.date).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }),
    expense.title,
    expense.description || '-',
    `INR ${expense.amount.toLocaleString('en-IN')}`,
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
    
    // Footer
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
  
    // Save
    const fileName = `${category.name.replace(/[^a-z0-9]/gi, '_')}_Statement_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  } catch (error) {
    console.error('PDF Export Error:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}

export function exportCategoryToExcel(category: any, expenses: any[]) {
  // Create CSV content
  let csv = `Category: ${category.name}\n`
  csv += `Type: ${category.type}\n`
  csv += `Expected Cost: ₹${category.expectedCost.toLocaleString()}\n`
  csv += `Real Cost: ₹${category.realCost.toLocaleString()}\n`
  csv += `Variance: ₹${(category.realCost - category.expectedCost).toLocaleString()}\n\n`
  
  csv += 'Date,Title,Description,Expected Amount,Actual Amount,Completed\n'
  
  expenses.forEach(expense => {
    csv += `${new Date(expense.date).toLocaleDateString()},`
    csv += `"${expense.title}",`
    csv += `"${expense.description || ''}",`
    csv += `${expense.amount},`
    csv += `${expense.actualAmount || ''},`
    csv += `${expense.isCompleted ? 'Yes' : 'No'}\n`
  })
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${category.name}_expenses.csv`
  link.click()
}

export async function sendCategoryEmail(category: any, expenses: any[], userEmail: string) {
  try {
    // Generate PDF
    const doc = await generateCategoryPDF(category, expenses, userEmail)
    const pdfBlob = doc.output('blob')
    
    // Convert blob to base64
    const reader = new FileReader()
    const pdfBase64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(pdfBlob)
    })
    
    const response = await fetch('/api/category-export/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        category,
        expenses,
        userEmail,
        pdfAttachment: pdfBase64,
        pdfFilename: `${category.name.replace(/[^a-z0-9]/gi, '_')}_Statement_${new Date().toISOString().split('T')[0]}.pdf`
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || 'Failed to send email'
      throw new Error(errorMessage)
    }
    
    return true
  } catch (error: any) {
    console.error('Error sending email:', error)
    throw new Error(error.message || 'Failed to send email. Please check your SMTP configuration.')
  }
}

// Helper function to generate PDF (extracted from exportCategoryToPDF)
async function generateCategoryPDF(category: any, expenses: any[], userEmail?: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header - Bank Statement Style
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
  
  // Category Details Box
  doc.setFillColor(245, 247, 250)
  doc.rect(14, 50, pageWidth - 28, 45, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(14, 50, pageWidth - 28, 45, 'S')
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
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
  
  const status = category.isActive ? 'ACTIVE' : 'INACTIVE'
  const statusColor = category.isActive ? [34, 197, 94] : [239, 68, 68]
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.roundedRect(20, 78, 20, 6, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(status, 30, 82, { align: 'center' })
  
  // Financial Summary Box
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
  doc.text(`INR ${category.expectedCost.toLocaleString('en-IN')}`, 20, 118)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Planned Amount', 20, 124)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('ACTUAL SPENT', 20 + colWidth, 108)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text(`INR ${category.realCost.toLocaleString('en-IN')}`, 20 + colWidth, 118)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Total Expenses', 20 + colWidth, 124)
  
  const variance = category.realCost - category.expectedCost
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('VARIANCE', 20 + colWidth * 2, 108)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(variance > 0 ? 239 : 34, variance > 0 ? 68 : 197, variance > 0 ? 68 : 94)
  doc.text(`${variance > 0 ? '+' : ''}INR ${Math.abs(variance).toLocaleString('en-IN')}`, 20 + colWidth * 2, 118)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(variance > 0 ? 'Over Budget' : 'Under Budget', 20 + colWidth * 2, 124)
  
  // Transaction Details Header
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('TRANSACTION DETAILS', 14, 143)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Total Transactions: ${expenses.length}`, pageWidth - 14, 143, { align: 'right' })
  
  // Expenses Table
  const tableData = expenses.map((expense, index) => [
    (index + 1).toString(),
    new Date(expense.date).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }),
    expense.title,
    expense.description || '-',
    `INR ${expense.amount.toLocaleString('en-IN')}`,
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
  
  // Footer
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
