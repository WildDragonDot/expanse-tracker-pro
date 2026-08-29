/**
 * Bank & UPI SMS Transaction Parser
 * Parses transaction SMS from HDFC, SBI, ICICI, Axis, Kotak, PNB, BoB, Paytm, PhonePe, GPay, CRED, etc.
 */

export interface ParsedTransactionSMS {
  raw: string
  isTransaction: boolean
  type: 'expense' | 'income'
  amount: number | null
  merchant: string | null
  bank: string
  paymentMode: string
  date: string
  referenceNumber: string | null
  accountLast4: string | null
  balance: number | null
}

export function parseBankSMS(smsText: string): ParsedTransactionSMS {
  const text = smsText.trim()
  const lower = text.toLowerCase()

  // Detect Type
  const isDebit =
    lower.includes('debited') ||
    lower.includes('spent') ||
    lower.includes('paid') ||
    lower.includes('withdrawn') ||
    lower.includes('deducted') ||
    lower.includes('sent to') ||
    lower.includes('txn of inr') ||
    lower.includes('txn of rs') ||
    lower.includes('purchase at')

  const isCredit =
    lower.includes('credited') ||
    lower.includes('received') ||
    lower.includes('deposited') ||
    lower.includes('refund') ||
    lower.includes('cashback')

  const isTransaction = isDebit || isCredit
  const type: 'expense' | 'income' = isCredit && !isDebit ? 'income' : 'expense'

  // Extract Amount (e.g. INR 500.00, Rs. 1,200, Rs 450, $45.00, ₹999)
  let amount: number | null = null
  const amountRegex =
    /(?:inr|rs\.?|rs|₹|\$)\s*([\d,]+(?:\.\d{1,2})?)|(?:amount of|for)\s*(?:inr|rs\.?|rs|₹|\$)?\s*([\d,]+(?:\.\d{1,2})?)/i
  const amountMatch = text.match(amountRegex)
  if (amountMatch) {
    const rawNum = (amountMatch[1] || amountMatch[2]).replace(/,/g, '')
    const parsed = parseFloat(rawNum)
    if (!isNaN(parsed) && parsed > 0) {
      amount = Math.round(parsed)
    }
  }

  // Extract Merchant / Recipient / Beneficiary
  let merchant: string | null = null
  const merchantPatterns = [
    /(?:at|to|vpa|info\/|towards|paid to)\s+([A-Za-z0-9\s&._-]+?)(?:\s+on|\s+ref|\s+upi|\s+avl|\s+bal|\s+via|\.|$)/i,
    /(?:transferred to)\s+([A-Za-z0-9\s&._-]+?)(?:\s+on|\.|$)/i,
    /(?:vpa\s+)([a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+)/i,
  ]

  for (const pattern of merchantPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      if (
        candidate.length > 2 &&
        !['your', 'account', 'card', 'bank', 'the', 'rs', 'inr'].includes(
          candidate.toLowerCase()
        )
      ) {
        merchant = candidate
        break
      }
    }
  }

  // Detect Bank Name
  let bank = 'Cash'
  if (lower.includes('hdfc')) bank = 'HDFC Bank'
  else if (lower.includes('sbi') || lower.includes('state bank')) bank = 'SBI'
  else if (lower.includes('icici')) bank = 'ICICI Bank'
  else if (lower.includes('axis')) bank = 'Axis Bank'
  else if (lower.includes('kotak')) bank = 'Kotak Bank'
  else if (lower.includes('paytm')) bank = 'Paytm Payments Bank'
  else if (lower.includes('pnb') || lower.includes('punjab national')) bank = 'PNB'
  else if (lower.includes('bob') || lower.includes('bank of baroda')) bank = 'Bank of Baroda'
  else if (lower.includes('canara')) bank = 'Canara Bank'
  else if (lower.includes('indusind')) bank = 'IndusInd Bank'
  else if (lower.includes('citi')) bank = 'Citibank'
  else if (lower.includes('amex') || lower.includes('american express')) bank = 'American Express'
  else if (lower.includes('bank')) bank = 'Bank Account'

  // Detect Payment Mode
  let paymentMode = 'UPI'
  if (lower.includes('upi') || lower.includes('vpa') || lower.includes('gpay') || lower.includes('phonepe')) {
    paymentMode = 'UPI'
  } else if (lower.includes('credit card') || lower.includes('cc ') || lower.includes('card ending')) {
    paymentMode = 'Debit / Credit Card'
  } else if (lower.includes('debit card') || lower.includes('atm') || lower.includes('pos')) {
    paymentMode = 'Debit / Credit Card'
  } else if (lower.includes('netbanking') || lower.includes('neft') || lower.includes('rtgs') || lower.includes('imps')) {
    paymentMode = 'Net Banking'
  } else if (lower.includes('wallet')) {
    paymentMode = 'Wallet'
  } else if (lower.includes('cash')) {
    paymentMode = 'Cash'
  }

  // Extract Account Last 4 Digits (e.g. A/c **1234 or Card ending 5678)
  let accountLast4: string | null = null
  const accMatch = text.match(/(?:a\/c|acct|acc|card|ending)\s*(?:no\.?|xx|\*+)?\s*(\d{4})/i)
  if (accMatch) {
    accountLast4 = accMatch[1]
  }

  // Extract Available Balance
  let balance: number | null = null
  const balMatch = text.match(/(?:avl bal|avail bal|bal|balance)\s*(?:is|:)?\s*(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i)
  if (balMatch) {
    const rawBal = balMatch[1].replace(/,/g, '')
    const parsedBal = parseFloat(rawBal)
    if (!isNaN(parsedBal)) balance = Math.round(parsedBal)
  }

  // Extract Ref/UTR Number
  let referenceNumber: string | null = null
  const refMatch = text.match(/(?:ref|utr|rrn|txn\s+id|reference)\s*(?:no\.?|:)?\s*([a-zA-Z0-9]+)/i)
  if (refMatch) {
    referenceNumber = refMatch[1]
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return {
    raw: text,
    isTransaction,
    type,
    amount,
    merchant: merchant ? merchant.slice(0, 50) : type === 'expense' ? 'Bank Transaction' : 'Salary / Income Deposit',
    bank,
    paymentMode,
    date: todayStr,
    referenceNumber,
    accountLast4,
    balance,
  }
}

export function parseBatchBankSMS(smsBatch: string[]): ParsedTransactionSMS[] {
  return smsBatch.map(parseBankSMS).filter((res) => res.isTransaction && res.amount !== null)
}
