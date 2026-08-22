import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native'
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart2,
  Calendar,
  ShieldCheck,
  Info,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  CreditCard,
  Smartphone,
  Landmark,
  Banknote,
  Activity,
  Layers,
  PiggyBank,
  Percent,
  Zap,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { CategoryDetailsModal } from '../components/CategoryDetailsModal'
import { SvgLineChart } from '../components/charts/SvgLineChart'
import { SvgAreaChart } from '../components/charts/SvgAreaChart'
import { SvgDonutChart } from '../components/charts/SvgDonutChart'
import { SvgBarChart } from '../components/charts/SvgBarChart'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CHART_WIDTH = SCREEN_WIDTH - 64

export const AnalyticsScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  
  // 1. Monthly Trend Series (Line Chart: Green, Red, Purple)
  const monthlyTrendSeries = [
    { key: 'income', color: '#10B981', values: [14200, 14500, 14800, 15000, 15100, 15500] },
    { key: 'expenses', color: '#EF4444', values: [9100, 9800, 10200, 11000, 10400, 9500] },
    { key: 'savings', color: '#8B5CF6', values: [5100, 4700, 4600, 4000, 4700, 6000] },
  ]

  // 2. Expense Categories (Donut)
  const categoryDonutData = [
    { name: 'Housing & Rent', value: 4500, color: '#8B5CF6' },
    { name: 'Food & Groceries', value: 3200, color: '#10B981' },
    { name: 'Bills & Utilities', value: 1199, color: '#06B6D4' },
    { name: 'Travel & Commute', value: 900, color: '#F59E0B' },
    { name: 'Subscriptions', value: 601, color: '#EC4899' },
  ]

  const categories = [
    { name: 'Housing & Rent', amount: 4500, percentage: 43, color: '#8B5CF6', budget: 6000, count: 1 },
    { name: 'Food & Groceries', amount: 3200, percentage: 31, color: '#10B981', budget: 5000, count: 18 },
    { name: 'Bills & Utilities', amount: 1199, percentage: 12, color: '#06B6D4', budget: 2000, count: 6 },
    { name: 'Travel & Commute', amount: 900, percentage: 9, color: '#F59E0B', budget: 1500, count: 8 },
    { name: 'Subscriptions', amount: 601, percentage: 5, color: '#EC4899', budget: 1000, count: 2 },
  ]

  // 3. Income vs Expenses Dual Bars
  const incomeVsExpenseData = [
    {
      label: 'Apr',
      values: [
        { key: 'in', value: 14200, color: '#10B981' },
        { key: 'ex', value: 9100, color: '#EF4444' },
      ],
    },
    {
      label: 'May',
      values: [
        { key: 'in', value: 14500, color: '#10B981' },
        { key: 'ex', value: 9800, color: '#EF4444' },
      ],
    },
    {
      label: 'Jun',
      values: [
        { key: 'in', value: 14800, color: '#10B981' },
        { key: 'ex', value: 10200, color: '#EF4444' },
      ],
    },
    {
      label: 'Jul',
      values: [
        { key: 'in', value: 15000, color: '#10B981' },
        { key: 'ex', value: 11000, color: '#EF4444' },
      ],
    },
    {
      label: 'Aug',
      values: [
        { key: 'in', value: 15100, color: '#10B981' },
        { key: 'ex', value: 10400, color: '#EF4444' },
      ],
    },
    {
      label: 'Sep',
      values: [
        { key: 'in', value: 15500, color: '#10B981' },
        { key: 'ex', value: 9500, color: '#EF4444' },
      ],
    },
  ]

  // 4. Payment Methods Bar Chart
  const paymentMethodsBarData = [
    { label: 'UPI', values: [{ key: 'upi', value: 6032, color: '#10B981' }] },
    { label: 'Cards', values: [{ key: 'cards', value: 2496, color: '#8B5CF6' }] },
    { label: 'NetBank', values: [{ key: 'nb', value: 1248, color: '#3B82F6' }] },
    { label: 'Cash', values: [{ key: 'cash', value: 624, color: '#F59E0B' }] },
  ]

  // 5. Payment Types (Donut)
  const paymentTypesDonut = [
    { name: 'Digital (UPI)', value: 6032, color: '#10B981' },
    { name: 'Bank & Cards', value: 3744, color: '#8B5CF6' },
    { name: 'Cash', value: 624, color: '#F59E0B' },
  ]

  // 6. Weekly Spending Trend (Bar Chart)
  const weeklyBarData = [
    { label: 'Week 1', values: [{ key: 'w1', value: 2850, color: '#6366F1' }] },
    { label: 'Week 2', values: [{ key: 'w2', value: 3100, color: '#6366F1' }] },
    { label: 'Week 3', values: [{ key: 'w3', value: 2650, color: '#6366F1' }] },
    { label: 'Week 4', values: [{ key: 'w4', value: 1800, color: '#6366F1' }] },
  ]

  // 7. Income Sources (Donut)
  const incomeSourcesDonut = [
    { name: 'Salary', value: 12500, color: '#10B981' },
    { name: 'Freelance', value: 2000, color: '#06B6D4' },
    { name: 'Dividends', value: 600, color: '#8B5CF6' },
  ]

  // 8. Daily Spending Pattern (Area Chart: Sun - Sat)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dailySpendingValues = [1850, 950, 1200, 1400, 800, 2400, 3100]

  // 9. Savings Rate Trend (Line Chart)
  const savingsRateMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  const savingsRateSeries = [
    { key: 'savingsRate', color: '#06B6D4', values: [35.9, 32.4, 31.0, 26.6, 31.1, 38.7] },
  ]

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }

  const handleCategoryPress = (cat: any) => {
    setSelectedCategory(cat)
    setCategoryModalVisible(true)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Analytics" onProfilePress={() => navigation?.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* 1. Top Stat Cards (2x2 Grid) */}
        <View style={styles.twoCardsRow}>
          {/* Income Card */}
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
              {currencySymbol}15,100
            </Text>
            <Text style={[styles.statSubText, { color: colors.textMuted }]}>Total Income</Text>
          </View>

          {/* Expenses Card */}
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
              {currencySymbol}10,400
            </Text>
            <Text style={[styles.statSubText, { color: colors.textMuted }]}>Total Expenses</Text>
          </View>
        </View>

        <View style={styles.twoCardsRow}>
          {/* Net Savings */}
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
              {currencySymbol}4,700
            </Text>
            <Text style={[styles.statSubText, { color: colors.textMuted }]}>31.1% Net Rate</Text>
          </View>

          {/* Financial Health */}
          <View style={[styles.statCardHalf, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.cardHeaderSmall}>
              <View style={[styles.iconBoxSmall, { backgroundColor: '#8B5CF6' }]}>
                <ShieldCheck color="#FFFFFF" size={14} />
              </View>
              <View style={styles.pillPurple}>
                <Text style={styles.pillPurpleText}>Score</Text>
              </View>
            </View>
            <Text style={[styles.statAmount, { color: '#8B5CF6' }]}>70%</Text>
            <Text style={[styles.statSubText, { color: colors.textMuted }]}>Financial Health</Text>
          </View>
        </View>

        {/* 2. Monthly Trend (Smooth Multi-Line Curve Chart) */}
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

          {/* Top Legend */}
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

          <SvgLineChart
            labels={months}
            series={monthlyTrendSeries}
            width={CHART_WIDTH}
            height={200}
            textColor={colors.textMuted}
          />
        </View>

        {/* 3. Expense Categories (Donut & Details) */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Expense Categories</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Spending distribution by category</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#8B5CF6' }]}>
              <PieIcon color="#FFFFFF" size={16} />
            </View>
          </View>

          <SvgDonutChart
            data={categoryDonutData}
            size={190}
            centerText={`${currencySymbol}10,400`}
            centerSubText="Total Spent"
            textColor={colors.text}
          />

          {/* Category Details List */}
          <View style={[styles.categoryList, { marginTop: 16 }]}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(cat)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryColorDot, { backgroundColor: cat.color }]} />
                  <View>
                    <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                    <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                      {cat.count} transactions • {cat.percentage}% of total
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={[styles.categoryAmount, { color: colors.text }]}>
                    {currencySymbol}{(cat.amount || 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.categoryLimit, { color: colors.textMuted }]}>
                    Limit: {currencySymbol}{(cat.budget || 0).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Income vs Expenses (Dual Bar Chart) */}
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

          <SvgBarChart
            data={incomeVsExpenseData}
            width={CHART_WIDTH}
            height={190}
            barWidth={9}
            gap={3}
            textColor={colors.textMuted}
          />
        </View>

        {/* 5. Payment Methods (Vertical Bar Chart) */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Methods</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>How you spend your money</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#F59E0B' }]}>
              <CreditCard color="#FFFFFF" size={16} />
            </View>
          </View>

          <SvgBarChart
            data={paymentMethodsBarData}
            width={CHART_WIDTH}
            height={180}
            barWidth={24}
            textColor={colors.textMuted}
          />
        </View>

        {/* 6. Payment Types (Donut Chart) */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Types</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Bank, Digital & Cash distribution</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#3B82F6' }]}>
              <Landmark color="#FFFFFF" size={16} />
            </View>
          </View>

          <SvgDonutChart
            data={paymentTypesDonut}
            size={180}
            centerText="Modes"
            centerSubText="3 Types"
            textColor={colors.text}
          />

          <View style={[styles.ptList, { marginTop: 14 }]}>
            {paymentTypesDonut.map((pt) => (
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

        {/* 7. Weekly Spending Trend (Bar Chart) */}
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

          <SvgBarChart
            data={weeklyBarData}
            width={CHART_WIDTH}
            height={180}
            barWidth={22}
            textColor={colors.textMuted}
          />
        </View>

        {/* 8. Income Sources (Donut Chart) */}
        <View style={[styles.chartCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Income Sources</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Where your money comes from</Text>
            </View>
            <View style={[styles.chartIconBadge, { backgroundColor: '#10B981' }]}>
              <DollarSign color="#FFFFFF" size={16} />
            </View>
          </View>

          <SvgDonutChart
            data={incomeSourcesDonut}
            size={180}
            centerText={`${currencySymbol}15,100`}
            centerSubText="Total Inflow"
            textColor={colors.text}
          />

          <View style={[styles.ptList, { marginTop: 14 }]}>
            {incomeSourcesDonut.map((is) => (
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

        {/* 9. Daily Spending Pattern (Smooth Wave Area Chart) */}
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

          <SvgAreaChart
            labels={daysOfWeek}
            values={dailySpendingValues}
            color="#EC4899"
            width={CHART_WIDTH}
            height={190}
            textColor={colors.textMuted}
          />
        </View>

        {/* 10. Savings Rate Trend (Line Chart with cyan curve & dots) */}
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

          <SvgLineChart
            labels={savingsRateMonths}
            series={savingsRateSeries}
            width={CHART_WIDTH}
            height={190}
            yAxisSuffix="%"
            textColor={colors.textMuted}
          />
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
