import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getFinancialSummary, getExpenses, getIncomes } from '@/lib/database'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Simple chatbot logic - you can enhance this with AI/ML
    const lowerQuery = query.toLowerCase()
    let response = ''

    if (lowerQuery.includes('expense') || lowerQuery.includes('spending')) {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const summary = await getFinancialSummary(userId, currentYear, currentMonth)
      
      response = `This month you've spent ₹${summary.totalExpenses.toLocaleString()} across ${summary.expenseCount} transactions. Your top spending category is ${summary.topCategories[0]?.category || 'N/A'}.`
    } else if (lowerQuery.includes('income') || lowerQuery.includes('earning')) {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const summary = await getFinancialSummary(userId, currentYear, currentMonth)
      
      response = `This month you've earned ₹${summary.totalIncome.toLocaleString()} from ${summary.incomeCount} sources.`
    } else if (lowerQuery.includes('saving') || lowerQuery.includes('balance')) {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const summary = await getFinancialSummary(userId, currentYear, currentMonth)
      
      response = `Your current savings this month: ₹${summary.savings.toLocaleString()}. ${summary.savings >= 0 ? 'Great job staying within budget!' : 'You\'re over budget this month.'}`
    } else if (lowerQuery.includes('budget') || lowerQuery.includes('limit')) {
      response = 'I can help you track your spending against budgets. Try asking about your expenses or savings!'
    } else {
      response = 'I can help you with questions about your expenses, income, savings, and budget. Try asking "How much did I spend this month?" or "What are my savings?"'
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Chat query error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process query' },
      { status: 500 }
    )
  }
})
