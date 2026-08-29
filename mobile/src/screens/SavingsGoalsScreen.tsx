import React, { useEffect, useState, useCallback } from 'react'
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Target,
  Plus,
  Trash2,
  X,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { api } from '../services/api'
import { SavingsGoal } from '../types'

export const SavingsGoalsScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    totalTarget: 0,
    totalSaved: 0,
    overallProgress: 0,
  })

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [depositInput, setDepositInput] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [category, setCategory] = useState('Emergency Fund')
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState('#10B981')

  const iconOptions = ['🎯', '🚗', '🏠', '✈️', '💻', '💍', '🎓', '🛡️', '📱', '🏖️']
  const colorOptions = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']

  const loadGoals = async () => {
    try {
      const data = await api.getSavingsGoals()
      setGoals(data.goals || [])
      setStats(data.stats || { totalGoals: 0, completedGoals: 0, totalTarget: 0, totalSaved: 0, overallProgress: 0 })
    } catch {
      setGoals([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadGoals()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadGoals()
  }

  const handleCreateGoal = async () => {
    if (!name.trim() || !targetAmount.trim()) {
      Alert.alert('Required', 'Please enter goal name and target amount.')
      return
    }

    try {
      await api.createSavingsGoal({
        name: name.trim(),
        targetAmount: Number(targetAmount),
        currentAmount: currentAmount ? Number(currentAmount) : 0,
        category,
        icon,
        color,
      })

      setShowAddModal(false)
      setName('')
      setTargetAmount('')
      setCurrentAmount('')
      loadGoals()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create savings goal.')
    }
  }

  const handleDeposit = async () => {
    if (!selectedGoal || !depositInput.trim()) return

    try {
      const res = await api.depositSavingsGoal(selectedGoal.id, Number(depositInput), 'deposit')
      setShowDepositModal(false)
      setDepositInput('')
      setSelectedGoal(null)
      Alert.alert('🎉 Deposited!', res.message)
      loadGoals()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add funds.')
    }
  }

  const handleDeleteGoal = (goal: SavingsGoal) => {
    Alert.alert('Delete Goal', `Remove savings goal "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteSavingsGoal(goal.id)
            loadGoals()
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not delete goal.')
          }
        },
      },
    ])
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Savings Goals" subtitle="Targets & Milestones" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {/* Top Hero Stats Card */}
        <LinearGradient
          colors={['#064E3B', '#065F46', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroSub}>TOTAL SAVED ACROSS GOALS</Text>
              <Text style={styles.heroAmount}>
                {currencySymbol}{stats.totalSaved.toLocaleString()}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{stats.overallProgress}% of Target</Text>
            </View>
          </View>

          <View style={styles.heroProgressBar}>
            <View style={[styles.heroProgressFill, { width: `${Math.min(100, stats.overallProgress)}%` }]} />
          </View>

          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMetaText}>
              Target: {currencySymbol}{stats.totalTarget.toLocaleString()}
            </Text>
            <Text style={styles.heroMetaText}>
              {stats.completedGoals} of {stats.totalGoals} Completed
            </Text>
          </View>
        </LinearGradient>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAddModal(true)}
          style={styles.addGoalBtn}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addGoalGradient}
          >
            <Plus color="#FFFFFF" size={18} />
            <Text style={styles.addGoalBtnText}>Create New Savings Goal</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Goals List */}
        {goals.map((goal) => {
          const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
          const isDone = goal.currentAmount >= goal.targetAmount

          return (
            <View
              key={goal.id}
              style={[
                styles.goalCard,
                { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
              ]}
            >
              <View style={styles.goalHeader}>
                <View style={styles.goalHeaderLeft}>
                  <View style={[styles.goalIconBox, { backgroundColor: `${goal.color}25` }]}>
                    <Text style={{ fontSize: 20 }}>{goal.icon || '🎯'}</Text>
                  </View>
                  <View>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.name}</Text>
                    <Text style={[styles.goalCat, { color: colors.textMuted }]}>{goal.category}</Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleDeleteGoal(goal)} style={styles.deleteBtn}>
                  <Trash2 color="#EF4444" size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.goalBody}>
                <View style={styles.goalAmountRow}>
                  <Text style={[styles.goalSavedText, { color: colors.text }]}>
                    {currencySymbol}{goal.currentAmount.toLocaleString()}
                  </Text>
                  <Text style={[styles.goalTargetText, { color: colors.textMuted }]}>
                    / {currencySymbol}{goal.targetAmount.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress}%`, backgroundColor: goal.color || '#10B981' },
                    ]}
                  />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={[styles.progressPercent, { color: goal.color || '#10B981' }]}>
                    {progress}% Reached
                  </Text>
                  {isDone && (
                    <View style={styles.completedBadge}>
                      <CheckCircle2 color="#10B981" size={14} />
                      <Text style={styles.completedText}>Goal Achieved!</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setSelectedGoal(goal)
                  setShowDepositModal(true)
                }}
                style={[styles.depositBtn, { backgroundColor: `${goal.color}15`, borderColor: `${goal.color}40` }]}
              >
                <Plus color={goal.color || '#10B981'} size={14} />
                <Text style={[styles.depositBtnText, { color: goal.color || '#10B981' }]}>
                  Add Funds
                </Text>
              </TouchableOpacity>
            </View>
          )
        })}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowAddModal(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Savings Goal</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
              placeholder="Goal Name (e.g. Emergency Fund, New Bike)"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
              placeholder="Target Amount (₹)"
              placeholderTextColor={colors.textMuted}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
              placeholder="Initial Saved Amount (₹ optional)"
              placeholderTextColor={colors.textMuted}
              value={currentAmount}
              onChangeText={setCurrentAmount}
              keyboardType="numeric"
            />

            {/* Icon Picker */}
            <Text style={[styles.label, { color: colors.textMuted }]}>Select Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {iconOptions.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setIcon(emoji)}
                  style={[
                    styles.iconPill,
                    icon === emoji && styles.iconPillActive,
                    { borderColor: colors.surfaceGlassBorder },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateGoal}>
              <Text style={styles.saveBtnText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Deposit Modal */}
      {showDepositModal && selectedGoal && (
        <Modal visible={showDepositModal} animationType="fade" transparent onRequestClose={() => setShowDepositModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDepositModal(false)} />
            <View style={[styles.depositCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Deposit to {selectedGoal.name}</Text>
              <Text style={[styles.label, { color: colors.textMuted, marginTop: 4 }]}>
                Current: {currencySymbol}{selectedGoal.currentAmount.toLocaleString()} / {currencySymbol}{selectedGoal.targetAmount.toLocaleString()}
              </Text>

              <TextInput
                style={[styles.depositInput, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
                placeholder="Amount (₹)"
                placeholderTextColor={colors.textMuted}
                value={depositInput}
                onChangeText={setDepositInput}
                keyboardType="numeric"
                autoFocus
              />

              <View style={styles.quickPresetsRow}>
                {[1000, 2000, 5000, 10000].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => setDepositInput(preset.toString())}
                    style={[styles.presetBtn, { borderColor: colors.surfaceGlassBorder }]}
                  >
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                      +₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleDeposit}>
                <Text style={styles.saveBtnText}>Confirm Deposit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroSub: { fontSize: 10, fontWeight: '800', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 0.8 },
  heroAmount: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginTop: 4 },
  heroBadge: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  heroProgressBar: { height: 6, backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 3, marginVertical: 14, overflow: 'hidden' },
  heroProgressFill: { height: '100%', backgroundColor: '#34D399', borderRadius: 3 },
  heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroMetaText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, fontWeight: '600' },
  addGoalBtn: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  addGoalGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  addGoalBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  goalCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goalTitle: { fontSize: 15, fontWeight: '800' },
  goalCat: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  deleteBtn: { padding: 6 },
  goalBody: { marginVertical: 12 },
  goalAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  goalSavedText: { fontSize: 18, fontWeight: '900' },
  goalTargetText: { fontSize: 12, fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, marginVertical: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPercent: { fontSize: 11, fontWeight: '800' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completedText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  depositBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  depositBtnText: { fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 24, padding: 20, borderWidth: 1 },
  depositCard: { borderRadius: 24, padding: 20, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  depositInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 20, fontWeight: '800', marginVertical: 12, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  iconPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  iconPillActive: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  quickPresetsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  presetBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderRadius: 10 },
  saveBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
