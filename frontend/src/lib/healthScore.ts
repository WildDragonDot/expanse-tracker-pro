// Improved Financial Health Score Calculation
export function calculateFinancialHealthScore(
  expenses: any[] = [], 
  incomes: any[] = []
): number {
  const safeIncomes = Array.isArray(incomes) ? incomes : []
  const safeExpenses = Array.isArray(expenses) ? expenses : []

  const totalIncome = safeIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const totalExpenses = safeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  
  // If no data, return baseline score
  if (totalIncome === 0 && totalExpenses === 0) return 50
  if (totalIncome === 0 && totalExpenses > 0) return 15 // Only expenses, no income - critical
  
  let score = 0
  
  // 1. SAVINGS RATE SCORE (0-45 points) - Most Important
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0
  if (savingsRate >= 0.5) score += 45        // Exceptional: 50%+ savings
  else if (savingsRate >= 0.3) score += 40   // Excellent: 30-49% savings
  else if (savingsRate >= 0.2) score += 32   // Very Good: 20-29% savings  
  else if (savingsRate >= 0.1) score += 22   // Good: 10-19% savings
  else if (savingsRate >= 0.05) score += 12  // Fair: 5-9% savings
  else if (savingsRate >= 0) score += 5      // Poor: 0-4% savings
  else if (savingsRate >= -0.1) score += 0   // Overspending up to 10%
  else score -= 5                            // Severe overspending (penalty)
  
  // 2. INCOME STABILITY SCORE (0-20 points)
  const incomeCount = safeIncomes.length
  if (incomeCount >= 12) score += 20         // Monthly income for a year
  else if (incomeCount >= 6) score += 16     // Regular income (6+ months)
  else if (incomeCount >= 3) score += 10     // Some income records
  else if (incomeCount >= 1) score += 5      // At least one income
  else score += 0                            // No income records
  
  // 3. EXPENSE TRACKING CONSISTENCY (0-15 points)
  const expenseCount = safeExpenses.length
  if (expenseCount >= 50) score += 15        // Very active tracking
  else if (expenseCount >= 30) score += 12   // Good tracking
  else if (expenseCount >= 15) score += 8    // Regular tracking
  else if (expenseCount >= 5) score += 4     // Basic tracking
  else score += 0                            // Minimal tracking
  
  // 4. DYNAMIC BUDGET ADHERENCE (0-15 points)
  const categorySpending: Record<string, number> = {}
  safeExpenses.forEach(e => {
    const cat = e.category || 'General'
    categorySpending[cat] = (categorySpending[cat] || 0) + (Number(e.amount) || 0)
  })
  
  const recommendedCategoryBudget = totalIncome > 0 ? totalIncome * 0.3 : 1
  let budgetScore = 0
  let categoriesChecked = 0
  
  Object.entries(categorySpending).forEach(([category, spent]) => {
    if (['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education'].includes(category)) {
      categoriesChecked++
      const ratio = spent / recommendedCategoryBudget
      
      if (ratio <= 0.7) budgetScore += 3      // Well under budget
      else if (ratio <= 1.0) budgetScore += 2 // Within budget
      else if (ratio <= 1.2) budgetScore += 1 // Slightly over
      else budgetScore -= 1                   // Over budget (penalty)
    }
  })
  
  if (categoriesChecked > 0) {
    score += Math.min(15, Math.max(0, budgetScore))
  }
  
  // 5. SPENDING DIVERSITY & BALANCE (0-10 points)
  const uniqueCategories = new Set(safeExpenses.map(e => e.category || 'General')).size
  const totalCategoriesScore = Math.min(5, uniqueCategories)
  
  const spendingValues = Object.values(categorySpending)
  const maxCategorySpending = spendingValues.length > 0 ? Math.max(...spendingValues) : 0
  const spendingBalance = totalExpenses > 0 ? maxCategorySpending / totalExpenses : 0
  let balanceScore = 0
  
  if (spendingBalance <= 0.3) balanceScore = 5      // Well balanced
  else if (spendingBalance <= 0.4) balanceScore = 4 // Good balance
  else if (spendingBalance <= 0.5) balanceScore = 3 // Acceptable
  else if (spendingBalance <= 0.6) balanceScore = 2 // Slightly unbalanced
  else balanceScore = 1                             // Too concentrated
  
  score += totalCategoriesScore + balanceScore
  
  // 6. BONUS: Emergency Fund Indicator (0-5 points)
  if (savingsRate > 0 && incomeCount >= 3 && totalExpenses > 0) {
    const avgMonthlySavings = (totalIncome - totalExpenses) / Math.max(1, incomeCount)
    const avgMonthlyExpenses = totalExpenses / Math.max(1, expenseCount)
    const emergencyFundMonths = avgMonthlyExpenses > 0 ? avgMonthlySavings / avgMonthlyExpenses : 0
    
    if (emergencyFundMonths >= 6) score += 5
    else if (emergencyFundMonths >= 3) score += 3
    else if (emergencyFundMonths >= 1) score += 1
  }
  
  // Final score: 0-100 range
  return Math.min(100, Math.max(0, Math.round(score)))
  return Math.min(100, Math.max(0, Math.round(score)))
}

// Get health score status text and color
export function getHealthScoreStatus(score: number): {
  text: string
  colorClass: string
  bgClass: string
  badgeClass: string
  metricClass: string
} {
  if (score >= 80) {
    return {
      text: 'Excellent',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-green-600',
      badgeClass: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-transparent dark:to-transparent dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-500/50',
      metricClass: 'text-gradient-success'
    }
  } else if (score >= 70) {
    return {
      text: 'Very Good',
      colorClass: 'text-violet-600 dark:text-violet-400',
      bgClass: 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600',
      badgeClass: 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-transparent dark:to-transparent dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200/50 dark:border-violet-500/50',
      metricClass: 'text-gradient-primary'
    }
  } else if (score >= 50) {
    return {
      text: 'Good',
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-600',
      badgeClass: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-transparent dark:to-transparent dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-500/50',
      metricClass: 'text-gradient-info'
    }
  } else if (score >= 30) {
    return {
      text: 'Fair',
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600',
      badgeClass: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-transparent dark:to-transparent dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-500/50',
      metricClass: 'text-gradient-warning'
    }
  } else {
    return {
      text: 'Needs Attention',
      colorClass: 'text-red-600 dark:text-red-400',
      bgClass: 'bg-gradient-to-br from-red-500 via-rose-600 to-pink-600',
      badgeClass: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-transparent dark:to-transparent dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-500/50',
      metricClass: 'text-gradient-danger'
    }
  }
}