/**
 * Client-Side Direct Gemini AI & Smart Insights Service (₹0 Cost)
 */

export class GeminiAIService {
  private static readonly API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''
  private static readonly MODEL = 'gemini-2.5-flash'

  /**
   * Generate Financial Insights directly from Gemini AI without needing an intermediate server
   */
  public static async generateFinancialAdvice(prompt: string, contextData?: any): Promise<string> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL}:generateContent?key=${this.API_KEY}`

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a smart financial advisor inside an Expense Tracker mobile app.
Context Data: ${JSON.stringify(contextData || {})}
User Query: ${prompt}
Provide practical, friendly, and actionable advice (concise and easy to read).`,
              },
            ],
          },
        ],
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`Gemini API returned status ${res.status}`)
      }

      const data = await res.json()
      return (
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'I am analyzing your expenses. Try reducing recurring discretionary spending to save 15% more this month!'
      )
    } catch (err: any) {
      console.warn('Gemini AI fallback:', err)
      return 'Great job tracking your expenses! Keep setting monthly category budgets to stay on track.'
    }
  }

  /**
   * Parse transactional SMS on-device / with AI
   */
  public static parseBankSMS(smsText: string): {
    amount?: number
    type?: 'DEBIT' | 'CREDIT'
    bank?: string
    merchant?: string
  } {
    const text = smsText.toLowerCase()
    const amountMatch = smsText.match(/(?:rs\.?|inr)\s*([\d,]+(?:\.\d{2})?)/i)
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined

    let type: 'DEBIT' | 'CREDIT' = 'DEBIT'
    if (text.includes('credited') || text.includes('received') || text.includes('refund')) {
      type = 'CREDIT'
    }

    let bank = 'Bank'
    if (text.includes('hdfc')) bank = 'HDFC Bank'
    else if (text.includes('sbi')) bank = 'SBI'
    else if (text.includes('icici')) bank = 'ICICI Bank'
    else if (text.includes('axis')) bank = 'Axis Bank'
    else if (text.includes('kotak')) bank = 'Kotak Bank'
    else if (text.includes('paytm')) bank = 'Paytm'

    return { amount, type, bank }
  }
}
