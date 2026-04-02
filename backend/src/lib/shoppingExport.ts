import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function exportShoppingCategoryToPDF(category: any, items: any[], userEmail?: string) {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header
  doc.setFillColor(16, 185, 129) // Green header for shopping
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('SHOPPING BILL', 14, 16)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Shopping List Management System', 14, 23)
  
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
  doc.text(`Bill ID: ${category.id.substring(0, 8).toUpperCase()}`, pageWidth - 14, 23, { align: 'right' })
  
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
  doc.rect(14, 50, pageWidth - 28, 35, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(14, 50, pageWidth - 28, 35, 'S')
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(category.name, 20, 60)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Shopping Category`, 20, 68)
  
  const status = category.isActive ? 'ACTIVE' : 'INACTIVE'
  const statusColor = category.isActive ? [34, 197, 94] : [239, 68, 68]
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.roundedRect(20, 72, 20, 6, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(status, 30, 76, { align: 'center' })
  
  // Financial Summary Box
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(200, 200, 200)
  doc.rect(14, 92, pageWidth - 28, 32, 'FD')
  
  const colWidth = (pageWidth - 28) / 3
  
  // Expected Cost
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('EXPECTED COST', 20, 100)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246)
  doc.text(`INR ${category.expectedCost.toLocaleString('en-IN')}`, 20, 110)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Estimated Amount', 20, 116)
  
  // Real Cost
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('ACTUAL COST', 20 + colWidth, 100)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text(`INR ${category.realCost.toLocaleString('en-IN')}`, 20 + colWidth, 110)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Total Spent', 20 + colWidth, 116)
  
  // Variance
  const variance = category.realCost - category.expectedCost
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('DIFFERENCE', 20 + colWidth * 2, 100)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(variance > 0 ? 239 : 34, variance > 0 ? 68 : 197, variance > 0 ? 68 : 94)
  doc.text(`${variance > 0 ? '+' : ''}INR ${Math.abs(variance).toLocaleString('en-IN')}`, 20 + colWidth * 2, 110)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(variance > 0 ? 'Over Budget' : 'Saved', 20 + colWidth * 2, 116)
  
  // Items Header
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('SHOPPING ITEMS', 14, 135)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Total Items: ${items.length}`, pageWidth - 14, 135, { align: 'right' })
  
  // Items Table
  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.name,
    `${item.quantity} ${item.unit}`,
    item.notes || '-',
    `INR ${item.expectedPrice.toLocaleString('en-IN')}`,
    item.actualPrice ? `INR ${item.actualPrice.toLocaleString('en-IN')}` : '-',
    item.isBought ? 'Yes' : 'No'
  ])
  
    autoTable(doc as any, {
      startY: 142,
      head: [['#', 'Item Name', 'Qty', 'Notes', 'Expected', 'Actual', 'Bought']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [16, 185, 129],
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
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 15, halign: 'center' }
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
    doc.text('This is a computer-generated shopping bill.', pageWidth / 2, finalY + 18, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, finalY + 24, { align: 'center' })
  }
  
    // Save
    const fileName = `${category.name.replace(/[^a-z0-9]/gi, '_')}_Shopping_Bill_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  } catch (error) {
    console.error('PDF Export Error:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}

export function exportShoppingCategoryToExcel(category: any, items: any[]) {
  let csv = `Shopping Category: ${category.name}\n`
  csv += `Expected Cost: ₹${category.expectedCost.toLocaleString()}\n`
  csv += `Actual Cost: ₹${category.realCost.toLocaleString()}\n`
  csv += `Difference: ₹${(category.realCost - category.expectedCost).toLocaleString()}\n\n`
  
  csv += 'Item Name,Quantity,Unit,Expected Price,Actual Price,Bought,Notes\n'
  
  items.forEach(item => {
    csv += `"${item.name}",`
    csv += `${item.quantity},`
    csv += `${item.unit},`
    csv += `${item.expectedPrice},`
    csv += `${item.actualPrice || ''},`
    csv += `${item.isBought ? 'Yes' : 'No'},`
    csv += `"${item.notes || ''}"\n`
  })
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${category.name}_shopping_bill.csv`
  link.click()
}

