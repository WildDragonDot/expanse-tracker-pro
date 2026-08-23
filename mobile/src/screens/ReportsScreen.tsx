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
} from 'react-native'
import {
  Download,
  Share2,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
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

  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'ytd'>('month')
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
      const data = await api.getRangeSummary(dateRange)
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
  }, [dateRange])

  const onRefresh = () => {
    setRefreshing(true)
    loadReport()
  }

  const handleShareReport = async () => {
    try {
      const summaryText = `📊 FinanceTracker Pro - Financial Statement (${dateRange.toUpperCase()})\n` +
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

  const handleExportCSV = async () => {
    const rows = [
      ['Category', 'Amount', '% of Spend'],
      ...reportData.topCategories.map((c) => [c.category, c.amount.toString(), `${c.percentage}%`]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')

    try {
      // No file-system access is bundled in this app — sharing the real CSV text lets the
      // user save it from the native share sheet (e.g. "Save to Files") instead of us
      // falsely claiming a file was already written to disk.
      await Share.share({ message: csv, title: `Statement-${dateRange}.csv` })
    } catch (e) {
      Alert.alert('Error', 'Unable to export CSV.')
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Financial Reports" onProfilePress={() => navigation?.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Date Filter Pills */}
        <View style={styles.filterPillsRow}>
          {[
            { id: 'month', label: 'This Month' },
            { id: 'quarter', label: 'Last 90 Days' },
            { id: 'ytd', label: `YTD ${new Date().getFullYear()}` },
          ].map((pill) => (
            <TouchableOpacity
              key={pill.id}
              activeOpacity={0.8}
              onPress={() => setDateRange(pill.id as any)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: dateRange === pill.id ? '#8B5CF6' : colors.surfaceGlass,
                  borderColor: dateRange === pill.id ? '#8B5CF6' : colors.surfaceGlassBorder,
                },
              ]}
            >
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

        {loading ? (
          <ReportsSkeleton />
        ) : (
          <>
            {/* 2-Column Summary Cards */}
            <View style={styles.twoCardsRow}>
              {/* Inflows */}
              <View style={[styles.summaryCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <View style={styles.cardHeader}>
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
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Total Credits</Text>
              </View>

              {/* Outflows */}
              <View style={[styles.summaryCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <View style={styles.cardHeader}>
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
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Total Debits</Text>
              </View>
            </View>

            <View style={styles.twoCardsRow}>
              {/* Net Savings */}
              <View style={[styles.summaryCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <TrendingUp color="#3B82F6" size={16} />
                  </View>
                  <Text style={[styles.pillBadge, { color: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    {reportData.savingsRate}%
                  </Text>
                </View>
                <Text style={[styles.amountValue, { color: '#3B82F6' }]}>
                  {currencySymbol}{reportData.savings.toLocaleString()}
                </Text>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Net Savings</Text>
              </View>

              {/* Daily Spend */}
              <View style={[styles.summaryCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <View style={styles.cardHeader}>
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
                onPress={handleExportCSV}
                disabled={reportData.topCategories.length === 0}
                style={[styles.exportBtn, { backgroundColor: '#6366F1', opacity: reportData.topCategories.length === 0 ? 0.5 : 1 }]}
              >
                <Download color="#FFFFFF" size={16} />
                <Text style={styles.exportBtnText}>Export CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShareReport}
                style={[styles.exportBtn, { backgroundColor: '#10B981' }]}
              >
                <Share2 color="#FFFFFF" size={16} />
                <Text style={styles.exportBtnText}>Share Statement</Text>
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
                      <CategoryIcon name={c.category} size={14} containerSize={26} style={{ marginRight: 8 }} />
                      <View style={styles.catInfo}>
                        <Text style={[styles.catName, { color: colors.text }]}>{c.category}</Text>
                        <Text style={[styles.catAmount, { color: colors.text }]}>
                          {currencySymbol}{c.amount.toLocaleString()} ({c.percentage}%)
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.track, { backgroundColor: colors.inputBg }]}>
                      <View style={[styles.fill, { width: `${c.percentage}%`, backgroundColor: '#8B5CF6' }]} />
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterPillText: { fontSize: 11, fontWeight: '700' },
  twoCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  amountValue: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  subLabel: { fontSize: 11, fontWeight: '600' },
  actionExportRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  exportBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryRow: { marginBottom: 14 },
  catInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catName: { fontSize: 13, fontWeight: '700' },
  catAmount: { fontSize: 12, fontWeight: '800' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
})
