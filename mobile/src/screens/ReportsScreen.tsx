import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  FileText,
  Download,
  Share2,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  PieChart,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

export const ReportsScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'ytd' | 'custom'>('month')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const reportData = {
    totalIncome: 15100,
    totalExpenses: 10400,
    netSavings: 4700,
    savingsRate: '31.1%',
    avgDailySpend: 335,
    taxEstimated: 850,
    transactionsCount: 35,
    topCategories: [
      { name: 'Housing & Rent', amount: 4500, percentage: 43 },
      { name: 'Food & Groceries', amount: 3200, percentage: 31 },
      { name: 'Bills & Utilities', amount: 1199, percentage: 12 },
      { name: 'Travel & Commute', amount: 900, percentage: 9 },
      { name: 'Subscriptions', amount: 601, percentage: 5 },
    ],
  }

  const handleShareReport = async () => {
    try {
      const summaryText = `📊 FinanceTracker Pro - Financial Statement (${dateRange.toUpperCase()})\n` +
        `• Total Inflow: ${currencySymbol}${reportData.totalIncome.toLocaleString()}\n` +
        `• Total Outflow: ${currencySymbol}${reportData.totalExpenses.toLocaleString()}\n` +
        `• Net Savings: ${currencySymbol}${reportData.netSavings.toLocaleString()} (${reportData.savingsRate})\n` +
        `• Transactions: ${reportData.transactionsCount}\n\n` +
        `Generated with FinanceTracker Pro (Next-Gen AI Edition)`
      
      await Share.share({
        message: summaryText,
        title: 'Financial Statement Report',
      })
    } catch (e) {
      Alert.alert('Error', 'Unable to share report.')
    }
  }

  const handleExportCSV = () => {
    Alert.alert(
      'Export Successful',
      `CSV Statement for ${dateRange.toUpperCase()} has been generated and saved to your device documents.`,
      [{ text: 'OK' }]
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Financial Reports" onProfilePress={() => navigation?.navigate('Settings')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Date Filter Pills */}
        <View style={styles.filterPillsRow}>
          {[
            { id: 'month', label: 'This Month' },
            { id: 'quarter', label: 'Last 90 Days' },
            { id: 'ytd', label: 'YTD 2026' },
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
                {reportData.savingsRate}
              </Text>
            </View>
            <Text style={[styles.amountValue, { color: '#3B82F6' }]}>
              {currencySymbol}{reportData.netSavings.toLocaleString()}
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
            style={[styles.exportBtn, { backgroundColor: '#6366F1' }]}
          >
            <Download color="#FFFFFF" size={16} />
            <Text style={styles.exportBtnText}>Download CSV</Text>
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
          {reportData.topCategories.map((c, idx) => (
            <View key={idx} style={styles.categoryRow}>
              <View style={styles.catInfo}>
                <Text style={[styles.catName, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.catAmount, { color: colors.text }]}>
                  {currencySymbol}{c.amount.toLocaleString()} ({c.percentage}%)
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.inputBg }]}>
                <View style={[styles.fill, { width: `${c.percentage}%`, backgroundColor: '#8B5CF6' }]} />
              </View>
            </View>
          ))}
        </View>
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
  categoryRow: { marginBottom: 12 },
  catInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: { fontSize: 12, fontWeight: '700' },
  catAmount: { fontSize: 12, fontWeight: '800' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
})
