declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf'

  export interface UserOptions {
    startY?: number
    head?: any[][]
    body?: any[][]
    theme?: 'striped' | 'grid' | 'plain'
    headStyles?: any
    bodyStyles?: any
    columnStyles?: any
    alternateRowStyles?: any
    margin?: any
    [key: string]: any
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void
}
