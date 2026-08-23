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
  Printer,
  FileText,
  Clock,
  Send,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { ReportsSkeleton } from '../components/SkeletonLoader'
import { api } from '../services/api'

// Helper: Format Date object to local YYYY-MM-DD string without UTC timezone shift
function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface PeriodItem {
  index: number
  label: string
  subtitle: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

// 1. Calculate past Salary/Billing Cycles (e.g. Day 1 or Day 5)
function calculateBillingCycles(cycleDay = 1, count = 12): PeriodItem[] {
  const cycles: PeriodItem[] = []
  const today = new Date()

  let curYear = today.getFullYear()
  let curMonth = today.getMonth() // 0-11

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

    let startDateObj: Date
    let endDateObj: Date

    if (cycleDay === 1) {
      startDateObj = new Date(cycleStartYear, cycleStartMonth, 1)
      endDateObj = new Date(cycleStartYear, cycleStartMonth + 1, 0) // Exact last day of that month
    } else {
      startDateObj = new Date(cycleStartYear, cycleStartMonth, cycleDay)
      endDateObj = new Date(cycleStartYear, cycleStartMonth + 1, cycleDay - 1)
    }

    const startStr = formatLocalDate(startDateObj)
    const endStr = formatLocalDate(endDateObj)

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

// 2. Calculate past Calendar Months
function calculatePastMonths(count = 24): PeriodItem[] {
  const months: PeriodItem[] = []
  const today = new Date()
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0)

    const startStr = formatLocalDate(start)
    const endStr = formatLocalDate(end)

    months.push({
      index: i,
      label: `${monthNames[m]} ${y}`,
      subtitle: `${startStr} to ${endStr}`,
      startDate: startStr,
      endDate: endStr,
      isCurrent: i === 0,
    })
  }
  return months
}

// 3. Calculate past Quarters (90-Day windows)
function calculatePastQuarters(count = 8): PeriodItem[] {
  const quarters: PeriodItem[] = []
  const today = new Date()
  const curYear = today.getFullYear()
  const curQ = Math.floor(today.getMonth() / 3) // 0: Q1, 1: Q2, 2: Q3, 3: Q4

  for (let i = 0; i < count; i++) {
    let q = curQ - i
    let y = curYear
    while (q < 0) {
      q += 4
      y -= 1
    }
    const startMonth = q * 3
    const start = new Date(y, startMonth, 1)
    const end = new Date(y, startMonth + 3, 0)
    const startStr = formatLocalDate(start)
    const endStr = formatLocalDate(end)

    quarters.push({
      index: i,
      label: `Q${q + 1} ${y}`,
      subtitle: `${startStr} to ${endStr}`,
      startDate: startStr,
      endDate: endStr,
      isCurrent: i === 0,
    })
  }
  return quarters
}

// 4. Calculate past Years (YTD)
function calculatePastYears(count = 5): PeriodItem[] {
  const years: PeriodItem[] = []
  const curYear = new Date().getFullYear()

  for (let i = 0; i < count; i++) {
    const y = curYear - i
    const startStr = `${y}-01-01`
    const endStr = `${y}-12-31`

    years.push({
      index: i,
      label: i === 0 ? `YTD ${y}` : `Year ${y}`,
      subtitle: `${startStr} to ${endStr}`,
      startDate: startStr,
      endDate: endStr,
      isCurrent: i === 0,
    })
  }
  return years
}

