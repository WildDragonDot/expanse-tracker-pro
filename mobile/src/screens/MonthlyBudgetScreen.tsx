import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Calendar,
  Clock,
  Upload,
  Mail,
  DollarSign,
  ArrowDownLeft,
  CheckCircle2,
  PieChart,
  Plus,
  ChevronDown,
  X,
  Tag,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

interface BudgetCategory {
  id: string
  name: string
  budget: number
  spent: number
  color: string
}

export const MonthlyBudgetScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const [selectedMonth, setSelectedMonth] = useState('August')
  const [selectedYear, setSelectedYear] = useState('2026')

  const [categories, setCategories] = useState<BudgetCategory[]>([
    { id: 'b1', name: 'Housing & Rent', budget: 25000, spent: 25000, color: '#8B5CF6' },
    { id: 'b2', name: 'Food & Groceries', budget: 18000, spent: 13250, color: '#10B981' },
    { id: 'b3', name: 'Bills & Utilities', budget: 10000, spent: 8400, color: '#06B6D4' },
    { id: 'b4', name: 'Travel & Commute', budget: 8000, spent: 5100, color: '#F59E0B' },
    { id: 'b5', name: 'Entertainment & Leisure', budget: 6000, spent: 3750, color: '#F43F5E' },
  ])

  // Modal
  const [modalVisible, setModalVisible] = useState(false)
  const [catName, setCatName] = useState('')
  const [catBudget, setCatBudget] = useState('')

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0)
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0)
  const remaining = Math.max(0, totalBudget - totalSpent)
  const usedPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const handleAddBudget = () => {
    if (!catName || !catBudget) {
      Alert.alert('Required', 'Please enter category name and budget limit.')
      return
    }

    const newCat: BudgetCategory = {
      id: 'b_' + Date.now(),
      name: catName.trim(),
      budget: parseFloat(catBudget),
      spent: 0,
      color: '#8B5CF6',
    }

    setCategories((prev) => [...prev, newCat])
    setModalVisible(false)
    setCatName('')
    setCatBudget('')
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Monthly Budget" onProfilePress={() => navigation.navigate('Settings')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Month / Year Selector Card with 3 Icon Buttons */}
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.dropdownRow}>
            <TouchableOpacity style={[styles.dropdownBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Calendar color={colors.textSecondary} size={16} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>{selectedMonth}</Text>
              <ChevronDown color={colors.textSecondary} size={16} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.dropdownBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Text style={[styles.dropdownText, { color: colors.text }]}>{selectedYear}</Text>
              <ChevronDown color={colors.textSecondary} size={16} />
            </TouchableOpacity>
          </View>

          <View style={styles.iconActionsRow}>
            <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
              <Clock color={colors.textSecondary} size={16} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Upload color="#8B5CF6" size={16} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Mail color="#3B82F6" size={16} />
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
                <Text style={[styles.periodTitle, { color: colors.text }]}>Current Billing Period</Text>
                <Text style={[styles.periodDates, { color: colors.textSecondary }]}>Aug 1 - Aug 31, 2026</Text>
              </View>
            </View>
            <View style={styles.periodRight}>
              <Text style={[styles.daysLeftNum, { color: colors.text }]}>10</Text>
              <Text style={[styles.daysLeftText, { color: colors.textSecondary }]}>days left</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Period Progress</Text>
              <Text style={[styles.progressVal, { color: colors.text }]}>70%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.inputBg }]}>
              <View style={[styles.fill, { width: '70%', backgroundColor: '#8B5CF6' }]} />
            </View>
          </View>
        </View>

        {/* 3. 4 Budget Metric Cards in 2 Rows of 2 */}
        <View style={styles.twoCardsRow}>
          {/* Card 1: Total Budget */}
          <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.metricIconCircleBlue}>
              <DollarSign color="#3B82F6" size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Budget</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {currencySymbol}{totalBudget.toLocaleString()}
            </Text>
          </View>

          {/* Card 2: Total Spent */}
          <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.metricIconCircleRed}>
              <ArrowDownLeft color="#F43F5E" size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Spent</Text>
            <Text style={[styles.metricValue, { color: '#F43F5E' }]}>
              {currencySymbol}{totalSpent.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.twoCardsRow}>
          {/* Card 3: Remaining */}
          <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.metricIconCircleGreen}>
              <CheckCircle2 color="#10B981" size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Remaining</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>
              {currencySymbol}{remaining.toLocaleString()}
            </Text>
          </View>

          {/* Card 4: Overall Used */}
          <View style={[styles.metricCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.metricIconCirclePurple}>
              <PieChart color="#8B5CF6" size={16} />
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

        {categories.map((c) => {
          const catUsed = Math.round((c.spent / c.budget) * 100)
          return (
            <View
              key={c.id}
              style={[styles.catRow, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
            >
              <View style={styles.catInfo}>
                <Text style={[styles.catName, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.catAmounts, { color: colors.textSecondary }]}>
                  {currencySymbol}{c.spent.toLocaleString()} / {currencySymbol}{c.budget.toLocaleString()} ({catUsed}%)
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.inputBg }]}>
                <View style={[styles.fill, { width: `${Math.min(100, catUsed)}%`, backgroundColor: c.color }]} />
              </View>
            </View>
          )
        })}
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
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

            <TouchableOpacity onPress={handleAddBudget} style={styles.submitBtn}>
              <LinearGradient colors={colors.primaryGradient} style={styles.submitGradient}>
                <Text style={styles.submitText}>Save Budget</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 12,
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: { fontSize: 13, fontWeight: '700' },
  iconActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionIconBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catName: { fontSize: 12, fontWeight: '700' },
  catAmounts: { fontSize: 11, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
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
