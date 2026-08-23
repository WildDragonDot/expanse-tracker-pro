import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Calendar,
  WalletCards,
  ReceiptText,
  PiggyBank,
  Percent,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { MonthlyBudgetSkeleton } from '../components/SkeletonLoader'
import { api } from '../services/api'
import { MonthlyBudgetItem } from '../types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const CATEGORY_COLORS = ['#8B5CF6', '#10B981', '#06B6D4', '#F59E0B', '#F43F5E', '#3B82F6', '#EC4899']

const colorForCategory = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length]
}

// Mirrors backend/src/lib/billingCycle.ts so the period shown here matches the
// same "billing cycle start day" logic the server uses for spend calculations.
const getBillingPeriod = (month: number, year: number, billingCycleStartDay: number) => {
  const monthIndex = month - 1
  const startDate = new Date(year, monthIndex, billingCycleStartDay)
  const endDate = new Date(year, monthIndex + 1, billingCycleStartDay - 1, 23, 59, 59, 999)
  return { startDate, endDate }
}

const getCurrentBillingMonthYear = (billingCycleStartDay: number, now = new Date()) => {
  const day = now.getDate()
  const month = now.getMonth() // 0-11
  const year = now.getFullYear()
  if (day >= billingCycleStartDay) return { month: month + 1, year }
  return { month: month === 0 ? 12 : month, year: month === 0 ? year - 1 : year }
}