export const ReportsScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const [filterType, setFilterType] = useState<'cycle' | 'month' | 'quarter' | 'ytd' | 'custom'>('cycle')

  // Period lists & selection indices
  const billingDay = (user as any)?.billingCycleStartDay || 1
  const cycleList = useMemo(() => calculateBillingCycles(billingDay, 12), [billingDay])
  const monthList = useMemo(() => calculatePastMonths(24), [])
  const quarterList = useMemo(() => calculatePastQuarters(8), [])
  const yearList = useMemo(() => calculatePastYears(5), [])

  const [cycleIndex, setCycleIndex] = useState(0)
  const [monthIndex, setMonthIndex] = useState(0)
  const [quarterIndex, setQuarterIndex] = useState(0)
  const [yearIndex, setYearIndex] = useState(0)

  // Picker Modal State
  const [showPickerModal, setShowPickerModal] = useState(false)

  // Custom Date Range State (YYYY-MM-DD)
  const today = new Date()
  const defaultStartDate = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1))
  const defaultEndDate = formatLocalDate(today)

  const [customFrom, setCustomFrom] = useState(defaultStartDate)
  const [customTo, setCustomTo] = useState(defaultEndDate)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [tempFrom, setTempFrom] = useState(defaultStartDate)
  const [tempTo, setTempTo] = useState(defaultEndDate)

  // Export / Send Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [useCustomEmail, setUseCustomEmail] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [includeReceipts, setIncludeReceipts] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  // Report Data
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

  // Active Period Info
  const activePeriod: PeriodItem = useMemo(() => {
    if (filterType === 'cycle') return cycleList[cycleIndex] || cycleList[0]
    if (filterType === 'month') return monthList[monthIndex] || monthList[0]
    if (filterType === 'quarter') return quarterList[quarterIndex] || quarterList[0]
    if (filterType === 'ytd') return yearList[yearIndex] || yearList[0]
    return {
      index: 0,
      label: 'Custom Range',
      subtitle: `${customFrom} to ${customTo}`,
      startDate: customFrom,
      endDate: customTo,
      isCurrent: false,
    }
  }, [filterType, cycleIndex, monthIndex, quarterIndex, yearIndex, cycleList, monthList, quarterList, yearList, customFrom, customTo])

  // Current list for the picker modal
  const activeList: PeriodItem[] = useMemo(() => {
    if (filterType === 'cycle') return cycleList
    if (filterType === 'month') return monthList
    if (filterType === 'quarter') return quarterList
    if (filterType === 'ytd') return yearList
    return []
  }, [filterType, cycleList, monthList, quarterList, yearList])

  const activeIndex = useMemo(() => {
    if (filterType === 'cycle') return cycleIndex
    if (filterType === 'month') return monthIndex
    if (filterType === 'quarter') return quarterIndex
    if (filterType === 'ytd') return yearIndex
    return 0
  }, [filterType, cycleIndex, monthIndex, quarterIndex, yearIndex])

  const setActiveIndex = (idx: number) => {
    if (filterType === 'cycle') setCycleIndex(idx)
    else if (filterType === 'month') setMonthIndex(idx)
    else if (filterType === 'quarter') setQuarterIndex(idx)
    else if (filterType === 'ytd') setYearIndex(idx)
    setShowPickerModal(false)
  }

  const loadReport = async () => {
    try {
      const data = await api.getRangeSummary('custom', activePeriod.startDate, activePeriod.endDate)
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
  }, [filterType, activePeriod.startDate, activePeriod.endDate])

  const onRefresh = () => {
    setRefreshing(true)
    loadReport()
  }

  // Action: Share Summary
  const handleShareReport = async () => {
    try {
      const summaryText = `📊 FinanceTracker Pro - Official Statement\n` +
        `• Period: ${activePeriod.label} (${activePeriod.startDate} to ${activePeriod.endDate})\n` +
        `• Total Inflow: ${currencySymbol}${reportData.totalIncome.toLocaleString()}\n` +
        `• Total Outflow: ${currencySymbol}${reportData.totalExpenses.toLocaleString()}\n` +
        `• Net Surplus: ${currencySymbol}${reportData.savings.toLocaleString()} (${reportData.savingsRate}%)\n` +
        `• Total Entries: ${reportData.transactionsCount}\n\n` +
        `Generated with ExpenseTracker Pro`

      await Share.share({
        message: summaryText,
        title: `Statement-${activePeriod.startDate}_${activePeriod.endDate}`,
      })
    } catch {
      Alert.alert('Error', 'Unable to share summary.')
    }
  }

  // Action: Export CSV
  const handleExportCSV = async () => {
    const rows = [
      ['Category', 'Amount', '% of Spend'],
      ...reportData.topCategories.map((c) => [c.category, c.amount.toString(), `${c.percentage}%`]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')

    try {
      await Share.share({
        message: csv,
        title: `Statement-${activePeriod.startDate}_${activePeriod.endDate}.csv`,
      })
    } catch {
      Alert.alert('Error', 'Unable to export CSV.')
    }
  }

  // Action: Print / Preview PDF
  const handlePrintPDF = async () => {
    setGeneratingPdf(true)
    try {
      const res = await api.sendEmailReport({
        dateFrom: activePeriod.startDate,
        dateTo: activePeriod.endDate,
        type: filterType,
        includeBillAttachments: true,
        returnPdfBase64: true,
      })

      if (res.success && res.pdfBase64) {
        // Share PDF Statement
        await Share.share({
          message: `Official Financial Statement (${activePeriod.label}): ${currencySymbol}${reportData.totalIncome.toLocaleString()} Inflow, ${currencySymbol}${reportData.totalExpenses.toLocaleString()} Outflow. Net Balance: ${currencySymbol}${reportData.savings.toLocaleString()}`,
          title: res.filename || `Financial-Statement-${activePeriod.startDate}.pdf`,
        })
      } else {
        Alert.alert('Notice', 'Unable to generate PDF preview right now.')
      }
    } catch (err: any) {
      Alert.alert('Print Notice', err.message || 'Could not generate printable PDF.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  // Action: Send PDF via Email
  const handleSendEmailReport = async () => {
    const target = useCustomEmail && recipientEmail.trim() ? recipientEmail.trim() : (user?.email || '')
    if (useCustomEmail && !recipientEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid recipient email address.')
      return
    }

    setSendingEmail(true)
    try {
      const res = await api.sendEmailReport({
        dateFrom: activePeriod.startDate,
        dateTo: activePeriod.endDate,
        type: filterType,
        recipientEmail: target,
        includeBillAttachments: includeReceipts,
      })

      setShowEmailModal(false)
      if (res.success) {
        Alert.alert(
          'Email Dispatched! 📄',
          `Your official PDF Invoice & Financial Statement with bill receipts was sent to ${target}.`
        )
      } else {
        Alert.alert('Notice', res.message || 'Unable to deliver report right now.')
      }
    } catch (err: any) {
      Alert.alert('Email Notice', err.message || 'Could not dispatch statement email.')
    } finally {
      setSendingEmail(false)
    }
  }

  // Custom range presets
  const applyPreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setTempFrom(formatLocalDate(start))
    setTempTo(formatLocalDate(end))
  }

  const applyCustomRange = () => {
    setCustomFrom(tempFrom)
    setCustomTo(tempTo)
    setFilterType('custom')
    setShowCustomModal(false)
  }

  const filterPills = [
    { id: 'cycle', label: `Cycle (Day ${billingDay})`, icon: Briefcase },
    { id: 'month', label: 'Month', icon: Calendar },
    { id: 'quarter', label: '90 Days', icon: CalendarDays },
    { id: 'ytd', label: 'YTD', icon: TrendingUp },
    { id: 'custom', label: 'Custom', icon: CalendarDays },
  ]

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Reports & Statements" subtitle="Financial Analytics & Exports" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
      >
        {/* Horizontal Mode Pills Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollRow}
        >
          {filterPills.map((pill) => {
            const isSelected = filterType === pill.id
            const Icon = pill.icon
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

        {/* Universal Interactive Period Stepper Bar */}
        {filterType !== 'custom' ? (
          <View style={[styles.periodCard, { backgroundColor: colors.surfaceGlass, borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
            <View style={styles.periodHeader}>
              <View style={styles.periodTitleRow}>
                {filterType === 'cycle' && <Briefcase color="#8B5CF6" size={15} />}
                {filterType === 'month' && <Calendar color="#8B5CF6" size={15} />}
                {filterType === 'quarter' && <CalendarDays color="#8B5CF6" size={15} />}
                {filterType === 'ytd' && <TrendingUp color="#8B5CF6" size={15} />}
                <Text style={[styles.periodTitle, { color: colors.text }]}>
                  {filterType === 'cycle' && 'Salary / Billing Cycle'}
                  {filterType === 'month' && 'Monthly Statement'}
                  {filterType === 'quarter' && 'Quarterly (90-Day) Statement'}
                  {filterType === 'ytd' && 'Annual YTD Statement'}
                </Text>
                {activePeriod.isCurrent && (
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowPickerModal(true)}
                style={styles.allCyclesLink}
              >
                <Layers color="#8B5CF6" size={13} />
                <Text style={styles.allCyclesLinkText}>
                  {filterType === 'cycle' && `All Cycles (${activeList.length})`}
                  {filterType === 'month' && `All Months (${activeList.length})`}
                  {filterType === 'quarter' && `All Quarters (${activeList.length})`}
                  {filterType === 'ytd' && `All Years (${activeList.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stepper Controls */}
            <View style={styles.stepperRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={activeIndex >= activeList.length - 1}
                onPress={() => setActiveIndex(Math.min(activeList.length - 1, activeIndex + 1))}
                style={[styles.stepperBtn, { opacity: activeIndex >= activeList.length - 1 ? 0.3 : 1 }]}
              >
                <ChevronLeft color={colors.text} size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowPickerModal(true)}
                style={styles.cycleCenterInfo}
              >
                <Text style={[styles.cycleName, { color: colors.text }]}>{activePeriod.label}</Text>
                <Text style={[styles.cycleDates, { color: colors.textSecondary }]}>{activePeriod.subtitle}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={activeIndex <= 0}
                onPress={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                style={[styles.stepperBtn, { opacity: activeIndex <= 0 ? 0.3 : 1 }]}
              >
                <ChevronRight color={colors.text} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.periodCard, { backgroundColor: colors.surfaceGlass, borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
            <View style={styles.periodHeader}>
              <View style={styles.periodTitleRow}>
                <CalendarDays color="#8B5CF6" size={15} />
                <Text style={[styles.periodTitle, { color: colors.text }]}>Custom Date Window</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomModal(true)} style={styles.allCyclesLink}>
                <Calendar color="#8B5CF6" size={13} />
                <Text style={styles.allCyclesLinkText}>Edit Range</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.customBanner}>
              <Text style={[styles.cycleName, { color: colors.text }]}>{customFrom}  ➔  {customTo}</Text>
              <Text style={[styles.cycleDates, { color: colors.textSecondary }]}>Custom Date Filter Active</Text>
            </View>
          </View>
        )}

        {loading ? (
          <ReportsSkeleton />
        ) : (
          <>
            {/* Primary Net Savings & Surplus Card */}
            <View
              style={[
                styles.primaryCard,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: reportData.savings >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                },
              ]}
            >
              <Text style={[styles.primaryCardLabel, { color: colors.textSecondary }]}>
                NET SAVINGS & SURPLUS
              </Text>
              <Text
                style={[
                  styles.primaryCardAmount,
                  { color: reportData.savings >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {currencySymbol}
                {reportData.savings.toLocaleString()}
              </Text>
              <View style={styles.primaryCardFooter}>
                <View style={styles.velocityBadge}>
                  <TrendingUp size={12} color="#8B5CF6" />
                  <Text style={styles.velocityBadgeText}>
                    {reportData.savingsRate}% Savings Velocity
                  </Text>
                </View>
                <Text style={[styles.periodSummaryText, { color: colors.textMuted }]}>
                  {reportData.transactionsCount} entries
                </Text>
              </View>
            </View>

            {/* Inflow / Outflow / Daily Velocity 3-Grid */}
            <View style={styles.gridRow}>
              <View
                style={[
                  styles.gridCard,
                  { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
                ]}
              >
                <View style={styles.gridCardHeader}>
                  <View style={[styles.metricIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <ArrowDownLeft size={16} color="#10B981" />
                  </View>
                  <View style={[styles.pillBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={[styles.pillBadgeText, { color: '#10B981' }]}>Inflow</Text>
                  </View>
                </View>
                <Text style={[styles.gridAmount, { color: '#10B981' }]}>
                  {currencySymbol}
                  {reportData.totalIncome.toLocaleString()}
                </Text>
                <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Total Income</Text>
              </View>

              <View
                style={[
                  styles.gridCard,
                  { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
                ]}
              >
                <View style={styles.gridCardHeader}>
                  <View style={[styles.metricIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <ArrowUpRight size={16} color="#EF4444" />
                  </View>
                  <View style={[styles.pillBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Text style={[styles.pillBadgeText, { color: '#EF4444' }]}>Outflow</Text>
                  </View>
                </View>
                <Text style={[styles.gridAmount, { color: '#EF4444' }]}>
                  {currencySymbol}
                  {reportData.totalExpenses.toLocaleString()}
                </Text>
                <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
              </View>

              <View
                style={[
                  styles.gridCard,
                  { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
                ]}
              >
                <View style={styles.gridCardHeader}>
                  <View style={[styles.metricIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Receipt size={16} color="#F59E0B" />
                  </View>
                  <View style={[styles.pillBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Text style={[styles.pillBadgeText, { color: '#F59E0B' }]}>Velocity</Text>
                  </View>
                </View>
                <Text style={[styles.gridAmount, { color: '#F59E0B' }]}>
                  {currencySymbol}
                  {reportData.avgDailySpend.toLocaleString()}
                </Text>
                <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Avg Daily Spend</Text>
              </View>
            </View>

            {/* Action Buttons Row: Email PDF, Print PDF, Export CSV, Share */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowEmailModal(true)}
                style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
              >
                <Mail color="#FFFFFF" size={15} />
                <Text style={styles.actionBtnText}>Email PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePrintPDF}
                disabled={generatingPdf}
                style={[styles.actionBtn, { backgroundColor: '#0284C7' }]}
              >
                {generatingPdf ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Printer color="#FFFFFF" size={15} />
                    <Text style={styles.actionBtnText}>Print PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleExportCSV}
                style={[styles.actionBtn, { backgroundColor: '#4F46E5' }]}
              >
                <Download color="#FFFFFF" size={15} />
                <Text style={styles.actionBtnText}>CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShareReport}
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
              >
                <Share2 color="#FFFFFF" size={15} />
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Category Breakdown Section */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Category Expenses</Text>
            {reportData.topCategories.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
                ]}
              >
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No expenses logged in this period yet.
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.categoriesContainer,
                  { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
                ]}
              >
                {reportData.topCategories.map((cat, idx) => (
                  <View key={cat.category + idx} style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <CategoryIcon name={cat.category} size={18} color="#8B5CF6" />
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{cat.category}</Text>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${Math.min(100, Math.max(8, cat.percentage))}%`,
                                backgroundColor: idx === 0 ? '#EF4444' : idx === 1 ? '#F59E0B' : '#8B5CF6',
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={[styles.categoryAmount, { color: colors.text }]}>
                        {currencySymbol}
                        {cat.amount.toLocaleString()}
                      </Text>
                      <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>
                        {cat.percentage}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal 1: Period Picker Modal (All Cycles, All Months, All Quarters, All Years) */}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {filterType === 'cycle' && 'Select Salary / Billing Cycle'}
                {filterType === 'month' && 'Select Month Statement'}
                {filterType === 'quarter' && 'Select Quarter'}
                {filterType === 'ytd' && 'Select Year'}
              </Text>
              <TouchableOpacity onPress={() => setShowPickerModal(false)} style={styles.closeBtn}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {activeList.map((item) => {
                const isCurrentItem = item.index === activeIndex
                return (
                  <TouchableOpacity
                    key={item.label + item.index}
                    activeOpacity={0.7}
                    onPress={() => setActiveIndex(item.index)}
                    style={[
                      styles.cycleListItem,
                      {
                        backgroundColor: isCurrentItem ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        borderColor: isCurrentItem ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                      },
                    ]}
                  >
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.cycleItemLabel, { color: isCurrentItem ? '#8B5CF6' : colors.text }]}>
                          {item.label}
                        </Text>
                        {item.isCurrent && (
                          <View style={styles.liveTagSmall}>
                            <Text style={styles.liveTagTextSmall}>CURRENT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.cycleItemSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                    </View>
                    {isCurrentItem && <Check color="#8B5CF6" size={18} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Send Statement Email Modal (Registered vs Custom Email + Bills Toggle) */}
      <Modal
        visible={showEmailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileText color="#8B5CF6" size={20} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Email Financial Report</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEmailModal(false)} style={styles.closeBtn}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Official invoice & statement for {activePeriod.label} ({activePeriod.startDate} to {activePeriod.endDate}).
            </Text>

            {/* Destination Selection */}
            <View style={styles.emailOptionContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setUseCustomEmail(false)}
                style={[
                  styles.emailChoiceRow,
                  !useCustomEmail && { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
                ]}
              >
                <View style={[styles.radioCircle, !useCustomEmail && styles.radioCircleActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emailChoiceTitle, { color: colors.text }]}>Registered Account Email</Text>
                  <Text style={[styles.emailChoiceSub, { color: colors.textSecondary }]}>{user?.email || 'Your account email'}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setUseCustomEmail(true)}
                style={[
                  styles.emailChoiceRow,
                  useCustomEmail && { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
                ]}
              >
                <View style={[styles.radioCircle, useCustomEmail && styles.radioCircleActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emailChoiceTitle, { color: colors.text }]}>Custom Recipient Email</Text>
                  <Text style={[styles.emailChoiceSub, { color: colors.textSecondary }]}>Accountant, Employer, or Personal</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Custom Email Input */}
            {useCustomEmail && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Recipient Email Address</Text>
                <TextInput
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  placeholder="e.g. ca@financefirm.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.dateInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                />
              </View>
            )}

            {/* Receipts toggle */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIncludeReceipts(!includeReceipts)}
              style={styles.toggleReceiptsRow}
            >
              <View style={[styles.checkboxBox, includeReceipts && styles.checkboxBoxActive]}>
                {includeReceipts && <Check color="#FFFFFF" size={14} />}
              </View>
              <Text style={[styles.toggleReceiptsText, { color: colors.text }]}>
                Attach Cloudflare R2 Bill & Receipt Images
              </Text>
            </TouchableOpacity>

            {/* Send Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={sendingEmail}
              onPress={handleSendEmailReport}
              style={[styles.applyRangeBtn, { marginTop: 16 }]}
            >
              {sendingEmail ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Send color="#FFFFFF" size={18} />
                  <Text style={styles.applyRangeBtnText}>Send Financial Statement</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Custom Date Range Modal */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar color="#8B5CF6" size={20} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Date Filter</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomModal(false)} style={styles.closeBtn}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            {/* Presets */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Quick Presets</Text>
            <View style={styles.presetRow}>
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '60 Days', days: 60 },
                { label: '90 Days', days: 90 },
              ].map((p) => (
                <TouchableOpacity
                  key={p.days}
                  onPress={() => applyPreset(p.days)}
                  style={[styles.presetBtn, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
                >
                  <Text style={[styles.presetBtnText, { color: colors.text }]}>{p.label}</Text>
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
  filterScrollRow: { flexDirection: 'row', gap: 6, paddingBottom: 12, paddingRight: 32 },
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
  periodCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  periodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  periodTitle: { fontSize: 13, fontWeight: '700' },
  liveTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
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
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 6,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleCenterInfo: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  cycleName: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  cycleDates: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  customBanner: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
  },
  primaryCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  primaryCardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  primaryCardAmount: { fontSize: 32, fontWeight: '900', marginBottom: 12 },
  primaryCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  velocityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  velocityBadgeText: { color: '#8B5CF6', fontSize: 12, fontWeight: '700' },
  periodSummaryText: { fontSize: 12, fontWeight: '600' },
  gridRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  gridCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  gridCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  pillBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  pillBadgeText: { fontSize: 9, fontWeight: '800' },
  gridAmount: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  gridLabel: { fontSize: 10, fontWeight: '600' },
  actionsContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  emptyCard: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 13, fontWeight: '500' },
  categoriesContainer: { padding: 14, borderRadius: 18, borderWidth: 1, gap: 12, marginBottom: 20 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  categoryInfo: { flex: 1, marginRight: 12 },
  categoryName: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  progressBarBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  categoryRight: { alignItems: 'flex-end' },
  categoryAmount: { fontSize: 13, fontWeight: '800' },
  categoryPercent: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalSubtitle: { fontSize: 12, lineHeight: 16, marginBottom: 14 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  cycleItemLabel: { fontSize: 13, fontWeight: '700' },
  cycleItemSubtitle: { fontSize: 11, marginTop: 2 },
  liveTagSmall: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  liveTagTextSmall: { color: '#10B981', fontSize: 8, fontWeight: '800' },
  emailOptionContainer: { gap: 8, marginBottom: 12 },
  emailChoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6B7280',
  },
  radioCircleActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6',
  },
  emailChoiceTitle: { fontSize: 13, fontWeight: '700' },
  emailChoiceSub: { fontSize: 11, marginTop: 1 },
  toggleReceiptsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  toggleReceiptsText: { fontSize: 12, fontWeight: '600' },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetBtnText: { fontSize: 11, fontWeight: '700' },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  dateInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  applyRangeBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  applyRangeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
