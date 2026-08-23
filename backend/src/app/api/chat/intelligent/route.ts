import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getFinancialSummary, getExpenses, getIncomes } from '@/lib/database'
import { prisma } from '@/lib/database'
import { GeminiService } from '@/lib/gemini'

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

    // Get user's comprehensive financial data
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    
    // Fetch ALL relevant data for complete context
    const [
      summary, 
      expenses, 
      incomes, 
      udhars, 
      subscriptions, 
      planningCategories, 
      expensePlans, 
      shoppingCategories, 
      shoppingItems,
      user
    ] = await Promise.all([
      getFinancialSummary(userId, currentYear, currentMonth),
      getExpenses(userId, { limit: 500 }), // Increased limit for better context
      getIncomes(userId, { limit: 100 }),
      prisma.udhar.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.subscription.findMany({ where: { userId, active: true } }),
      prisma.planningCategory.findMany({ where: { userId, isActive: true }, include: { expenses: true } }),
      prisma.expensePlanning.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 50 }),
      prisma.shoppingCategory.findMany({ where: { userId, isActive: true }, include: { items: true } }),
      prisma.shoppingItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, salary: true, currency: true } })
    ])

    // Calculate comprehensive insights
    const categoryBreakdown = expenses.reduce((acc: any, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {})

    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)

    const avgExpensePerDay = summary.totalExpenses / new Date().getDate()
    const savingsRate = summary.totalIncome > 0 ? (summary.savings / summary.totalIncome) * 100 : 0

    // Calculate historical trends (last 6 months in parallel)
    const monthOffsets = [5, 4, 3, 2, 1, 0]
    const monthlyTrends = await Promise.all(
      monthOffsets.map(async (offset) => {
        const date = new Date(currentYear, currentMonth - 1 - offset, 1)
        const monthSummary = await getFinancialSummary(userId, date.getFullYear(), date.getMonth() + 1)
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          expenses: monthSummary.totalExpenses,
          income: monthSummary.totalIncome,
          savings: monthSummary.savings
        }
      })
    )

    // Udhar summary
    const udharGiven = udhars.filter(u => u.direction === 'given').reduce((sum, u) => sum + u.remaining, 0)
    const udharTaken = udhars.filter(u => u.direction === 'taken').reduce((sum, u) => sum + u.remaining, 0)

    // Shopping summary
    const shoppingExpected = shoppingCategories.reduce((sum, cat) => sum + cat.expectedCost, 0)
    const shoppingReal = shoppingCategories.reduce((sum, cat) => sum + cat.realCost, 0)
    const shoppingItemsTotal = shoppingItems.length
    const shoppingItemsBought = shoppingItems.filter(i => i.isBought).length

    // Planning summary
    const planningExpected = planningCategories.reduce((sum, cat) => sum + cat.expectedCost, 0)
    const planningReal = planningCategories.reduce((sum, cat) => sum + cat.realCost, 0)
    const plansTotal = expensePlans.length
    const plansCompleted = expensePlans.filter(p => p.isCompleted).length

    // Prepare comprehensive context for OpenAI
    const financialContext = {
      user: {
        name: user?.name,
        salary: user?.salary,
        currency: user?.currency || 'INR'
      },
      currentMonth: {
        totalExpenses: summary.totalExpenses,
        totalIncome: summary.totalIncome,
        savings: summary.savings,
        savingsRate: Math.round(savingsRate),
        expenseCount: summary.expenseCount,
        incomeCount: summary.incomeCount,
        avgExpensePerDay: Math.round(avgExpensePerDay)
      },
      categories: {
        top: topCategories.map(([cat, amt]) => ({ category: cat, amount: amt })),
        all: Object.keys(categoryBreakdown)
      },
      recentExpenses: expenses.slice(0, 10).map(e => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: new Date(e.date).toLocaleDateString(),
        bank: e.bank,
        paymentMode: e.paymentMode
      })),
      recentIncomes: incomes.slice(0, 5).map(i => ({
        source: i.source,
        amount: i.amount,
        date: new Date(i.date).toLocaleDateString()
      })),
      subscriptions: subscriptions.map(s => ({
        name: s.name,
        amount: s.amount,
        interval: s.interval,
        nextDue: new Date(s.nextDueDate).toLocaleDateString()
      })),
      udhar: {
        given: udharGiven,
        taken: udharTaken,
        netPosition: udharGiven - udharTaken,
        count: udhars.length
      },
      shopping: {
        categories: shoppingCategories.length,
        totalItems: shoppingItemsTotal,
        itemsBought: shoppingItemsBought,
        expectedCost: shoppingExpected,
        realCost: shoppingReal,
        variance: shoppingReal - shoppingExpected
      },
      planning: {
        categories: planningCategories.length,
        totalPlans: plansTotal,
        completed: plansCompleted,
        expectedCost: planningExpected,
        realCost: planningReal,
        variance: planningReal - planningExpected
      },
      trends: monthlyTrends
    }

    const systemPrompt = `You are an expert financial assistant for ${financialContext.user.name}'s personal finance app. You have access to their COMPLETE financial data and can answer ANY question with 100% accuracy.

USER PROFILE:
- Name: ${financialContext.user.name}
- Monthly Salary: ₹${financialContext.user.salary?.toLocaleString() || 'Not set'}
- Currency: ${financialContext.user.currency}

CURRENT MONTH SUMMARY:
- Total Expenses: ₹${financialContext.currentMonth.totalExpenses.toLocaleString()}
- Total Income: ₹${financialContext.currentMonth.totalIncome.toLocaleString()}
- Savings: ₹${financialContext.currentMonth.savings.toLocaleString()}
- Savings Rate: ${financialContext.currentMonth.savingsRate}%
- Number of Expenses: ${financialContext.currentMonth.expenseCount}
- Number of Incomes: ${financialContext.currentMonth.incomeCount}
- Average Daily Spending: ₹${financialContext.currentMonth.avgExpensePerDay.toLocaleString()}

TOP SPENDING CATEGORIES:
${financialContext.categories.top.map((cat: any) => `- ${cat.category}: ₹${cat.amount.toLocaleString()}`).join('\n')}

RECENT EXPENSES (Last 10):
${financialContext.recentExpenses.map((exp: any) => `- ${exp.date}: ${exp.title} - ₹${exp.amount.toLocaleString()} (${exp.category}, ${exp.bank}, ${exp.paymentMode})`).join('\n')}

RECENT INCOMES:
${financialContext.recentIncomes.map((inc: any) => `- ${inc.date}: ${inc.source} - ₹${inc.amount.toLocaleString()}`).join('\n')}

ACTIVE SUBSCRIPTIONS:
${financialContext.subscriptions.length > 0 ? financialContext.subscriptions.map((sub: any) => `- ${sub.name}: ₹${sub.amount}/${sub.interval} (Next due: ${sub.nextDue})`).join('\n') : '- No active subscriptions'}

UDHAR (LOANS):
- Money Given (Pending): ₹${financialContext.udhar.given.toLocaleString()}
- Money Taken (Pending): ₹${financialContext.udhar.taken.toLocaleString()}
- Net Position: ₹${financialContext.udhar.netPosition.toLocaleString()} ${financialContext.udhar.netPosition >= 0 ? '(You are owed)' : '(You owe)'}
- Total Loan Records: ${financialContext.udhar.count}

SHOPPING LISTS:
- Active Categories: ${financialContext.shopping.categories}
- Total Items: ${financialContext.shopping.totalItems}
- Items Bought: ${financialContext.shopping.itemsBought}
- Expected Cost: ₹${financialContext.shopping.expectedCost.toLocaleString()}
- Actual Cost: ₹${financialContext.shopping.realCost.toLocaleString()}
- Variance: ₹${financialContext.shopping.variance.toLocaleString()} ${financialContext.shopping.variance > 0 ? '(Over budget)' : '(Under budget)'}

EXPENSE PLANNING:
- Planning Categories: ${financialContext.planning.categories}
- Total Plans: ${financialContext.planning.totalPlans}
- Completed Plans: ${financialContext.planning.completed}
- Expected Cost: ₹${financialContext.planning.expectedCost.toLocaleString()}
- Actual Cost: ₹${financialContext.planning.realCost.toLocaleString()}
- Variance: ₹${financialContext.planning.variance.toLocaleString()} ${financialContext.planning.variance > 0 ? '(Over budget)' : '(Under budget)'}

6-MONTH TREND:
${financialContext.trends.map((t: any) => `- ${t.month}: Income ₹${t.income.toLocaleString()}, Expenses ₹${t.expenses.toLocaleString()}, Savings ₹${t.savings.toLocaleString()}`).join('\n')}

INSTRUCTIONS:
1. Answer ALL questions with EXACT data from above
2. Be conversational, friendly, concise, and encouraging
3. Use Indian Rupee (₹) format consistently
4. Provide actionable insights and personalized advice
5. If asked about trends, compare current month with previous months
6. If asked about specific categories, banks, or dates, use the detailed expense data
7. For shopping and planning queries, use the respective data sections
8. Always be accurate - never make up numbers
9. If data is not available, clearly state that
10. Suggest ways to improve financial health based on actual patterns`

    // 1. Primary: Gemini AI with Multi-Key Rotation & Auto-Fallback
    const geminiResult = await GeminiService.generateFinancialAdvice(systemPrompt, query)
    if (geminiResult) {
      return NextResponse.json({
        response: geminiResult.response,
        timestamp: new Date().toISOString(),
        source: 'gemini',
        model: geminiResult.modelUsed,
        keyIndex: geminiResult.keyIndexUsed,
      })
    }

    // 2. Secondary: OpenAI (if configured)
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query }
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        })

        if (openaiResponse.ok) {
          const data = await openaiResponse.json()
          const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response right now.'
          
          return NextResponse.json({
            response: aiResponse,
            timestamp: new Date().toISOString(),
            source: 'openai'
          })
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError)
      }
    }

    // Fallback to enhanced rule-based responses with real data
    const lowerQuery = query.toLowerCase()
    let response = ''

    if (lowerQuery.includes('spend') || lowerQuery.includes('expense')) {
      if (lowerQuery.includes('month')) {
        response = `This month you've spent ₹${summary.totalExpenses.toLocaleString()} across ${summary.expenseCount} transactions. Your average daily spending is ₹${Math.round(avgExpensePerDay).toLocaleString()}.`
      } else if (lowerQuery.includes('category') || lowerQuery.includes('categories')) {
        const topCatsText = topCategories.slice(0, 3).map(([cat, amt]) => `${cat}: ₹${(amt as number).toLocaleString()}`).join(', ')
        response = `Your top spending categories are: ${topCatsText}. Would you like to see a detailed breakdown?`
      } else {
        response = `Your total spending this month is ₹${summary.totalExpenses.toLocaleString()}. ${summary.expenseCount > 0 ? `Your largest expense category is ${topCategories[0]?.[0]} with ₹${(topCategories[0]?.[1] as number)?.toLocaleString()}.` : ''}`
      }
    } else if (lowerQuery.includes('income') || lowerQuery.includes('earn')) {
      response = `Your total income this month is ₹${summary.totalIncome.toLocaleString()} from ${summary.incomeCount} sources. ${summary.totalIncome > 0 ? `That's an average of ₹${Math.round(summary.totalIncome / Math.max(summary.incomeCount, 1)).toLocaleString()} per income source.` : ''}`
    } else if (lowerQuery.includes('saving') || lowerQuery.includes('save')) {
      const savingsStatus = summary.savings >= 0 ? 'saving' : 'overspending by'
      response = `You're ${savingsStatus} ₹${Math.abs(summary.savings).toLocaleString()} this month. Your savings rate is ${Math.round(savingsRate)}%. ${savingsRate >= 20 ? 'Excellent job!' : savingsRate >= 10 ? 'Good progress, try to save a bit more.' : 'Consider reducing expenses to improve your savings.'}`
    } else if (lowerQuery.includes('budget') || lowerQuery.includes('limit')) {
      response = `Based on your current spending of ₹${summary.totalExpenses.toLocaleString()}, you're spending about ₹${Math.round(avgExpensePerDay).toLocaleString()} per day. ${avgExpensePerDay > 1000 ? 'Consider setting daily spending limits to control expenses.' : 'Your daily spending looks reasonable.'}`
    } else if (lowerQuery.includes('advice') || lowerQuery.includes('tip') || lowerQuery.includes('help')) {
      if (savingsRate < 10) {
        response = `Here are some tips to improve your finances: 1) Your top expense is ${topCategories[0]?.[0]} (₹${(topCategories[0]?.[1] as number)?.toLocaleString()}), try to reduce it by 10%. 2) Set a daily spending limit of ₹${Math.round(avgExpensePerDay * 0.9).toLocaleString()}. 3) Track small expenses - they add up quickly!`
      } else {
        response = `You're doing well with a ${Math.round(savingsRate)}% savings rate! To optimize further: 1) Continue monitoring your ${topCategories[0]?.[0]} expenses. 2) Consider investing your savings of ₹${summary.savings.toLocaleString()}. 3) Set up automatic savings to maintain this good habit.`
      }
    } else {
      response = `I can help you analyze your spending patterns, savings, income, and provide financial advice. Try asking: "How much did I spend this month?", "What's my savings rate?", or "Give me financial advice based on my data."`
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      source: 'rule-based',
      context: financialContext
    })
  } catch (error: any) {
    console.error('Chat query error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process query' },
      { status: 500 }
    )
  }
})