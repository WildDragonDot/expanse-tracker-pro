import React, { useEffect, useState } from 'react'
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
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { ReportsSkeleton } from '../components/SkeletonLoader'
import { api } from '../services/api'

export const ReportsScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'ytd' | 'custom'>('month')
  
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

  const loadReport = async () => {
    try {
      const data = await api.getRangeSummary(
        dateRange,
        dateRange === 'custom' ? customFrom : undefined,
        dateRange === 'custom' ? customTo : undefined
      )
      setReportData(data)
    } catch {
      setReportData({ totalIncome: 0, totalExpenses: 0, savings: 0, savingsRate: 0, avgDailySpend: 0, transactionsCount: 0, topCategories: [] })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadReport()
  }, [dateRange, customFrom, customTo])

  const onRefresh = () => {
    setRefreshing(true)
    loadReport()
  }

  const handleShareReport = async () => {
    try {
      const rangeLabel = dateRange === 'custom' ? `${customFrom} to ${customTo}` : dateRange.toUpperCase()
      const summaryText = `📊 FinanceTracker Pro - Financial Statement (${rangeLabel})\n` +
        `• Total Inflow: ${currencySymbol}${reportData.totalIncome.toLocaleString()}\n` +
        `• Total Outflow: ${currencySymbol}${reportData.totalExpenses.toLocaleString()}\n` +
        `• Net Savings: ${currencySymbol}${reportData.savings.toLocaleString()} (${reportData.savingsRate}%)\n` +
        `• Transactions: ${reportData.transactionsCount}\n\n` +
        `Generated with FinanceTracker Pro`

      await Share.share({
        message: summaryText,
        title: 'Financial Statement Report',
      })
    } catch (e) {
      Alert.alert('Error', 'Unable to share report.')
    }
  }

  const [sendingEmail, setSendingEmail] = useState(false)

  const handleEmailPDFReport = async () => {
    setSendingEmail(true)
    try {
      let dateFrom = defaultStartDate
      let dateTo = defaultEndDate

      if (dateRange === 'custom') {
        dateFrom = customFrom
        dateTo = customTo
      } else if (dateRange === 'quarter') {
        const d = new Date()
        d.setDate(d.getDate() - 90)
        dateFrom = d.toISOString().split('T')[0]
      } else if (dateRange === 'ytd') {
        dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      }

      const res = await api.sendEmailReport({
        dateFrom,
        dateTo,
        type: dateRange === 'month' ? 'monthly' : 'custom',
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
      const fileLabel = dateRange === 'custom' ? `${customFrom}_${customTo}` : dateRange
      await Share.share({ message: csv, title: `Statement-${fileLabel}.csv` })
    } catch (e) {
      Alert.alert('Error', 'Unable to export CSV.')
    }
  }

  const applyCustomRange = () => {
    setCustomFrom(tempFrom)
    setCustomTo(tempTo)
    setDateRange('custom')
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
        {/* Date Filter Pills */}
        <View style={styles.filterPillsRow}>
          {[
            { id: 'month', label: 'Month', isCustom: false },
            { id: 'quarter', label: '90 Days', isCustom: false },
            { id: 'ytd', label: 'YTD', isCustom: false },
            { id: 'custom', label: dateRange === 'custom' ? `${customFrom.slice(5)}...` : 'Custom', isCustom: true },
          ].map((pill) => (
            <TouchableOpacity
              key={pill.id}
              activeOpacity={0.7}
              onPress={() => {
                setDateRange(pill.id as any)
                if (pill.id === 'custom') {
                  setTempFrom(customFrom)
                  setTempTo(customTo)
                }
              }}
              style={[
                styles.filterPill,
                {
                  backgroundColor: dateRange === pill.id ? '#8B5CF6' : colors.surfaceGlass,
                  borderColor: dateRange === pill.id ? '#8B5CF6' : colors.surfaceGlassBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                },
              ]}
            >
              {pill.isCustom && <Calendar size={12} color={dateRange === pill.id ? '#FFFFFF' : '#8B5CF6'} />}
              <Text
                style={[
                  styles.filterPillText,
                  { color: dateRange === pill.id ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Range Inline Panel */}
        {dateRange === 'custom' && (
          <View style={[styles.customInlineCard, { backgroundColor: colors.surfaceGlass, borderColor: 'rgba(139, 92, 246, 0.35)' }]}>
            <View style={styles.customInlineHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CalendarDays color="#8B5CF6" size={16} />
                <Text style={[styles.customInlineTitle, { color: colors.text }]}>Custom Date Window</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{customFrom} to {customTo}</Text>
            </View>

            {/* Quick Presets */}
            <View style={styles.inlinePresetRow}>
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '60 Days', days: 60 },
                { label: '90 Days', days: 90 },
              ].map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    const d = new Date()
                    d.setDate(d.getDate() - p.days)
                    const fromStr = d.toISOString().split('T')[0]
                    const toStr = new Date().toISOString().split('T')[0]
                    setCustomFrom(fromStr)
                    setCustomTo(toStr)
                    setTempFrom(fromStr)
                    setTempTo(toStr)
                  }}
                  style={[styles.inlinePresetBtn, { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: colors.surfaceGlassBorder }]}
                >
                  <Text style={[styles.inlinePresetText, { color: colors.text }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input Row */}
            <View style={styles.inlineInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inlineLabel, { color: colors.textSecondary }]}>From (YYYY-MM-DD)</Text>
                <TextInput
                  value={tempFrom}
                  onChangeText={setTempFrom}
                  style={[styles.inlineDateInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inlineLabel, { color: colors.textSecondary }]}>To (YYYY-MM-DD)</Text>
                <TextInput
                  value={tempTo}
                  onChangeText={setTempTo}
                  style={[styles.inlineDateInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setCustomFrom(tempFrom)
                  setCustomTo(tempTo)
                }}
                style={styles.inlineApplyBtn}
              >
                <Check color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>
          </View>
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
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Custom Date Range</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomModal(false)} style={styles.modalCloseBtn}>
                <X color={colors.textSecondary} size={18} />
              </TouchableOpacity>
            </View>

            {/* Quick Preset Buttons */}
            <Text style={[styles.presetTitle, { color: colors.textSecondary }]}>Quick Presets</Text>
            <View style={styles.presetRow}>
              {[
                { label: 'Last 7 Days', days: 7 },
                { label: 'Last 30 Days', days: 30 },
                { label: 'Last 60 Days', days: 60 },
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
  filterPillsRow: { flexDirection: 'row', gap: 6, paddingBottom: 12 },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterPillText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  customInlineCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  customInlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customInlineTitle: { fontSize: 13, fontWeight: '800' },
  inlinePresetRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  inlinePresetBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  inlinePresetText: { fontSize: 11, fontWeight: '700' },
  inlineInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  inlineLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  inlineDateInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  inlineApplyBtn: {
    width: 38,
    height: 38,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
