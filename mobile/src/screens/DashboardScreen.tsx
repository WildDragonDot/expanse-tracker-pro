import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
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
  Clock,
  CheckCircle2,
  Moon,
  Mail,
  Smartphone,
  Bell,
  X,
  Sparkles,
  Activity,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { DashboardSkeleton } from '../components/SkeletonLoader'
import { TransactionDetailsModal, TransactionItem } from '../components/TransactionDetailsModal'
import { CategoryDetailsModal, CategoryDetailsItem } from '../components/CategoryDetailsModal'
import { InfoTooltipModal, TooltipData } from '../components/InfoTooltipModal'
import { api } from '../services/api'
import { BillOccurrence } from '../types'

const CATEGORY_COLORS = ['#8B5CF6', '#10B981', '#06B6D4', '#F59E0B', '#F43F5E']

const daysUntil = (dateStr: string) => {
  const due = new Date(dateStr)
  const now = new Date()
  due.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [billActionBusy, setBillActionBusy] = useState(false)

  // Modals & Tooltips
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryDetailsItem | null>(null)
  const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null)

  const [upcomingBill, setUpcomingBill] = useState<BillOccurrence | null>(null)

  const [summary, setSummary] = useState({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    savingsRate: 0,
    healthStatus: 'No activity logged yet',
    recentTransactions: [] as TransactionItem[],
  })

  const [categories, setCategories] = useState<CategoryDetailsItem[]>([])
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const [billCompliance, setBillCompliance] = useState<number | null>(null)

  const handlePayBill = async () => {
    if (!upcomingBill || billActionBusy) return
    setBillActionBusy(true)
    try {
      await api.markBillPaid(upcomingBill.id, { date: new Date().toISOString() })
      Alert.alert('Payment Recorded ✅', `Marked ${currencySymbol}${upcomingBill.amount.toLocaleString()} for ${upcomingBill.title} as paid.`)
      loadData()
    } catch (err: any) {
      Alert.alert('Could not mark as paid', err.message || 'Please try again.')
    } finally {
      setBillActionBusy(false)
    }
  }

  const handleSnoozeBill = async () => {
    if (!upcomingBill || billActionBusy) return
    setBillActionBusy(true)
    try {
      await api.snoozeBill(upcomingBill.id, 3)
      Alert.alert('Reminder Snoozed 💤', `Next alert will notify in 3 days.`)
      loadData()
    } catch (err: any) {
      Alert.alert('Could not snooze reminder', err.message || 'Please try again.')
    } finally {
      setBillActionBusy(false)
    }
  }

  const loadData = async () => {
    try {
      const now = new Date()
      const [dashSummary, score] = await Promise.all([
        api.getDashboardSummary().catch(() => null),
        api.getSmartScore(now.getFullYear(), now.getMonth() + 1).catch(() => null),
      ])

      if (dashSummary) {
        // Defensive: an older/partially-deployed backend may omit newer fields
        // (recentTransactions, upcomingBill, etc.) — never let a missing field crash the screen.
        const recentTransactions = (dashSummary.recentTransactions || []) as TransactionItem[]
        const topCategories = dashSummary.topCategories || []

        setSummary({
          currentBalance: dashSummary.totalBalance || 0,
          monthlyIncome: dashSummary.totalIncome || 0,
          monthlyExpense: dashSummary.totalExpenses || 0,
          savingsRate: dashSummary.savingsRate || 0,
          healthStatus: dashSummary.totalIncome > 0 || dashSummary.totalExpenses > 0
            ? (dashSummary.savingsRate >= 20 ? 'Healthy financial status' : dashSummary.savingsRate >= 0 ? 'Stable, keep tracking' : 'Spending more than you earn')
            : 'No activity logged yet',
          recentTransactions,
        })

        const totalCategorySpend = topCategories.reduce((sum, c) => sum + c.amount, 0) || 1
        setCategories(
          topCategories.map((c, idx) => ({
            name: c.category,
            spent: c.amount,
            budget: 0,
            percentage: Math.round((c.amount / totalCategorySpend) * 100),
            color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          }))
        )

        setUpcomingBill(dashSummary.upcomingBill || null)
      }

      if (score) {
        setHealthScore(score.score)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    api.getBillOccurrences().then((occs) => {
      const settled = occs.filter((o) => o.status === 'PAID' || o.status === 'OVERDUE')
      if (settled.length === 0) {
        setBillCompliance(null)
        return
      }
      const paid = occs.filter((o) => o.status === 'PAID').length
      setBillCompliance(Math.round((paid / settled.length) * 100))
    }).catch(() => setBillCompliance(null))
  }, [refreshing])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'
  const upcomingBillDaysLeft = upcomingBill ? daysUntil(upcomingBill.dueDate) : 0
  const hasActivity = summary.monthlyIncome > 0 || summary.monthlyExpense > 0
  const scoreForGauge = hasActivity ? (healthScore ?? 0) : 0
  const budgetBurnLabel = !hasActivity ? 'N/A' : summary.savingsRate >= 20 ? 'Safe' : summary.savingsRate >= 5 ? 'Watch' : 'High'
  const budgetBurnColor = !hasActivity ? colors.textMuted : summary.savingsRate >= 20 ? '#10B981' : summary.savingsRate >= 5 ? '#F59E0B' : '#F43F5E'
  const copilotText =
    !hasActivity
      ? 'Add your first income or expense to start tracking your financial health.'
      : `You're saving ${summary.savingsRate}% of your income this month.`

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar
        title="Dashboard"
        onProfilePress={() => navigation.navigate('Settings')}
        onNotificationPress={() => navigation.navigate('Subscriptions')}
        hasUnreadNotifications={upcomingBill !== null}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <DashboardSkeleton />
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

                <Text style={[styles.growthTextGreen, { color: colors.textSecondary }]}>This month</Text>
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

                <Text style={[styles.growthTextRed, { color: colors.textSecondary }]}>This month</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Upcoming Bill Reminder Alert Banner / Widget */}
            {upcomingBill && (
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
                          <Text style={styles.dueSoonText}>
                            {upcomingBillDaysLeft < 0 ? `${Math.abs(upcomingBillDaysLeft)}d overdue` : upcomingBillDaysLeft === 0 ? 'Due today' : `${upcomingBillDaysLeft}d left`}
                          </Text>
                        </View>
                        <Text style={[styles.reminderCardSub, { color: colors.textSecondary, marginTop: 0 }]}>
                          {currencySymbol}{upcomingBill.amount.toLocaleString()} • Due {new Date(upcomingBill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
                    disabled={billActionBusy}
                    style={[styles.reminderPayBtn, { backgroundColor: '#10B981', opacity: billActionBusy ? 0.6 : 1 }]}
                  >
                    <CheckCircle2 color="#FFFFFF" size={14} />
                    <Text style={styles.reminderPayBtnText}>1-Click Mark Paid</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSnoozeBill}
                    disabled={billActionBusy}
                    style={[styles.reminderSnoozeBtn, { borderColor: colors.surfaceGlassBorder, opacity: billActionBusy ? 0.6 : 1 }]}
                  >
                    <Moon color={colors.textSecondary} size={14} />
                    <Text style={[styles.reminderSnoozeBtnText, { color: colors.textSecondary }]}>Snooze 3d</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 4. Rich Financial Health Score Card */}
            <View
              style={[
                styles.healthCardContainer,
                { backgroundColor: colors.surfaceGlass, borderColor: 'rgba(139, 92, 246, 0.3)' },
              ]}
            >
              {/* Top Header */}
              <View style={styles.healthHeader}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('AI Advisor')}
                  style={styles.healthTitleRow}
                >
                  <View style={styles.healthIconBox}>
                    <ShieldCheck color="#8B5CF6" size={18} />
                  </View>
                  <View>
                    <Text style={[styles.healthCardMainTitle, { color: colors.text }]}>Financial Health Score</Text>
                    <View style={styles.healthAiBadgeRow}>
                      <Sparkles color="#8B5CF6" size={10} style={{ marginRight: 3 }} />
                      <Text style={styles.healthAiBadgeText}>Autonomous AI Diagnostics</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() =>
                    setActiveTooltip({
                      title: 'Financial Health Score',
                      description: 'A comprehensive 0-100 score that evaluates your spending discipline, savings velocity, debt obligations, and emergency fund buffer.',
                      details: 'Score > 70% indicates healthy financial security and balanced expenditure.',
                      accentColor: '#8B5CF6',
                    })
                  }
                  style={styles.pillHealth}
                >
                  <Text style={styles.pillHealthText}>Info</Text>
                  <Info color="rgba(139, 92, 246, 0.9)" size={11} />
                </TouchableOpacity>
              </View>

              {/* Big Score Hero + Status Pill */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AI Advisor')}
                style={styles.healthScoreHeroRow}
              >
                <View style={styles.healthScoreLeft}>
                  <Text style={[styles.healthScoreBig, { color: colors.text }]}>
                    {!hasActivity ? '0' : (healthScore ?? '—')}
                    <Text style={[styles.healthScoreMax, { color: colors.textMuted }]}>/100</Text>
                  </Text>
                </View>

                <View style={styles.healthStatusBadge}>
                  <View style={[styles.healthStatusDot, !hasActivity && { backgroundColor: colors.textMuted }]} />
                  <Text style={[styles.healthStatusText, !hasActivity && { color: colors.textMuted }]}>
                    {!hasActivity ? 'NO ACTIVITY' : healthScore === null ? 'CALCULATING' : scoreForGauge >= 80 ? 'EXCELLENT' : scoreForGauge >= 65 ? 'OPTIMAL' : scoreForGauge >= 40 ? 'FAIR' : 'ATTENTION'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 4-Segment Modern Fintech Gauge */}
              <View style={styles.healthGaugeContainer}>
                <View style={styles.gaugeSegmentsRow}>
                  {/* Segment 1: 0-40 (Needs Work - Red) */}
                  <View style={[styles.gaugeSegment, { backgroundColor: colors.inputBg }]}>
                    <LinearGradient
                      colors={['#DC2626', '#EF4444']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.gaugeFill, { width: `${Math.min(100, (scoreForGauge / 40) * 100)}%` }]}
                    />
                  </View>

                  {/* Segment 2: 40-65 (Fair - Orange/Amber) */}
                  <View style={[styles.gaugeSegment, { backgroundColor: colors.inputBg }]}>
                    {scoreForGauge > 40 && (
                      <LinearGradient
                        colors={['#F97316', '#F59E0B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.gaugeFill, { width: `${Math.min(100, Math.max(0, ((scoreForGauge - 40) / 25) * 100))}%` }]}
                      />
                    )}
                  </View>

                  {/* Segment 3: 65-85 (Optimal - Yellow/Lime Green) */}
                  <View style={[styles.gaugeSegment, { backgroundColor: colors.inputBg }]}>
                    {scoreForGauge > 65 && (
                      <LinearGradient
                        colors={['#F59E0B', '#EAB308', '#84CC16']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.gaugeFill, { width: `${Math.min(100, Math.max(0, ((scoreForGauge - 65) / 20) * 100))}%` }]}
                      />
                    )}
                  </View>

                  {/* Segment 4: 85-100 (Excellent - Bright Green) */}
                  <View style={[styles.gaugeSegment, { backgroundColor: colors.inputBg }]}>
                    {scoreForGauge > 85 && (
                      <LinearGradient
                        colors={['#84CC16', '#10B981']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.gaugeFill, { width: `${Math.min(100, Math.max(0, ((scoreForGauge - 85) / 15) * 100))}%` }]}
                      />
                    )}
                  </View>
                </View>

                {/* Scale Rating Labels Underneath */}
                <View style={styles.gaugeLabelsRow}>
                  <Text style={[styles.gaugeLabelText, { color: scoreForGauge < 40 ? '#EF4444' : colors.textMuted }]}>Needs Work</Text>
                  <Text style={[styles.gaugeLabelText, { color: scoreForGauge >= 40 && scoreForGauge < 65 ? '#F59E0B' : colors.textMuted }]}>Fair</Text>
                  <Text style={[styles.gaugeLabelText, { color: scoreForGauge >= 65 && scoreForGauge < 85 ? '#84CC16' : colors.textMuted, fontWeight: scoreForGauge >= 65 && scoreForGauge < 85 ? '800' : '600' }]}>
                    ● Optimal
                  </Text>
                  <Text style={[styles.gaugeLabelText, { color: scoreForGauge >= 85 ? '#10B981' : colors.textMuted }]}>Excellent</Text>
                </View>
              </View>

              {/* 3 Sub-Metrics Micro Badges */}
              <View style={styles.healthSubMetricsRow}>
                <View style={[styles.healthSubMetricPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <TrendingUp color="#10B981" size={12} />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.healthSubMetricLabel}>Savings Rate</Text>
                    <Text style={[styles.healthSubMetricVal, { color: '#10B981' }]}>{summary.savingsRate}%</Text>
                  </View>
                </View>

                <View style={[styles.healthSubMetricPill, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                  <CheckCircle2 color="#06B6D4" size={12} />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.healthSubMetricLabel}>Bills On-Time</Text>
                    <Text style={[styles.healthSubMetricVal, { color: '#06B6D4' }]}>{billCompliance === null ? 'N/A' : `${billCompliance}%`}</Text>
                  </View>
                </View>

                <View style={[styles.healthSubMetricPill, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                  <Activity color="#8B5CF6" size={12} />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.healthSubMetricLabel}>Budget Burn</Text>
                    <Text style={[styles.healthSubMetricVal, { color: budgetBurnColor }]}>{budgetBurnLabel}</Text>
                  </View>
                </View>
              </View>

              {/* AI Copilot Callout Bar */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AI Advisor')}
                style={[styles.healthCopilotBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              >
                <Sparkles color="#8B5CF6" size={13} style={{ marginRight: 6 }} />
                <Text numberOfLines={1} style={[styles.healthCopilotText, { color: colors.textSecondary }]}>
                  {copilotText}
                </Text>
                <ChevronRight color="#8B5CF6" size={14} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>

            {/* 5. Top Spending Categories */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Categories This Month</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Details</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
              {categories.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', paddingVertical: 8 }}>
                  No expenses logged yet this month.
                </Text>
              ) : (
                categories.map((c, idx) => (
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
                          {currencySymbol}{c.spent.toLocaleString()} <Text style={{ fontSize: 10, color: colors.textMuted }}>({c.percentage}% of spend)</Text>
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.inputBg }]}>
                      <View style={[styles.progressBar, { width: `${c.percentage}%`, backgroundColor: c.color }]} />
                    </View>
                  </TouchableOpacity>
                ))
              )}
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
  healthCardContainer: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  healthIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthCardMainTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  healthAiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  healthAiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  pillHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillHealthText: { color: '#8B5CF6', fontSize: 10, fontWeight: '800' },
  healthScoreHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  healthScoreLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  healthScoreBig: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  healthScoreMax: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 2,
  },
  healthStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  healthStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  healthStatusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  healthGaugeContainer: {
    marginBottom: 14,
  },
  gaugeSegmentsRow: {
    flexDirection: 'row',
    gap: 6,
    height: 8,
    marginBottom: 6,
  },
  gaugeSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: 8,
    borderRadius: 4,
  },
  gaugeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  gaugeLabelText: {
    fontSize: 9,
    fontWeight: '700',
  },
  healthSubMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  healthSubMetricPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
  },
  healthSubMetricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  healthSubMetricVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  healthCopilotBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  healthCopilotText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
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