export async function sendShoppingCategoryEmail(category: any, items: any[], userEmail: string) {
  try {
    const doc = await generateShoppingPDF(category, items, userEmail)
    const pdfBlob = doc.output('blob')
    
    const reader = new FileReader()
    const pdfBase64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(pdfBlob)
    })
    
    const response = await fetch('/api/shopping-export/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        category,
        items,
        userEmail,
        pdfAttachment: pdfBase64,
        pdfFilename: `${category.name.replace(/[^a-z0-9]/gi, '_')}_Shopping_Bill_${new Date().toISOString().split('T')[0]}.pdf`
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

async function generateShoppingPDF(category: any, items: any[], userEmail?: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('SHOPPING BILL', 14, 16)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Shopping List Management System', 14, 23)
  
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
  doc.text(`Bill ID: ${category.id.substring(0, 8).toUpperCase()}`, pageWidth - 14, 23, { align: 'right' })
  
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  })
  doc.setFontSize(8)
  doc.text(`${currentTime}`, pageWidth - 14, 30, { align: 'right' })
  
  doc.setTextColor(0, 0, 0)
  
  doc.setFillColor(245, 247, 250)
  doc.rect(14, 50, pageWidth - 28, 35, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(14, 50, pageWidth - 28, 35, 'S')
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(category.name, 20, 60)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Shopping Category`, 20, 68)
  
  const status = category.isActive ? 'ACTIVE' : 'INACTIVE'
  const statusColor = category.isActive ? [34, 197, 94] : [239, 68, 68]
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.roundedRect(20, 72, 20, 6, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(status, 30, 76, { align: 'center' })
  
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(200, 200, 200)
  doc.rect(14, 92, pageWidth - 28, 32, 'FD')
  
  const colWidth = (pageWidth - 28) / 3
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('EXPECTED COST', 20, 100)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246)
  doc.text(`INR ${category.expectedCost.toLocaleString('en-IN')}`, 20, 110)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Estimated Amount', 20, 116)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('ACTUAL COST', 20 + colWidth, 100)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text(`INR ${category.realCost.toLocaleString('en-IN')}`, 20 + colWidth, 110)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Total Spent', 20 + colWidth, 116)
  
  const variance = category.realCost - category.expectedCost
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('DIFFERENCE', 20 + colWidth * 2, 100)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(variance > 0 ? 239 : 34, variance > 0 ? 68 : 197, variance > 0 ? 68 : 94)
  doc.text(`${variance > 0 ? '+' : ''}INR ${Math.abs(variance).toLocaleString('en-IN')}`, 20 + colWidth * 2, 110)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(variance > 0 ? 'Over Budget' : 'Saved', 20 + colWidth * 2, 116)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('SHOPPING ITEMS', 14, 135)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Total Items: ${items.length}`, pageWidth - 14, 135, { align: 'right' })
  
  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.name,
    `${item.quantity} ${item.unit}`,
    item.notes || '-',
    `INR ${item.expectedPrice.toLocaleString('en-IN')}`,
    item.actualPrice ? `INR ${item.actualPrice.toLocaleString('en-IN')}` : '-',
    item.isBought ? 'Yes' : 'No'
  ])
  
  autoTable(doc as any, {
    startY: 142,
    head: [['#', 'Item Name', 'Qty', 'Notes', 'Expected', 'Actual', 'Bought']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [16, 185, 129],
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
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 15, halign: 'center' }
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
    doc.text('This is a computer-generated shopping bill.', pageWidth / 2, finalY + 18, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, finalY + 24, { align: 'center' })
  }
  
  return doc
}
