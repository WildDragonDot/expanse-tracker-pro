import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import {
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  CreditCard,
  Landmark,
  Activity,
  Layers,
  PiggyBank,
  Calendar,
  DollarSign,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryDetailsModal } from '../components/CategoryDetailsModal'
import { SvgLineChart } from '../components/charts/SvgLineChart'
import { SvgAreaChart } from '../components/charts/SvgAreaChart'
import { SvgDonutChart } from '../components/charts/SvgDonutChart'
import { SvgBarChart } from '../components/charts/SvgBarChart'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { AnalyticsSkeleton } from '../components/SkeletonLoader'
import { api } from '../services/api'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CHART_WIDTH = SCREEN_WIDTH - 64

type Insights = Awaited<ReturnType<typeof api.getAnalyticsInsights>>

export const AnalyticsScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const loadInsights = async () => {
    try {
      const data = await api.getAnalyticsInsights(6)
      setInsights(data)
    } catch {
      setInsights(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadInsights()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadInsights()
  }

  const handleCategoryPress = (cat: any) => {
    setSelectedCategory(cat)
    setCategoryModalVisible(true)
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderBar title="Analytics" onProfilePress={() => navigation?.navigate('Settings')} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <AnalyticsSkeleton />
        </ScrollView>
      </View>
    )
  }

  if (!insights) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderBar title="Analytics" onProfilePress={() => navigation?.navigate('Settings')} />
        <View style={styles.emptyState}>
          <Activity color={colors.textMuted} size={32} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Couldn't load analytics right now. Pull down to retry.
          </Text>
        </View>
      </View>
    )
  }

  const hasAnyData = insights.monthlyTrend.some((m) => m.income > 0 || m.expenses > 0)
  const months = insights.monthlyTrend.map((m) => m.label)
  const monthlyTrendSeries = [
    { key: 'income', color: '#10B981', values: insights.monthlyTrend.map((m) => m.income) },
    { key: 'expenses', color: '#EF4444', values: insights.monthlyTrend.map((m) => m.expenses) },
    { key: 'savings', color: '#8B5CF6', values: insights.monthlyTrend.map((m) => m.savings) },
  ]
  const savingsRateSeries = [
    { key: 'savingsRate', color: '#06B6D4', values: insights.monthlyTrend.map((m) => m.savingsRate) },
  ]
  const categoryDonutData = insights.categoryBreakdown.map((c) => ({ name: c.name, value: c.amount, color: c.color }))
  const incomeVsExpenseData = insights.monthlyTrend.map((m) => ({
    label: m.label,
    values: [
      { key: 'in', value: m.income, color: '#10B981' },
      { key: 'ex', value: m.expenses, color: '#EF4444' },
    ],
  }))
  const paymentMethodsBarData = insights.paymentMethods.map((p) => ({
    label: p.label,
    values: [{ key: p.label, value: p.amount, color: p.color }],
  }))
  const weeklyBarData = insights.weeklySpending.map((w) => ({
    label: w.label,
    values: [{ key: w.label, value: w.amount, color: '#6366F1' }],
  }))
  const dailySpendingLabels = insights.dailySpendingPattern.map((d) => d.label)
  const dailySpendingValues = insights.dailySpendingPattern.map((d) => d.amount)

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Analytics" onProfilePress={() => navigation?.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!hasAnyData && (
          <View style={[styles.noticeBanner, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              No expenses or income logged in the last 6 months yet. Add some to see your real trends here.
            </Text>
          </View>
        )}

        {/* 1. Top Stat Cards (2x2 Grid) */}
        <View style={styles.twoCardsRow}>
          <View style={[styles.statCardHalf, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.cardHeaderSmall}>
              <View style={[styles.iconBoxSmall, { backgroundColor: '#10B981' }]}>
                <ArrowUp color="#FFFFFF" size={14} />
              </View>
              <View style={styles.pillGreen}>
                <Text style={styles.pillGreenText}>Income</Text>
              </View>
            </View>
            <Text style={[styles.statAmount, { color: '#10B981' }]}>
              {currencySymbol}{insights.currentMonth.income.toLocaleString()}
            </Text>
            <Text style={[styles.statSubText, { color: colors.textMuted }]}>Total Income</Text>
          </View>

          <View style={[styles.statCardHalf, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.cardHeaderSmall}>
              <View style={[styles.iconBoxSmall, { backgroundColor: '#EF4444' }]}>
                <ArrowDown color="#FFFFFF" size={14} />
              </View>
              <View style={styles.pillRed}>
                <Text style={styles.pillRedText}>Expense</Text>
              </View>
            </View>
            <Text style={[styles.statAmount, { color: '#EF4444' }]}>
              {currencySymbol}{insights.currentMonth.expenses.toLocaleString()}
            </Text>
            <Text style={[styles.statSubText, { color: colors.textMuted }]}>Total Expenses</Text>
          </View>
        </View>

        <View style={styles.twoCardsRow}>
          <View style={[styles.statCardHalf, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.cardHeaderSmall}>
              <View style={[styles.iconBoxSmall, { backgroundColor: '#3B82F6' }]}>
                <ArrowUpRight color="#FFFFFF" size={14} />
              </View>
              <View style={styles.pillBlue}>
                <Text style={styles.pillBlueText}>Savings</Text>
              </View>
            </View>
            <Text style={[styles.statAmount, { color: '#3B82F6' }]}>
              {currencySymbol}{insights.currentMonth.savings.toLocaleString()}
            </Text>
            <Text style={[styles.statSubText, { color: colors.textMuted }]}>{insights.currentMonth.savingsRate}% Net Rate</Text>
          </View>

          <View style={[styles.statCardHalf, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.cardHeaderSmall}>
              <View style={[styles.iconBoxSmall, { backgroundColor: '#8B5CF6' }]}>
                <ShieldCheck color="#FFFFFF" size={14} />
              </View>
              <View style={styles.pillPurple}>
                <Text style={styles.pillPurpleText}>Score</Text>
              </View>
            </View>
            <Text style={[styles.statAmount, { color: '#8B5CF6' }]}>{insights.currentMonth.healthScore}%</Text>
            <Text style={[styles.statSubText, { color: colors.textMuted }]}>Financial Health</Text>
          </View>
        </View>

        {/* 2. Monthly Trend */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Trend</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Income vs Expenses over time</Text>
            </View>
            <View style={styles.chartIconBadge}>
              <TrendingUp color="#FFFFFF" size={16} />
            </View>
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendLabel, { color: colors.textMuted }]}>income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.legendLabel, { color: colors.textMuted }]}>expenses</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={[styles.legendLabel, { color: colors.textMuted }]}>savings</Text>
            </View>
          </View>

          <SvgLineChart labels={months} series={monthlyTrendSeries} width={CHART_WIDTH} height={200} textColor={colors.textMuted} />
        </View>

        {/* 3. Expense Categories */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Expense Categories</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Spending distribution this month</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#8B5CF6' }]}>
              <PieIcon color="#FFFFFF" size={16} />
            </View>
          </View>

          {insights.categoryBreakdown.length === 0 ? (
            <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No expenses logged this month yet.</Text>
          ) : (
            <>
              <SvgDonutChart
                data={categoryDonutData}
                size={190}
                centerText={`${currencySymbol}${insights.currentMonth.expenses.toLocaleString()}`}
                centerSubText="Total Spent"
                textColor={colors.text}
              />

              <View style={[styles.categoryList, { marginTop: 16 }]}>
                {insights.categoryBreakdown.map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    style={styles.categoryItem}
                    onPress={() => handleCategoryPress({ name: cat.name, spent: cat.amount, budget: cat.budget, percentage: cat.percentage, color: cat.color })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryColorDot, { backgroundColor: cat.color }]} />
                      <View>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                        <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                          {cat.count} transaction{cat.count === 1 ? '' : 's'} • {cat.percentage}% of total
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={[styles.categoryAmount, { color: colors.text }]}>
                        {currencySymbol}{(cat.amount || 0).toLocaleString()}
                      </Text>
                      {cat.budget > 0 && (
                        <Text style={[styles.categoryLimit, { color: colors.textMuted }]}>
                          Limit: {currencySymbol}{cat.budget.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* 4. Income vs Expenses */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Income vs Expenses</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Last 6 months comparison</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#10B981' }]}>
              <Layers color="#FFFFFF" size={16} />
            </View>
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Expenses</Text>
            </View>
          </View>

          <SvgBarChart data={incomeVsExpenseData} width={CHART_WIDTH} height={190} barWidth={9} gap={3} textColor={colors.textMuted} />
        </View>

        {/* 5. Payment Methods */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Methods</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>How you spent this month</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#F59E0B' }]}>
              <CreditCard color="#FFFFFF" size={16} />
            </View>
          </View>

          {insights.paymentMethods.length === 0 ? (
            <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No expenses logged this month yet.</Text>
          ) : (
            <SvgBarChart data={paymentMethodsBarData} width={CHART_WIDTH} height={180} barWidth={24} textColor={colors.textMuted} />
          )}
        </View>

        {/* 6. Payment Types */}
        {insights.paymentTypes.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Types</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Digital, Bank/Card & Cash split</Text>
              </View>
              <View style={[styles.chartIconBadge, { backgroundColor: '#3B82F6' }]}>
                <Landmark color="#FFFFFF" size={16} />
              </View>
            </View>

            <SvgDonutChart
              data={insights.paymentTypes}
              size={180}
              centerText="Modes"
              centerSubText={`${insights.paymentTypes.length} Type${insights.paymentTypes.length === 1 ? '' : 's'}`}
              textColor={colors.text}
            />

            <View style={[styles.ptList, { marginTop: 14 }]}>
              {insights.paymentTypes.map((pt) => (
                <View key={pt.name} style={styles.ptItem}>
                  <View style={styles.ptLeft}>
                    <View style={[styles.categoryColorDot, { backgroundColor: pt.color }]} />
                    <Text style={[styles.ptName, { color: colors.text }]}>{pt.name}</Text>
                  </View>
                  <Text style={[styles.ptValue, { color: colors.text }]}>
                    {currencySymbol}{pt.value.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 7. Weekly Spending Trend */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Spending Trend</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Expenses by week of current month</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#6366F1' }]}>
              <Calendar color="#FFFFFF" size={16} />
            </View>
          </View>

          <SvgBarChart data={weeklyBarData} width={CHART_WIDTH} height={180} barWidth={22} textColor={colors.textMuted} />
        </View>

        {/* 8. Income Sources */}
        {insights.incomeSources.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Income Sources</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Where your money came from this month</Text>
              </View>
              <View style={[styles.chartIconBadge, { backgroundColor: '#10B981' }]}>
                <DollarSign color="#FFFFFF" size={16} />
              </View>
            </View>

            <SvgDonutChart
              data={insights.incomeSources}
              size={180}
              centerText={`${currencySymbol}${insights.currentMonth.income.toLocaleString()}`}
              centerSubText="Total Inflow"
              textColor={colors.text}
            />

            <View style={[styles.ptList, { marginTop: 14 }]}>
              {insights.incomeSources.map((is) => (
                <View key={is.name} style={styles.ptItem}>
                  <View style={styles.ptLeft}>
                    <View style={[styles.categoryColorDot, { backgroundColor: is.color }]} />
                    <Text style={[styles.ptName, { color: colors.text }]}>{is.name}</Text>
                  </View>
                  <Text style={[styles.ptValue, { color: colors.text }]}>
                    {currencySymbol}{is.value.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 9. Daily Spending Pattern */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Spending Pattern</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Average spending by day of week (All time)</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#EC4899' }]}>
              <Activity color="#FFFFFF" size={16} />
            </View>
          </View>

          <SvgAreaChart labels={dailySpendingLabels} values={dailySpendingValues} color="#EC4899" width={CHART_WIDTH} height={190} textColor={colors.textMuted} />
        </View>

        {/* 10. Savings Rate Trend */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Savings Rate Trend</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Monthly savings percentage trajectory</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#06B6D4' }]}>
              <PiggyBank color="#FFFFFF" size={16} />
            </View>
          </View>

          <SvgLineChart labels={months} series={savingsRateSeries} width={CHART_WIDTH} height={190} yAxisSuffix="%" textColor={colors.textMuted} />
        </View>
      </ScrollView>

      {/* Category Drilldown Modal */}
      {selectedCategory && (
        <CategoryDetailsModal
          visible={categoryModalVisible}
          onClose={() => setCategoryModalVisible(false)}
          category={selectedCategory}
          currencySymbol={currencySymbol}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 70,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCardText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 24,
  },
  noticeBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  twoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCardHalf: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBoxSmall: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statSubText: {
    fontSize: 11,
    fontWeight: '500',
  },
  pillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pillGreenText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  pillRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pillRedText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  pillBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pillBlueText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
  },
  pillPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pillPurpleText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '700',
  },
  chartCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  chartIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryColorDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 10,
    marginTop: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryLimit: {
    fontSize: 10,
    marginTop: 1,
  },
  ptList: {
    gap: 10,
  },
  ptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ptName: {
    fontSize: 12,
    fontWeight: '500',
  },
  ptValue: {
    fontSize: 12,
    fontWeight: '700',
  },
})
