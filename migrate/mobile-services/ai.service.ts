/**
 * Client-Side Direct Gemini AI & Smart Insights Service (₹0 Cost)
 * Offline-First & Serverless
 */

declare const process: any

export class GeminiAIService {
  private static getApiKey(): string {
    if (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_GEMINI_API_KEY) {
      return process.env.EXPO_PUBLIC_GEMINI_API_KEY
    }
    return ''
  }

  private static readonly MODEL = 'gemini-2.5-flash'

  /**
   * Generate Financial Insights directly from Gemini AI with offline heuristic fallback
   */
  public static async generateFinancialAdvice(prompt: string, contextData?: any): Promise<string> {
    const apiKey = this.getApiKey()

    // 1. If API Key is configured, use Google Gemini Flash AI
    if (apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL}:generateContent?key=${apiKey}`

        const payload = {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are a certified financial advisor inside an Expense Tracker mobile app.
Context Data: ${JSON.stringify(contextData || {})}
User Query: ${prompt}
Provide concise, practical, and highly actionable financial advice in 2-3 short bullet points.`,
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

        if (res.ok) {
          const data = await res.json()
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (reply) return reply
        }
      } catch (err) {
        console.warn('Gemini API call failed, using built-in financial heuristics:', err)
      }
    }

    // 2. Intelligent Built-in Financial Heuristic Engine (Offline / Zero-Config)
    return this.generateHeuristicAdvice(prompt, contextData)
  }

  /**
   * High-Precision Rule-Based Financial Advisor (100% Offline & Free)
   */
  private static generateHeuristicAdvice(prompt: string, context?: any): string {
    const q = (prompt || '').toLowerCase()
    const totalIncome = context?.totalIncome || context?.income || 0
    const totalExpenses = context?.totalExpenses || context?.expenses || 0
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0

    if (q.includes('save') || q.includes('budget') || q.includes('invest')) {
      if (savingsRate > 20) {
        return `🌟 **Excellent Financial Health!**\n• Your current savings rate is **${savingsRate}%** (above the 20% benchmark).\n• Consider allocating 50% of your surplus into emergency funds and index SIPs.`
      } else if (savingsRate > 0) {
        return `💡 **Budget Optimization Tip:**\n• You are saving **${savingsRate}%** of your monthly income.\n• Aim to reach 20% by cutting 10% from discretionary categories like dining or subscriptions.`
      } else {
        return `⚠️ **Cash Flow Alert:**\n• Your monthly expenses currently exceed income.\n• Review recurring bills and establish hard budget limits on non-essential categories to stop cash drain.`
      }
    }

    if (q.includes('bill') || q.includes('subscription') || q.includes('recurring')) {
      return `📅 **Bill Management Strategy:**\n• Audit active subscriptions and cancel unused OTT/memberships.\n• Keep auto-debit enabled for essential utilities to prevent late payment penalties.`
    }

    if (q.includes('score') || q.includes('health') || q.includes('analysis')) {
      return `📊 **Financial Score Breakdown:**\n• Track daily micro-expenses for 90%+ budgeting accuracy.\n• Maintain at least 3 months of emergency expenses in a liquid bank account.`
    }

    return `✨ **Smart Financial Guidance:**\n• Maintain the 50-30-20 rule: 50% Needs, 30% Wants, and 20% Savings.\n• Set category-wise monthly limits in the Budget tab to keep daily spending disciplined.`
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
