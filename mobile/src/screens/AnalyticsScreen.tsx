import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Heart,
  ArrowDown,
  TrendingUp,
  Info,
  BarChart3,
  Building2,
  PieChart,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

export const AnalyticsScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const categories = [
    { name: 'Housing & Rent', amount: 4500, percentage: 43, color: '#8B5CF6' },
    { name: 'Food & Groceries', amount: 3200, percentage: 31, color: '#10B981' },
    { name: 'Bills & Utilities', amount: 1199, percentage: 12, color: '#06B6D4' },
    { name: 'Travel & Commute', amount: 900, percentage: 9, color: '#F59E0B' },
    { name: 'Entertainment & Subscriptions', amount: 601, percentage: 5, color: '#F43F5E' },
  ]

  const paymentModes = [
    { mode: 'UPI (GPay / PhonePe)', percentage: 62, amount: 6448, color: '#10B981' },
    { mode: 'Credit Card', percentage: 24, amount: 2496, color: '#8B5CF6' },
    { mode: 'NetBanking / IMPS', percentage: 14, amount: 1456, color: '#06B6D4' },
  ]

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Analytics" onProfilePress={() => navigation?.navigate('Settings')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Financial Health Card (Exact image 4 style) */}
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View style={styles.heartIconBox}>
              <Heart color="#FFFFFF" size={16} fill="#FFFFFF" />
            </View>
            <View style={styles.pillHealth}>
              <Text style={styles.pillHealthText}>Health</Text>
              <Info color="rgba(139, 92, 246, 0.7)" size={10} />
            </View>
          </View>
          <Text style={[styles.healthPercentage, { color: colors.text }]}>70%</Text>
          <Text style={[styles.cardSubText, { color: colors.textSecondary }]}>Financial Health</Text>
        </View>

        {/* 2. Income & Expense 2-Column (Exact image 4 style) */}
        <View style={styles.row2Col}>
          {/* Income */}
          <View style={[styles.statHalfCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.cardHeader}>
              <View style={styles.incomeIconBox}>
                <Text style={styles.rupeeIconText}>{currencySymbol}</Text>
              </View>
              <View style={styles.pillIncome}>
                <Text style={styles.pillIncomeText}>Income</Text>
                <Info color="rgba(16, 185, 129, 0.7)" size={10} />
              </View>
            </View>
            <Text style={[styles.halfCardValue, { color: '#10B981' }]}>
              {currencySymbol}15,100
            </Text>
            <Text style={[styles.cardSubText, { color: colors.textSecondary }]}>Total Income</Text>
          </View>

          {/* Expense */}
          <View style={[styles.statHalfCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.cardHeader}>
              <View style={styles.expenseIconBox}>
                <ArrowDown color="#FFFFFF" size={16} strokeWidth={2.5} />
              </View>
              <View style={styles.pillExpense}>
                <Text style={styles.pillExpenseText}>Expense</Text>
                <Info color="rgba(244, 63, 94, 0.7)" size={10} />
              </View>
            </View>
            <Text style={[styles.halfCardValue, { color: '#F43F5E' }]}>
              {currencySymbol}10,400
            </Text>
            <Text style={[styles.cardSubText, { color: colors.textSecondary }]}>Total Expenses</Text>
          </View>
        </View>

        {/* 3. Net Savings Card (Exact image 4 style) */}
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View style={styles.savingsIconBox}>
              <TrendingUp color="#FFFFFF" size={16} />
            </View>
            <View style={styles.pillSavings}>
              <Text style={styles.pillSavingsText}>Savings</Text>
              <Info color="rgba(59, 130, 246, 0.7)" size={10} />
            </View>
          </View>
          <Text style={[styles.savingsAmount, { color: '#3B82F6' }]}>
            {currencySymbol}4,700
          </Text>
          <Text style={[styles.cardSubText, { color: colors.textSecondary }]}>Net Savings</Text>
        </View>

        {/* 4. Monthly Trend Chart Card (Exact image 4 style) */}
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Monthly Trend</Text>
            <View style={styles.chartIconCircle}>
              <BarChart3 color="#FFFFFF" size={16} />
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F43F5E' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>expenses</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>savings</Text>
            </View>
          </View>

          {/* Mock Trend Chart Visualizer */}
          <View style={styles.chartVisual}>
            <View style={styles.yAxis}>
              <Text style={[styles.yAxisText, { color: colors.textMuted }]}>16000—</Text>
              <Text style={[styles.yAxisText, { color: colors.textMuted }]}>8000—</Text>
              <Text style={[styles.yAxisText, { color: colors.textMuted }]}>0—</Text>
            </View>
            <View style={styles.barsGroup}>
              {/* Bar 1 */}
              <View style={styles.singleBarCol}>
                <View style={[styles.bar, { height: 110, backgroundColor: '#10B981' }]} />
                <View style={[styles.bar, { height: 75, backgroundColor: '#F43F5E' }]} />
                <View style={[styles.bar, { height: 35, backgroundColor: '#8B5CF6' }]} />
              </View>
              {/* Bar 2 */}
              <View style={styles.singleBarCol}>
                <View style={[styles.bar, { height: 120, backgroundColor: '#10B981' }]} />
                <View style={[styles.bar, { height: 80, backgroundColor: '#F43F5E' }]} />
                <View style={[styles.bar, { height: 40, backgroundColor: '#8B5CF6' }]} />
              </View>
              {/* Bar 3 (Current) */}
              <View style={styles.singleBarCol}>
                <View style={[styles.bar, { height: 130, backgroundColor: '#10B981' }]} />
                <View style={[styles.bar, { height: 90, backgroundColor: '#F43F5E' }]} />
                <View style={[styles.bar, { height: 40, backgroundColor: '#8B5CF6' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 5. Category Breakdown */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Category Distribution</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          {categories.map((c, idx) => (
            <View key={idx} style={styles.categoryItem}>
              <View style={styles.catHeader}>
                <Text style={[styles.catName, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.catAmount, { color: colors.text }]}>
                  {currencySymbol}{c.amount.toLocaleString()} ({c.percentage}%)
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.inputBg }]}>
                <View style={[styles.progressBar, { width: `${c.percentage}%`, backgroundColor: c.color }]} />
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
  scrollContent: { padding: 16, paddingBottom: 80 },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heartIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillHealthText: { color: '#8B5CF6', fontSize: 10, fontWeight: '800' },
  healthPercentage: { fontSize: 24, fontWeight: '900' },
  cardSubText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  row2Col: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statHalfCard: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  incomeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rupeeIconText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  pillIncome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillIncomeText: { color: '#10B981', fontSize: 10, fontWeight: '800' },
  expenseIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F43F5E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillExpense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillExpenseText: { color: '#F43F5E', fontSize: 10, fontWeight: '800' },
  halfCardValue: { fontSize: 20, fontWeight: '900' },
  savingsIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSavings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillSavingsText: { color: '#3B82F6', fontSize: 10, fontWeight: '800' },
  savingsAmount: { fontSize: 24, fontWeight: '900' },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: { fontSize: 14, fontWeight: '800' },
  chartIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 11, fontWeight: '600' },
  chartVisual: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
  },
  yAxis: {
    height: '100%',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  yAxisText: { fontSize: 9 },
  barsGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  singleBarCol: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bar: {
    width: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 10,
  },
  categoryItem: { marginBottom: 12 },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catName: { fontSize: 12, fontWeight: '700' },
  catAmount: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 3 },
})
