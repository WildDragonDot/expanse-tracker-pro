import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ArrowUp,
  ArrowDown,
  Lightbulb,
  Info,
  ChevronRight,
  TrendingUp,
  Tag,
  Clock,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { CardSkeleton } from '../components/SkeletonLoader'
import { TransactionDetailsModal, TransactionItem } from '../components/TransactionDetailsModal'
import { CategoryDetailsModal, CategoryDetailsItem } from '../components/CategoryDetailsModal'
import { api } from '../services/api'

export const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modals
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryDetailsItem | null>(null)

  const [summary, setSummary] = useState({
    currentBalance: 4700,
    monthlyIncome: 15100,
    incomeGrowth: '+12.5%',
    monthlyExpense: 10400,
    expenseGrowth: '-8.3%',
    healthScore: 70,
    healthStatus: 'Healthy financial status',
    recentTransactions: [
      { id: '1', title: 'Monthly Salary', amount: 15100, type: 'income' as const, date: '2026-08-01', category: 'Salary', bank: 'HDFC Bank', paymentMode: 'Salary Credit', notes: 'Monthly corporate payout' },
      { id: '2', title: 'House Rent', amount: 4500, type: 'expense' as const, date: '2026-08-05', category: 'Rent', bank: 'HDFC Bank', paymentMode: 'NetBanking', notes: 'Apartment monthly lease' },
      { id: '3', title: 'Whole Foods Grocery', amount: 3200, type: 'expense' as const, date: '2026-08-12', category: 'Food', bank: 'ICICI Bank', paymentMode: 'UPI', notes: 'Organic basket' },
      { id: '4', title: 'Netflix & Broadband', amount: 1199, type: 'expense' as const, date: '2026-08-18', category: 'Utilities', bank: 'SBI', paymentMode: 'Credit Card', notes: '4K auto renewal' },
    ],
  })

  const [categories] = useState<CategoryDetailsItem[]>([
    { name: 'Housing & Rent', spent: 4500, budget: 6000, percentage: 75, color: '#8B5CF6' },
    { name: 'Food & Groceries', spent: 3200, budget: 5000, percentage: 64, color: '#10B981' },
    { name: 'Bills & Utilities', spent: 1199, budget: 2000, percentage: 60, color: '#06B6D4' },
    { name: 'Travel & Commute', spent: 900, budget: 1500, percentage: 60, color: '#F59E0B' },
  ])

  const loadData = async () => {
    try {
      const dashSummary = await api.getDashboardSummary().catch(() => null)
      if (dashSummary) {
        setSummary((prev) => ({
          ...prev,
          currentBalance: dashSummary.totalBalance || prev.currentBalance,
          monthlyIncome: dashSummary.monthlyIncome || prev.monthlyIncome,
          monthlyExpense: dashSummary.monthlyExpense || prev.monthlyExpense,
        }))
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Dashboard" onProfilePress={() => navigation.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* 1. Current Balance Card (Exact image 1 style) */}
            <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.greenPill}>
                  <View style={styles.glowingDot} />
                  <Text style={styles.greenPillText}>Current Balance</Text>
                </View>
              </View>

              <Text style={[styles.cardSubText, { color: colors.textSecondary }]}>
                Available funds for your spending and investments.
              </Text>

              <View style={styles.statusBulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.statusBulletText}>{summary.healthStatus}</Text>
              </View>

              <View style={styles.balanceCenter}>
                <Text style={styles.balanceAmountCyan}>
                  {currencySymbol}{summary.currentBalance.toLocaleString()}
                </Text>
                <Text style={styles.availableFundsGreen}>Available Funds ↑</Text>
              </View>
            </View>

            {/* 2 & 3. Income & Expenses 2-Card Row */}
            <View style={styles.twoCardsRow}>
              {/* Income Card */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Expenses', { openModal: 'income' })}
                style={[styles.halfCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
              >
                <View style={styles.incomeHeader}>
                  <View style={styles.incomeIconBox}>
                    <ArrowUp color="#10B981" size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.pillIncome}>
                    <Text style={styles.pillIncomeText}>Income</Text>
                    <Info color="rgba(16, 185, 129, 0.7)" size={10} />
                  </View>
                </View>

                <Text style={styles.incomeAmount}>
                  {currencySymbol}{summary.monthlyIncome.toLocaleString()}
                </Text>

                <Text style={[styles.growthTextGreen, { color: colors.textSecondary }]}>
                  This month • <Text style={{ color: '#10B981', fontWeight: '800' }}>{summary.incomeGrowth}</Text>
                </Text>
              </TouchableOpacity>

              {/* Expenses Card */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Expenses', { openModal: 'expense' })}
                style={[styles.halfCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
              >
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseIconBox}>
                    <ArrowDown color="#F43F5E" size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.pillExpense}>
                    <Text style={styles.pillExpenseText}>Expenses</Text>
                    <Info color="rgba(244, 63, 94, 0.7)" size={10} />
                  </View>
                </View>

                <Text style={styles.expenseAmount}>
                  {currencySymbol}{summary.monthlyExpense.toLocaleString()}
                </Text>

                <Text style={[styles.growthTextRed, { color: colors.textSecondary }]}>
                  This month • <Text style={{ color: '#F43F5E', fontWeight: '800' }}>{summary.expenseGrowth}</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* 4. Health Score Card (Exact image 1 style) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AI Advisor')}
              style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
            >
              <View style={styles.healthHeader}>
                <View style={styles.healthIconBox}>
                  <Lightbulb color="#FFFFFF" size={20} />
                </View>
                <View style={styles.pillHealth}>
                  <Text style={styles.pillHealthText}>Health Score</Text>
                  <Info color="rgba(139, 92, 246, 0.7)" size={12} />
                </View>
              </View>

              <Text style={[styles.healthScoreText, { color: colors.text }]}>
                {summary.healthScore}% <Text style={styles.healthSub}>Financial Health</Text>
              </Text>
            </TouchableOpacity>

            {/* 5. Category Budget Breakdown */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Budgets</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Details</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
              {categories.map((c, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(c)}
                  style={styles.categoryRow}
                >
                  <View style={styles.catInfo}>
                    <Text style={[styles.catName, { color: colors.text }]}>{c.name}</Text>
                    <Text style={[styles.catSpent, { color: colors.textSecondary }]}>
                      {currencySymbol}{c.spent.toLocaleString()} / {currencySymbol}{c.budget.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.inputBg }]}>
                    <View style={[styles.progressBar, { width: `${c.percentage}%`, backgroundColor: c.color }]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 6. Recent Transactions */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {summary.recentTransactions.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                activeOpacity={0.7}
                onPress={() => setSelectedTx(tx)}
                style={[styles.txItem, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
              >
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' }]}>
                  {tx.type === 'income' ? <ArrowUp color="#10B981" size={18} /> : <ArrowDown color="#F43F5E" size={18} />}
                </View>
                <View style={styles.txDetails}>
                  <Text style={[styles.txTitle, { color: colors.text }]}>{tx.title}</Text>
                  <Text style={[styles.txMeta, { color: colors.textSecondary }]}>{tx.category} • {tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? '#10B981' : colors.text }]}>
                  {tx.type === 'income' ? '+' : '-'}
                  {currencySymbol}
                  {tx.amount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <TransactionDetailsModal
        visible={!!selectedTx}
        transaction={selectedTx}
        currencySymbol={currencySymbol}
        onClose={() => setSelectedTx(null)}
      />

      <CategoryDetailsModal
        visible={!!selectedCategory}
        category={selectedCategory}
        currencySymbol={currencySymbol}
        onClose={() => setSelectedCategory(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  twoCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  halfCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  greenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  glowingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  greenPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  cardSubText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  statusBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  statusBulletText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  balanceCenter: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  balanceAmountCyan: {
    color: '#06B6D4',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  availableFundsGreen: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  incomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  incomeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillIncome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillIncomeText: { color: '#10B981', fontSize: 11, fontWeight: '800' },
  incomeAmount: { color: '#10B981', fontSize: 26, fontWeight: '900', marginBottom: 4 },
  growthTextGreen: { fontSize: 11 },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  expenseIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillExpense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillExpenseText: { color: '#F43F5E', fontSize: 11, fontWeight: '800' },
  expenseAmount: { color: '#F43F5E', fontSize: 26, fontWeight: '900', marginBottom: 4 },
  growthTextRed: { fontSize: 11 },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillHealthText: { color: '#8B5CF6', fontSize: 11, fontWeight: '800' },
  healthScoreText: { fontSize: 24, fontWeight: '900' },
  healthSub: { fontSize: 13, fontWeight: '600', opacity: 0.8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  seeAllText: { fontSize: 12, fontWeight: '700' },
  categoryRow: { marginBottom: 12 },
  catInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: { fontSize: 11, fontWeight: '700' },
  catSpent: { fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 3 },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDetails: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: '700' },
  txMeta: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
})
