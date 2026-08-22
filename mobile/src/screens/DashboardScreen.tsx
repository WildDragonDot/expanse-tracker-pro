import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Info,
  ChevronRight,
  TrendingUp,
  Wallet,
  BellRing,
  Clock,
  CheckCircle2,
  Moon,
  Mail,
  Smartphone,
  Bell,
  X,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { CardSkeleton } from '../components/SkeletonLoader'
import { TransactionDetailsModal, TransactionItem } from '../components/TransactionDetailsModal'
import { CategoryDetailsModal, CategoryDetailsItem } from '../components/CategoryDetailsModal'
import { InfoTooltipModal, TooltipData } from '../components/InfoTooltipModal'
import { api } from '../services/api'

export const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modals & Tooltips
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryDetailsItem | null>(null)
  const [showUrgentPopup, setShowUrgentPopup] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null)

  // Upcoming Bill Reminder State
  const [upcomingBill, setUpcomingBill] = useState({
    id: 'occ_1',
    title: 'Broadband / Optical Fiber',
    amount: 1199,
    category: 'Utilities',
    dueDate: '2026-08-25',
    daysLeft: 3,
    notes: 'High priority multi-channel alert (In-App, Push, Email)',
    isPaid: false,
  })

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

  const handlePayBill = () => {
    Alert.alert('Payment Recorded ✅', `Marked ${currencySymbol}${upcomingBill.amount} for ${upcomingBill.title} as paid.`)
    setUpcomingBill((prev) => ({ ...prev, isPaid: true }))
    setShowUrgentPopup(false)
  }

  const handleSnoozeBill = () => {
    Alert.alert('Reminder Snoozed 💤', `Next alert will notify in 3 days.`)
    setShowUrgentPopup(false)
  }

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
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() =>
                    setActiveTooltip({
                      title: 'Current Balance',
                      description: 'The real-time total of all available liquid funds across cash, bank, and mobile wallets.',
                      details: 'Calculated by deducting logged expenses from all registered earnings and credits.',
                      accentColor: '#10B981',
                    })
                  }
                  style={styles.greenPill}
                >
                  <Wallet color="#10B981" size={13} style={{ marginRight: 4 }} />
                  <Text style={styles.greenPillText}>Current Balance</Text>
                  <Info color="#10B981" size={10} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
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
                  {currencySymbol}{(summary.currentBalance || 0).toLocaleString()}
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
                    <ArrowUpRight color="#10B981" size={18} strokeWidth={2.5} />
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() =>
                      setActiveTooltip({
                        title: 'Monthly Income',
                        description: 'Total revenue and money credited during the current calendar month.',
                        details: 'Includes salary, freelance invoices, business earnings, interest, and investments.',
                        accentColor: '#10B981',
                      })
                    }
                    style={styles.pillIncome}
                  >
                    <Text style={styles.pillIncomeText}>Income</Text>
                    <Info color="rgba(16, 185, 129, 0.9)" size={10} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.incomeAmount}>
                  {currencySymbol}{(summary.monthlyIncome || 0).toLocaleString()}
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
                    <ArrowDownRight color="#F43F5E" size={18} strokeWidth={2.5} />
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() =>
                      setActiveTooltip({
                        title: 'Monthly Expenses',
                        description: 'Total money spent across all categories and recurring subscriptions this month.',
                        details: 'Sum of all debit transactions, autopays, food, rent, and shopping.',
                        accentColor: '#F43F5E',
                      })
                    }
                    style={styles.pillExpense}
                  >
                    <Text style={styles.pillExpenseText}>Expenses</Text>
                    <Info color="rgba(244, 63, 94, 0.9)" size={10} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.expenseAmount}>
                  {currencySymbol}{(summary.monthlyExpense || 0).toLocaleString()}
                </Text>

                <Text style={[styles.growthTextRed, { color: colors.textSecondary }]}>
                  This month • <Text style={{ color: '#F43F5E', fontWeight: '800' }}>{summary.expenseGrowth}</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Upcoming Bill Reminder Alert Banner / Widget */}
            {!upcomingBill.isPaid && (
              <View
                style={[
                  styles.reminderAlertCard,
                  { backgroundColor: colors.surfaceGlass, borderColor: 'rgba(6, 182, 212, 0.35)' },
                ]}
              >
                <View style={styles.reminderCardTop}>
                  <View style={styles.reminderLeftRow}>
                    <CategoryIcon
                      name={upcomingBill.title}
                      iconKey={upcomingBill.category}
                      color="#06B6D4"
                      size={20}
                      containerSize={42}
                      containerBg="rgba(6, 182, 212, 0.15)"
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={[styles.reminderCardTitle, { color: colors.text }]}>
                        {upcomingBill.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <View style={styles.dueSoonPill}>
                          <Text style={styles.dueSoonText}>{upcomingBill.daysLeft}d left</Text>
                        </View>
                        <Text style={[styles.reminderCardSub, { color: colors.textSecondary, marginTop: 0 }]}>
                          {currencySymbol}{upcomingBill.amount.toLocaleString()} • Due {upcomingBill.dueDate}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Subscriptions')}
                    style={styles.manageLinkBtn}
                  >
                    <Text style={[styles.manageLinkText, { color: '#38BDF8' }]}>Manage</Text>
                    <ChevronRight color="#38BDF8" size={14} />
                  </TouchableOpacity>
                </View>

                {/* Reminder Channel Badges */}
                <View style={styles.reminderChannelsList}>
                  <View style={[styles.channelBadge, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                    <Smartphone color="#06B6D4" size={10} />
                    <Text style={[styles.channelBadgeText, { color: '#06B6D4' }]}>In-App Popup</Text>
                  </View>
                  <View style={[styles.channelBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                    <Bell color="#3B82F6" size={10} />
                    <Text style={[styles.channelBadgeText, { color: '#3B82F6' }]}>Push</Text>
                  </View>
                  <View style={[styles.channelBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Mail color="#10B981" size={10} />
                    <Text style={[styles.channelBadgeText, { color: '#10B981' }]}>Email Alert</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.reminderActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePayBill}
                    style={[styles.reminderPayBtn, { backgroundColor: '#10B981' }]}
                  >
                    <CheckCircle2 color="#FFFFFF" size={14} />
                    <Text style={styles.reminderPayBtnText}>1-Click Mark Paid</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSnoozeBill}
                    style={[styles.reminderSnoozeBtn, { borderColor: colors.surfaceGlassBorder }]}
                  >
                    <Moon color={colors.textSecondary} size={14} />
                    <Text style={[styles.reminderSnoozeBtnText, { color: colors.textSecondary }]}>Snooze 3d</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 4. Health Score Card */}
            <View
              style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
            >
              <View style={styles.healthHeader}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('AI Advisor')}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={styles.healthIconBox}>
                    <ShieldCheck color="#FFFFFF" size={20} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() =>
                    setActiveTooltip({
                      title: 'Financial Health Score',
                      description: 'A comprehensive 0-100 score that evaluates your spending control, savings growth, debt balance, and recurring bills discipline.',
                      details: 'Score > 70% indicates excellent financial resilience and prudent budget management.',
                      accentColor: '#3B82F6',
                    })
                  }
                  style={styles.pillHealth}
                >
                  <Text style={styles.pillHealthText}>Health Score</Text>
                  <Info color="rgba(59, 130, 246, 0.9)" size={12} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AI Advisor')}
              >
                <Text style={[styles.healthScoreText, { color: colors.text }]}>
                  {summary.healthScore}% <Text style={styles.healthSub}>Financial Health</Text>
                </Text>
              </TouchableOpacity>
            </View>

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
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <CategoryIcon name={c.name} color={c.color} size={14} containerSize={28} style={{ marginRight: 10 }} />
                    <View style={styles.catInfo}>
                      <Text style={[styles.catName, { color: colors.text }]}>{c.name}</Text>
                      <Text style={[styles.catSpent, { color: colors.textSecondary }]}>
                        {currencySymbol}{c.spent.toLocaleString()} <Text style={{ fontSize: 10, color: colors.textMuted }}>/ {currencySymbol}{c.budget.toLocaleString()}</Text>
                      </Text>
                    </View>
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
                <CategoryIcon
                  name={tx.category}
                  color={tx.type === 'income' ? '#10B981' : '#F43F5E'}
                  size={18}
                  containerSize={40}
                  containerBg={tx.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}
                  style={{ marginRight: 12 }}
                />
                <View style={styles.txDetails}>
                  <Text style={[styles.txTitle, { color: colors.text }]}>{tx.title}</Text>
                  <Text style={[styles.txMeta, { color: colors.textSecondary }]}>{tx.category} • {tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? '#10B981' : colors.text }]}>
                  {tx.type === 'income' ? '+' : '-'}
                  {currencySymbol}
                  {(tx.amount || 0).toLocaleString()}
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

      {/* Urgent Payment Due In-App Popup Modal */}
      <Modal visible={showUrgentPopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={[styles.popupCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.popupIconCircle}>
              <BellRing color="#8B5CF6" size={28} />
            </View>
            <Text style={[styles.popupTitle, { color: colors.text }]}>Upcoming Payment Reminder</Text>
            <Text style={[styles.popupSub, { color: colors.textSecondary }]}>
              "{upcomingBill.title}" is due in <Text style={{ color: '#F43F5E', fontWeight: '800' }}>{upcomingBill.daysLeft} days</Text> ({upcomingBill.dueDate}).
            </Text>

            <View style={[styles.popupAmountBox, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.popupAmountText, { color: colors.text }]}>
                {currencySymbol}{upcomingBill.amount.toLocaleString()}
              </Text>
              <Text style={[styles.popupCategoryText, { color: colors.textMuted }]}>{upcomingBill.category} • Multi-Channel Alert Active</Text>
            </View>

            <View style={styles.popupChannelsRow}>
              <View style={[styles.channelBadge, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                <Smartphone color="#06B6D4" size={11} />
                <Text style={[styles.channelBadgeText, { color: '#06B6D4' }]}>In-App</Text>
              </View>
              <View style={[styles.channelBadge, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <Bell color="#8B5CF6" size={11} />
                <Text style={[styles.channelBadgeText, { color: '#8B5CF6' }]}>Push</Text>
              </View>
              <View style={[styles.channelBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Mail color="#10B981" size={11} />
                <Text style={[styles.channelBadgeText, { color: '#10B981' }]}>Email Alert</Text>
              </View>
            </View>

            <View style={styles.popupActions}>
              <TouchableOpacity
                style={[styles.popupActionBtn, { backgroundColor: '#10B981' }]}
                onPress={handlePayBill}
              >
                <CheckCircle2 color="#FFFFFF" size={16} />
                <Text style={styles.popupActionBtnText}>1-Click Mark Paid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.popupSecondaryBtn, { borderColor: colors.inputBorder }]}
                onPress={handleSnoozeBill}
              >
                <Moon color={colors.textSecondary} size={16} />
                <Text style={[styles.popupSecondaryBtnText, { color: colors.textSecondary }]}>Snooze 3 Days</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowUrgentPopup(false)} style={styles.popupCloseBtn}>
              <Text style={[styles.popupCloseText, { color: colors.textMuted }]}>Remind Me Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reusable Interactive Info Tooltip Modal */}
      <InfoTooltipModal
        visible={!!activeTooltip}
        tooltip={activeTooltip}
        onClose={() => setActiveTooltip(null)}
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
  reminderAlertCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  reminderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  reminderIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  dueSoonPill: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dueSoonText: {
    color: '#F43F5E',
    fontSize: 10,
    fontWeight: '800',
  },
  reminderCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  manageLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reminderChannelsList: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  channelBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  reminderActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reminderPayBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  reminderPayBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  reminderSnoozeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  reminderSnoozeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
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
  categoryRow: { marginBottom: 14 },
  catInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: { fontSize: 13, fontWeight: '700' },
  catSpent: { fontSize: 12, fontWeight: '800' },
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
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  popupIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  popupSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  popupAmountBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  popupAmountText: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  popupCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  popupChannelsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  popupActions: {
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },
  popupActionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  popupActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  popupSecondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  popupSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  popupCloseBtn: {
    paddingVertical: 8,
  },
  popupCloseText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