export const MonthlyBudgetScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const billingCycleStartDay = user?.billingCycleStartDay || 1
  const currentPeriod = getCurrentBillingMonthYear(billingCycleStartDay)

  const [selectedMonth, setSelectedMonth] = useState(currentPeriod.month)
  const [selectedYear, setSelectedYear] = useState(currentPeriod.year)
  const [monthPickerVisible, setMonthPickerVisible] = useState(false)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [categories, setCategories] = useState<MonthlyBudgetItem[]>([])

  // Modal
  const [modalVisible, setModalVisible] = useState(false)
  const [catName, setCatName] = useState('')
  const [catBudget, setCatBudget] = useState('')
  const [saving, setSaving] = useState(false)

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const loadBudgets = async () => {
    try {
      const budgets = await api.getMonthlyBudgets(selectedMonth, selectedYear)
      setCategories(budgets)
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadBudgets()
  }, [selectedMonth, selectedYear])

  const onRefresh = () => {
    setRefreshing(true)
    loadBudgets()
  }

  const totalBudget = categories.reduce((sum, c) => sum + c.amount, 0)
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0)
  const remaining = Math.max(0, totalBudget - totalSpent)
  const usedPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const isActivePeriod = selectedMonth === currentPeriod.month && selectedYear === currentPeriod.year
  const period = getBillingPeriod(selectedMonth, selectedYear, billingCycleStartDay)
  const now = new Date()
  const daysLeft = isActivePeriod ? Math.max(0, Math.ceil((period.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0
  const periodProgress = isActivePeriod
    ? Math.max(0, Math.min(100, Math.round(((now.getTime() - period.startDate.getTime()) / (period.endDate.getTime() - period.startDate.getTime())) * 100)))
    : now > period.endDate ? 100 : 0
  const periodLabel = `${period.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${period.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const handleAddBudget = async () => {
    if (!catName || !catBudget) {
      Alert.alert('Required', 'Please enter category name and budget limit.')
      return
    }
    setSaving(true)
    try {
      await api.saveMonthlyBudget({
        category: catName.trim(),
        amount: parseFloat(catBudget),
        month: selectedMonth,
        year: selectedYear,
      })
      setModalVisible(false)
      setCatName('')
      setCatBudget('')
      await loadBudgets()
    } catch (err: any) {
      Alert.alert('Could not save budget', err.message || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBudget = (item: MonthlyBudgetItem) => {
    Alert.alert('Remove Budget?', `Remove the ${currencySymbol}${item.amount.toLocaleString()} limit for "${item.category}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteMonthlyBudget(item.id)
            setCategories((prev) => prev.filter((c) => c.id !== item.id))
          } catch (err: any) {
            Alert.alert('Could not remove budget', err.message || 'Please try again.')
          }
        },
      },
    ])
  }

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Monthly Budget" onProfilePress={() => navigation.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* 1. Month / Year Selector */}
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.dropdownRow}>
            <TouchableOpacity onPress={goToPreviousMonth} style={[styles.chevronBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <ChevronLeft color={colors.textSecondary} size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMonthPickerVisible(true)}
              style={[styles.dropdownBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            >
              <Calendar color={colors.textSecondary} size={16} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </Text>
              <ChevronDown color={colors.textSecondary} size={16} />
            </TouchableOpacity>

            <TouchableOpacity onPress={goToNextMonth} style={[styles.chevronBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <ChevronRight color={colors.textSecondary} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Current Billing Period Card */}
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.periodHeader}>
            <View style={styles.periodLeft}>
              <View style={styles.periodIcon}>
                <Calendar color="#8B5CF6" size={18} />
              </View>
              <View>
                <Text style={[styles.periodTitle, { color: colors.text }]}>
                  {isActivePeriod ? 'Current Billing Period' : 'Billing Period'}
                </Text>
                <Text style={[styles.periodDates, { color: colors.textSecondary }]}>{periodLabel}</Text>
              </View>
            </View>
            <View style={styles.periodRight}>
              {isActivePeriod ? (
                <>
                  <Text style={[styles.daysLeftNum, { color: colors.text }]}>{daysLeft}</Text>
                  <Text style={[styles.daysLeftText, { color: colors.textSecondary }]}>days left</Text>
                </>
              ) : (
                <Text style={[styles.daysLeftText, { color: colors.textSecondary }]}>
                  {now > period.endDate ? 'Completed' : 'Upcoming'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Period Progress</Text>
              <Text style={[styles.progressVal, { color: colors.text }]}>{periodProgress}%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.inputBg }]}>
              <View style={[styles.fill, { width: `${periodProgress}%`, backgroundColor: '#8B5CF6' }]} />
            </View>
          </View>
        </View>

        {/* 3. 4 Budget Metric Cards in 2 Rows of 2 */}
        <View style={styles.twoCardsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.metricIconCircleBlue}>
              <WalletCards color="#3B82F6" size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Budget</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {currencySymbol}{totalBudget.toLocaleString()}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.metricIconCircleRed}>
              <ReceiptText color="#F43F5E" size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Spent</Text>
            <Text style={[styles.metricValue, { color: '#F43F5E' }]}>
              {currencySymbol}{totalSpent.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.twoCardsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.metricIconCircleGreen}>
              <PiggyBank color="#10B981" size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Remaining</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>
              {currencySymbol}{remaining.toLocaleString()}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.metricIconCirclePurple}>
              <Percent color="#8B5CF6" size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Overall Used</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{usedPercentage}%</Text>
          </View>
        </View>

        {/* 4. Category Budget Breakdown */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Limits</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={[styles.addBtnText, { color: colors.primary }]}>+ Add Budget</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <MonthlyBudgetSkeleton />
        ) : categories.length === 0 ? (
          <View style={styles.emptyState}>
            <WalletCards color={colors.textMuted} size={28} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No budgets set for {MONTH_NAMES[selectedMonth - 1]} {selectedYear} yet. Tap "+ Add Budget" to set one.
            </Text>
          </View>
        ) : (
          categories.map((c) => {
            const catUsed = c.amount > 0 ? Math.round((c.spent / c.amount) * 100) : 0
            const color = colorForCategory(c.category)
            return (
              <TouchableOpacity
                key={c.id}
                onLongPress={() => handleDeleteBudget(c)}
                activeOpacity={0.8}
                style={[styles.catRow, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <CategoryIcon name={c.category} color={color} size={14} containerSize={26} style={{ marginRight: 8 }} />
                  <View style={styles.catInfo}>
                    <Text style={[styles.catName, { color: colors.text }]}>{c.category}</Text>
                    <Text style={[styles.catAmounts, { color: colors.textSecondary }]}>
                      {currencySymbol}{c.spent.toLocaleString()} / {currencySymbol}{c.amount.toLocaleString()} ({catUsed}%)
                    </Text>
                  </View>
                  <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => handleDeleteBudget(c)}>
                    <Trash2 color={colors.textMuted} size={15} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.track, { backgroundColor: colors.inputBg }]}>
                  <View style={[styles.fill, { width: `${Math.min(100, catUsed)}%`, backgroundColor: catUsed > 100 ? '#F43F5E' : color }]} />
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Set Category Budget</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CATEGORY NAME</Text>
              <TextInput
                value={catName}
                onChangeText={setCatName}
                placeholder="e.g. Dining Out, Fitness, Shopping"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>BUDGET LIMIT ({currencySymbol})</Text>
              <TextInput
                value={catBudget}
                onChangeText={setCatBudget}
                placeholder="10,000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <TouchableOpacity onPress={handleAddBudget} disabled={saving} style={[styles.submitBtn, { opacity: saving ? 0.6 : 1 }]}>
              <LinearGradient colors={colors.primaryGradient} style={styles.submitGradient}>
                <Text style={styles.submitText}>{saving ? 'Saving…' : 'Save Budget'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Month Picker Modal */}
      <Modal visible={monthPickerVisible} animationType="fade" transparent onRequestClose={() => setMonthPickerVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayCenter} activeOpacity={1} onPress={() => setMonthPickerVisible(false)}>
          <View style={[styles.monthPickerCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Month</Text>
              <TouchableOpacity onPress={() => setMonthPickerVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = idx + 1 === selectedMonth
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => {
                      setSelectedMonth(idx + 1)
                      setMonthPickerVisible(false)
                    }}
                    style={[
                      styles.monthChip,
                      { borderColor: colors.inputBorder, backgroundColor: isSelected ? colors.primary : colors.inputBg },
                    ]}
                  >
                    <Text style={[styles.monthChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>{name.slice(0, 3)}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  chevronBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: { fontSize: 13, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  periodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  periodIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodTitle: { fontSize: 13, fontWeight: '700' },
  periodDates: { fontSize: 11, marginTop: 2 },
  periodRight: { alignItems: 'flex-end' },
  daysLeftNum: { fontSize: 18, fontWeight: '900' },
  daysLeftText: { fontSize: 10 },
  progressSection: {},
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 11, fontWeight: '600' },
  progressVal: { fontSize: 11, fontWeight: '800' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  twoCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  metricIconCircleBlue: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconCircleRed: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconCirclePurple: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: { fontSize: 11, fontWeight: '600' },
  metricValue: { fontSize: 17, fontWeight: '900', marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  addBtnText: { fontSize: 12, fontWeight: '800' },
  catRow: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  catInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catName: { fontSize: 13, fontWeight: '700' },
  catAmounts: { fontSize: 11, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  monthPickerCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthChip: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  submitGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
