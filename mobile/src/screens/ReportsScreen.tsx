import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native'
import {
  Download,
  Share2,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Mail,
  Calendar,
  CalendarDays,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Layers,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { ReportsSkeleton } from '../components/SkeletonLoader'
import { api } from '../services/api'

interface CycleInfo {
  index: number
  label: string
  subtitle: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

function calculateBillingCycles(cycleDay = 1, count = 12): CycleInfo[] {
  const cycles: CycleInfo[] = []
  const today = new Date()

  let curYear = today.getFullYear()
  let curMonth = today.getMonth() // 0-11

  // If today's day of month is less than cycleDay, current cycle began last month
  if (today.getDate() < cycleDay) {
    curMonth -= 1
    if (curMonth < 0) {
      curMonth = 11
      curYear -= 1
    }
  }

  for (let i = 0; i < count; i++) {
    let cycleStartMonth = curMonth - i
    let cycleStartYear = curYear
    while (cycleStartMonth < 0) {
      cycleStartMonth += 12
      cycleStartYear -= 1
    }

    const startDateObj = new Date(cycleStartYear, cycleStartMonth, cycleDay)

    let cycleEndMonth = cycleStartMonth + 1
    let cycleEndYear = cycleStartYear
    if (cycleEndMonth > 11) {
      cycleEndMonth = 0
      cycleEndYear += 1
    }
    const nextCycleStartObj = new Date(cycleEndYear, cycleEndMonth, cycleDay)
    const endDateObj = new Date(nextCycleStartObj.getTime() - 24 * 60 * 60 * 1000)

    const startStr = startDateObj.toISOString().split('T')[0]
    const endStr = endDateObj.toISOString().split('T')[0]

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const startMonthName = monthNames[startDateObj.getMonth()]

    let label = ''
    if (i === 0) {
      label = `Current Cycle (${startMonthName} ${cycleDay})`
    } else if (i === 1) {
      label = `Last Cycle (${startMonthName} ${cycleDay})`
    } else {
      label = `${startMonthName} ${startDateObj.getFullYear()} Cycle`
    }

    const subtitle = `${startStr} to ${endStr}`

    cycles.push({
      index: i,
      label,
      subtitle,
      startDate: startStr,
      endDate: endStr,
      isCurrent: i === 0,
    })
  }

  return cycles
}

export const ReportsScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const [filterType, setFilterType] = useState<'cycle' | 'month' | 'quarter' | 'ytd' | 'custom'>('cycle')

  // Billing Cycles computation
  const billingDay = (user as any)?.billingCycleStartDay || 1
  const availableCycles = useMemo(() => calculateBillingCycles(billingDay, 12), [billingDay])
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(0)
  const currentCycle = availableCycles[selectedCycleIndex] || availableCycles[0]
  const [showCycleModal, setShowCycleModal] = useState(false)

  // Custom Date Range State (YYYY-MM-DD)
  const now = new Date()
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const defaultEndDate = now.toISOString().split('T')[0]

  const [customFrom, setCustomFrom] = useState(defaultStartDate)
  const [customTo, setCustomTo] = useState(defaultEndDate)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [tempFrom, setTempFrom] = useState(defaultStartDate)
  const [tempTo, setTempTo] = useState(defaultEndDate)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reportData, setReportData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    savings: 0,
    savingsRate: 0,
    avgDailySpend: 0,
    transactionsCount: 0,
    topCategories: [] as { category: string; amount: number; percentage: number }[],
  })

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const activeDateRange = useMemo(() => {
    if (filterType === 'cycle') {
      return { from: currentCycle.startDate, to: currentCycle.endDate, label: currentCycle.label }
    }
    if (filterType === 'custom') {
      return { from: customFrom, to: customTo, label: `${customFrom} to ${customTo}` }
    }
    if (filterType === 'quarter') {
      const d = new Date()
      d.setDate(d.getDate() - 90)
      return { from: d.toISOString().split('T')[0], to: defaultEndDate, label: 'Last 90 Days' }
    }
    if (filterType === 'ytd') {
      return { from: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0], to: defaultEndDate, label: `YTD ${now.getFullYear()}` }
    }
    return { from: defaultStartDate, to: defaultEndDate, label: 'This Month' }
  }, [filterType, currentCycle, customFrom, customTo])

  const loadReport = async () => {
    try {
      let rangeParam: 'month' | 'quarter' | 'ytd' | 'custom' = 'month'
      let fromParam: string | undefined
      let toParam: string | undefined

      if (filterType === 'cycle' || filterType === 'custom') {
        rangeParam = 'custom'
        fromParam = activeDateRange.from
        toParam = activeDateRange.to
      } else {
        rangeParam = filterType
      }

      const data = await api.getRangeSummary(rangeParam, fromParam, toParam)
      setReportData(data)
    } catch {
      setReportData({
        totalIncome: 0,
        totalExpenses: 0,
        savings: 0,
        savingsRate: 0,
        avgDailySpend: 0,
        transactionsCount: 0,
        topCategories: [],
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadReport()
  }, [filterType, selectedCycleIndex, customFrom, customTo])

  const onRefresh = () => {
    setRefreshing(true)
    loadReport()
  }

  const handleShareReport = async () => {
    try {
      const summaryText = `📊 FinanceTracker Pro - Statement (${activeDateRange.label})\n` +
        `• Period: ${activeDateRange.from} to ${activeDateRange.to}\n` +
        `• Total Inflow: ${currencySymbol}${reportData.totalIncome.toLocaleString()}\n` +
        `• Total Outflow: ${currencySymbol}${reportData.totalExpenses.toLocaleString()}\n` +
        `• Net Savings: ${currencySymbol}${reportData.savings.toLocaleString()} (${reportData.savingsRate}%)\n` +
        `• Transactions: ${reportData.transactionsCount}\n\n` +
        `Generated with FinanceTracker Pro`

      await Share.share({
        message: summaryText,
        title: 'Financial Statement Report',
      })
    } catch {
      Alert.alert('Error', 'Unable to share report.')
    }
  }

  const [sendingEmail, setSendingEmail] = useState(false)

  const handleEmailPDFReport = async () => {
    setSendingEmail(true)
    try {
      const res = await api.sendEmailReport({
        dateFrom: activeDateRange.from,
        dateTo: activeDateRange.to,
        type: filterType === 'cycle' ? 'cycle' : filterType === 'month' ? 'monthly' : 'custom',
        includeBillAttachments: true,
      })

      if (res.success) {
        Alert.alert(
          'Email Sent! 📄',
          `Your comprehensive PDF Financial Statement with attached receipts was sent to ${user?.email || 'your registered email'}.`
        )
      } else {
        Alert.alert('Notice', res.message || 'Unable to send report right now.')
      }
    } catch (err: any) {
      Alert.alert('Email Failed', err.message || 'Could not send PDF statement via email.')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleExportCSV = async () => {
    const rows = [
      ['Category', 'Amount', '% of Spend'],
      ...reportData.topCategories.map((c) => [c.category, c.amount.toString(), `${c.percentage}%`]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')

    try {
      await Share.share({
        message: csv,
        title: `Statement-${activeDateRange.from}_${activeDateRange.to}.csv`,
      })
    } catch {
      Alert.alert('Error', 'Unable to export CSV.')
    }
  }

  const applyCustomRange = () => {
    setCustomFrom(tempFrom)
    setCustomTo(tempTo)
    setFilterType('custom')
    setShowCustomModal(false)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar
        title="Financial Reports"
        onProfilePress={() => navigation?.navigate('Settings')}
        onNotificationPress={() => navigation?.navigate('Subscriptions')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Filter Pills Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollRow}
        >
          {[
            { id: 'cycle', label: `Cycle (Day ${billingDay})`, icon: Briefcase },
            { id: 'month', label: 'Month', icon: null },
            { id: 'quarter', label: '90 Days', icon: null },
            { id: 'ytd', label: 'YTD', icon: null },
            { id: 'custom', label: filterType === 'custom' ? `${customFrom.slice(5)} to ${customTo.slice(5)}` : 'Custom Range', icon: Calendar },
          ].map((pill) => {
            const Icon = pill.icon
            const isSelected = filterType === pill.id
            return (
              <TouchableOpacity
                key={pill.id}
                activeOpacity={0.7}
                onPress={() => {
                  if (pill.id === 'custom') {
                    setTempFrom(customFrom)
                    setTempTo(customTo)
                    setShowCustomModal(true)
                  } else {
                    setFilterType(pill.id as any)
                  }
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? '#8B5CF6' : colors.surfaceGlass,
                    borderColor: isSelected ? '#8B5CF6' : colors.surfaceGlassBorder,
                  },
                ]}
              >
                {Icon && <Icon size={13} color={isSelected ? '#FFFFFF' : '#8B5CF6'} />}
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Salary / Billing Cycle Switcher Bar */}
        {filterType === 'cycle' && (
          <View style={[styles.cycleCard, { backgroundColor: colors.surfaceGlass, borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
            <View style={styles.cycleHeader}>
              <View style={styles.cycleTitleRow}>
                <Briefcase color="#8B5CF6" size={15} />
                <Text style={[styles.cycleTitle, { color: colors.text }]}>Salary / Billing Cycle</Text>
                {currentCycle.isCurrent && (
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowCycleModal(true)}
                style={styles.allCyclesLink}
              >
                <Layers color="#8B5CF6" size={13} />
                <Text style={styles.allCyclesLinkText}>All Cycles ({availableCycles.length})</Text>
              </TouchableOpacity>
            </View>

            {/* Previous / Next Stepper */}
            <View style={styles.stepperRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={selectedCycleIndex >= availableCycles.length - 1}
                onPress={() => setSelectedCycleIndex((prev) => Math.min(availableCycles.length - 1, prev + 1))}
                style={[styles.stepperBtn, { opacity: selectedCycleIndex >= availableCycles.length - 1 ? 0.3 : 1 }]}
              >
                <ChevronLeft color={colors.text} size={18} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowCycleModal(true)}
                style={styles.cycleCenterInfo}
              >
                <Text style={[styles.cycleName, { color: colors.text }]}>{currentCycle.label}</Text>
                <Text style={[styles.cycleDates, { color: colors.textSecondary }]}>{currentCycle.subtitle}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={selectedCycleIndex <= 0}
                onPress={() => setSelectedCycleIndex((prev) => Math.max(0, prev - 1))}
                style={[styles.stepperBtn, { opacity: selectedCycleIndex <= 0 ? 0.3 : 1 }]}
              >
                <ChevronRight color={colors.text} size={18} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Custom Range Active Banner */}
        {filterType === 'custom' && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setTempFrom(customFrom)
              setTempTo(customTo)
              setShowCustomModal(true)
            }}
            style={[styles.customBanner, { backgroundColor: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}
          >
            <View style={styles.customBannerLeft}>
              <CalendarDays color="#8B5CF6" size={18} />
              <View>
                <Text style={[styles.customBannerTitle, { color: colors.text }]}>Selected Custom Window</Text>
                <Text style={[styles.customBannerSub, { color: colors.textSecondary }]}>
                  {customFrom}  ➔  {customTo}
                </Text>
              </View>
            </View>
            <Text style={styles.customBannerChange}>Edit</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ReportsSkeleton />
        ) : (
          <>
            {/* Net Savings Hero Card */}
            <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
              <Text style={[styles.cardSubText, { color: colors.textSecondary }]}>
                NET SAVINGS & SURPLUS
              </Text>
              <Text style={[styles.balanceAmount, { color: reportData.savings >= 0 ? '#10B981' : '#F43F5E' }]}>
                {currencySymbol}{reportData.savings.toLocaleString()}
              </Text>

              <View style={styles.heroSubRow}>
                <View style={styles.badgePill}>
                  <TrendingUp color="#8B5CF6" size={12} />
                  <Text style={styles.badgePillText}>{reportData.savingsRate}% Savings Velocity</Text>
                </View>
                <Text style={[styles.transactionCountText, { color: colors.textSecondary }]}>
                  {reportData.transactionsCount} entries
                </Text>
              </View>
            </View>

            {/* Income vs Expenses Grid */}
            <View style={styles.gridRow}>
              {/* Income */}
              <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <ArrowDownLeft color="#10B981" size={16} />
                  </View>
                  <Text style={[styles.pillBadge, { color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    Inflow
                  </Text>
                </View>
                <Text style={[styles.amountValue, { color: '#10B981' }]}>
                  {currencySymbol}{reportData.totalIncome.toLocaleString()}
                </Text>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Total Income</Text>
              </View>

              {/* Expense */}
              <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                    <ArrowUpRight color="#F43F5E" size={16} />
                  </View>
                  <Text style={[styles.pillBadge, { color: '#F43F5E', backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                    Outflow
                  </Text>
                </View>
                <Text style={[styles.amountValue, { color: '#F43F5E' }]}>
                  {currencySymbol}{reportData.totalExpenses.toLocaleString()}
                </Text>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
              </View>

              {/* Average Daily */}
              <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Receipt color="#F59E0B" size={16} />
                  </View>
                  <Text style={[styles.pillBadge, { color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    Velocity
                  </Text>
                </View>
                <Text style={[styles.amountValue, { color: '#F59E0B' }]}>
                  {currencySymbol}{reportData.avgDailySpend.toLocaleString()}
                </Text>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Avg Daily Spend</Text>
              </View>
            </View>

            {/* Action Export Buttons */}
            <View style={styles.actionExportRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleEmailPDFReport}
                disabled={sendingEmail}
                style={[styles.exportBtn, { backgroundColor: '#8B5CF6' }]}
              >
                {sendingEmail ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Mail color="#FFFFFF" size={15} />
                    <Text style={styles.exportBtnText}>Email PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleExportCSV}
                disabled={reportData.topCategories.length === 0}
                style={[styles.exportBtn, { backgroundColor: '#6366F1', opacity: reportData.topCategories.length === 0 ? 0.5 : 1 }]}
              >
                <Download color="#FFFFFF" size={15} />
                <Text style={styles.exportBtnText}>Export CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShareReport}
                style={[styles.exportBtn, { backgroundColor: '#10B981' }]}
              >
                <Share2 color="#FFFFFF" size={15} />
                <Text style={styles.exportBtnText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Category Contribution Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Category Expenses</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
              {reportData.topCategories.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', paddingVertical: 8 }}>
                  No expenses logged in this period yet.
                </Text>
              ) : (
                reportData.topCategories.map((c, idx) => (
                  <View key={idx} style={styles.categoryRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <CategoryIcon name={c.category} size={24} />
                      <Text style={[styles.categoryName, { color: colors.text, marginLeft: 8 }]}>{c.category}</Text>
                      <Text style={[styles.categoryAmount, { color: colors.text }]}>
                        {currencySymbol}{c.amount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${Math.min(100, c.percentage)}%`, backgroundColor: '#8B5CF6' }]} />
                    </View>
                    <Text style={[styles.percentLabel, { color: colors.textSecondary }]}>{c.percentage}% of total expenses</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Salary Cycle Selection Modal */}
      <Modal
        visible={showCycleModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowCycleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Briefcase color="#8B5CF6" size={20} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Salary Cycle</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCycleModal(false)} style={styles.modalCloseBtn}>
                <X color={colors.textSecondary} size={18} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.cycleModalDesc, { color: colors.textSecondary }]}>
              Your monthly salary cycle resets on <Text style={{ color: '#8B5CF6', fontWeight: '800' }}>Day {billingDay}</Text> of each month. Choose any cycle to view its real financial report.
            </Text>

            <ScrollView style={{ maxHeight: 360 }}>
              {availableCycles.map((cycle) => {
                const isSelected = selectedCycleIndex === cycle.index
                return (
                  <TouchableOpacity
                    key={cycle.index}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedCycleIndex(cycle.index)
                      setFilterType('cycle')
                      setShowCycleModal(false)
                    }}
                    style={[
                      styles.cycleListItem,
                      {
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : colors.surfaceGlass,
                        borderColor: isSelected ? '#8B5CF6' : colors.surfaceGlassBorder,
                      },
                    ]}
                  >
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.cycleListLabel, { color: colors.text }]}>{cycle.label}</Text>
                        {cycle.isCurrent && (
                          <View style={styles.liveTag}>
                            <Text style={styles.liveTagText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.cycleListDates, { color: colors.textSecondary }]}>{cycle.subtitle}</Text>
                    </View>
                    {isSelected && <Check color="#8B5CF6" size={18} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Date Range Selection Modal */}
      <Modal
        visible={showCustomModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar color="#8B5CF6" size={20} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Date Window</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomModal(false)} style={styles.modalCloseBtn}>
                <X color={colors.textSecondary} size={18} />
              </TouchableOpacity>
            </View>

            {/* Quick Preset Buttons */}
            <Text style={[styles.presetTitle, { color: colors.textSecondary }]}>Quick Presets</Text>
            <View style={styles.presetRow}>
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '60 Days', days: 60 },
                { label: '90 Days', days: 90 },
              ].map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    const d = new Date()
                    d.setDate(d.getDate() - preset.days)
                    setTempFrom(d.toISOString().split('T')[0])
                    setTempTo(new Date().toISOString().split('T')[0])
                  }}
                  style={[styles.presetBtn, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
                >
                  <Text style={[styles.presetBtnText, { color: colors.text }]}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* From Date Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>From Date (YYYY-MM-DD)</Text>
              <TextInput
                value={tempFrom}
                onChangeText={setTempFrom}
                placeholder="2026-01-01"
                placeholderTextColor={colors.textMuted}
                style={[styles.dateInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              />
            </View>

            {/* To Date Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>To Date (YYYY-MM-DD)</Text>
              <TextInput
                value={tempTo}
                onChangeText={setTempTo}
                placeholder="2026-12-31"
                placeholderTextColor={colors.textMuted}
                style={[styles.dateInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              />
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={applyCustomRange}
              style={styles.applyRangeBtn}
            >
              <Check color="#FFFFFF" size={18} />
              <Text style={styles.applyRangeBtnText}>Apply Date Range</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  filterScrollRow: { flexDirection: 'row', gap: 6, paddingBottom: 12, paddingRight: 16 },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterPillText: { fontSize: 11, fontWeight: '700' },
  cycleCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cycleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cycleTitle: { fontSize: 13, fontWeight: '800' },
  liveTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveTagText: { color: '#10B981', fontSize: 9, fontWeight: '800' },
  allCyclesLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  allCyclesLinkText: { color: '#8B5CF6', fontSize: 11, fontWeight: '700' },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleCenterInfo: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  cycleName: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  cycleDates: { fontSize: 11, fontWeight: '600' },
  cycleModalDesc: { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  cycleListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  cycleListLabel: { fontSize: 13, fontWeight: '700' },
  cycleListDates: { fontSize: 11, marginTop: 2 },
  customBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  customBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customBannerTitle: { fontSize: 13, fontWeight: '700' },
  customBannerSub: { fontSize: 11, marginTop: 2 },
  customBannerChange: { color: '#8B5CF6', fontSize: 12, fontWeight: '800' },
  card: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  cardSubText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  balanceAmount: { fontSize: 26, fontWeight: '900', marginBottom: 10 },
  heroSubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgePillText: { color: '#8B5CF6', fontSize: 11, fontWeight: '700' },
  transactionCountText: { fontSize: 12 },
  gridRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metricCard: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1 },
  metricHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  pillBadge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  amountValue: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  subLabel: { fontSize: 10 },
  actionExportRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  exportBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  sectionHeader: { marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  categoryRow: { marginBottom: 12 },
  categoryName: { flex: 1, fontSize: 13, fontWeight: '700' },
  categoryAmount: { fontSize: 13, fontWeight: '800' },
  progressBg: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  percentLabel: { fontSize: 10, marginTop: 3, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.08)', justifyContent: 'center', alignItems: 'center' },
  presetTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  presetBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, borderWidth: 1 },
  presetBtnText: { fontSize: 11, fontWeight: '700' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  dateInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '600' },
  applyRangeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B5CF6', paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  applyRangeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
