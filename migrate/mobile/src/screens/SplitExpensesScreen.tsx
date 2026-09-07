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
  Users,
  Plus,
  Trash2,
  X,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { api } from '../services/api'
import { SplitGroup, SplitExpense } from '../types'

export const SplitExpensesScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [groups, setGroups] = useState<SplitGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<SplitGroup | null>(null)
  const [groupDetails, setGroupDetails] = useState<{
    group: SplitGroup
    totalSpend: number
    balances: Record<string, number>
    yourBalance: number
    settlements: { from: string; to: string; amount: number }[]
  } | null>(null)

  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)

  // Create Group Form
  const [groupName, setGroupName] = useState('')
  const [groupType, setGroupType] = useState('trip')
  const [membersInput, setMembersInput] = useState('')

  // Add Shared Expense Form
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expensePayer, setExpensePayer] = useState('You')
  const [selectedSplitters, setSelectedSplitters] = useState<string[]>([])

  const loadGroups = async () => {
    try {
      const res = await api.getSplitGroups()
      setGroups(res.groups || [])
      if (res.groups && res.groups.length > 0 && !selectedGroup) {
        loadGroupDetails(res.groups[0].id)
      }
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadGroupDetails = async (id: string) => {
    try {
      const details = await api.getSplitGroupDetails(id)
      setSelectedGroup(details.group)
      setGroupDetails(details)
      setSelectedSplitters(details.group.members || ['You'])
      setExpensePayer('You')
    } catch {
      // ignore
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadGroups()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadGroups()
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Required', 'Please enter group name.')
      return
    }

    const members = membersInput
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0)

    try {
      const created = await api.createSplitGroup({
        name: groupName.trim(),
        type: groupType,
        members: members.length > 0 ? members : ['You'],
      })

      setShowCreateGroup(false)
      setGroupName('')
      setMembersInput('')
      await loadGroups()
      await loadGroupDetails(created.id)
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create group.')
    }
  }

  const handleAddExpense = async () => {
    if (!selectedGroup || !expenseTitle.trim() || !expenseAmount.trim()) {
      Alert.alert('Required', 'Please enter title and amount.')
      return
    }

    try {
      await api.createSplitExpense(selectedGroup.id, {
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        paidBy: expensePayer,
        splitBetween: selectedSplitters,
      })

      setShowAddExpense(false)
      setExpenseTitle('')
      setExpenseAmount('')
      await loadGroupDetails(selectedGroup.id)
      await loadGroups()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add shared bill.')
    }
  }

  const toggleSplitter = (member: string) => {
    if (selectedSplitters.includes(member)) {
      if (selectedSplitters.length > 1) {
        setSelectedSplitters(selectedSplitters.filter((m) => m !== member))
      }
    } else {
      setSelectedSplitters([...selectedSplitters, member])
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Split Expenses" subtitle="Group Bills & Balances" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >
        {/* Groups Horizontal Tabs */}
        {groups.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {groups.map((g) => {
              const isSelected = selectedGroup?.id === g.id
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => loadGroupDetails(g.id)}
                  style={[
                    styles.groupTab,
                    isSelected ? styles.groupTabActive : { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{g.type === 'trip' ? '✈️' : g.type === 'home' ? '🏠' : '👥'}</Text>
                  <Text style={[styles.groupTabText, { color: isSelected ? '#FFFFFF' : colors.text }]}>{g.name}</Text>
                  <View style={[styles.badge, { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)' }]}>
                    <Text style={{ color: isSelected ? '#FFFFFF' : colors.textMuted, fontSize: 10, fontWeight: '800' }}>
                      {g.members.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={[styles.subActionBtn, { borderColor: colors.surfaceGlassBorder }]}
            onPress={() => setShowCreateGroup(true)}
          >
            <Plus color={colors.text} size={16} />
            <Text style={[styles.subActionText, { color: colors.text }]}>New Group</Text>
          </TouchableOpacity>

          {selectedGroup && (
            <TouchableOpacity
              style={styles.mainActionBtn}
              onPress={() => setShowAddExpense(true)}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainActionGradient}
              >
                <Plus color="#FFFFFF" size={16} />
                <Text style={styles.mainActionText}>Add Bill</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {groupDetails && selectedGroup ? (
          <View style={{ gap: 14 }}>
            {/* Balance Card */}
            <LinearGradient
              colors={groupDetails.yourBalance > 0 ? ['#065F46', '#047857'] : groupDetails.yourBalance < 0 ? ['#881337', '#9F1239'] : ['#1E1B4B', '#312E81']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceHeroCard}
            >
              <Text style={styles.balanceHeroLabel}>YOUR NET BALANCE IN {selectedGroup.name.toUpperCase()}</Text>
              <Text style={styles.balanceHeroAmount}>
                {groupDetails.yourBalance > 0 ? `+${currencySymbol}${groupDetails.yourBalance.toLocaleString()}` : groupDetails.yourBalance < 0 ? `-${currencySymbol}${Math.abs(groupDetails.yourBalance).toLocaleString()}` : `${currencySymbol}0`}
              </Text>
              <Text style={styles.balanceHeroSub}>
                {groupDetails.yourBalance > 0 ? 'You are owed money overall' : groupDetails.yourBalance < 0 ? 'You owe money in this group' : 'You are all settled up! 🎉'}
              </Text>
            </LinearGradient>

            {/* Settle Up Suggestions */}
            {groupDetails.settlements.length > 0 && (
              <View style={[styles.settlementsCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <Text style={styles.settleTitle}>⚡ Who Owes Whom (Settlement):</Text>
                {groupDetails.settlements.map((s, idx) => (
                  <View key={idx} style={[styles.settleRow, { borderColor: colors.surfaceGlassBorder }]}>
                    <Text style={[styles.settleText, { color: colors.text }]}>
                      <Text style={{ fontWeight: '800', color: '#F43F5E' }}>{s.from}</Text> pays{' '}
                      <Text style={{ fontWeight: '800', color: '#10B981' }}>{s.to}</Text>
                    </Text>
                    <Text style={styles.settleAmount}>{currencySymbol}{s.amount.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Group Shared Bills List */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SHARED EXPENSES</Text>
            {groupDetails.group.expenses && groupDetails.group.expenses.length > 0 ? (
              groupDetails.group.expenses.map((expense) => {
                const yourShare = expense.splitBetween.includes('You')
                  ? Math.round(expense.amount / expense.splitBetween.length)
                  : 0

                return (
                  <View
                    key={expense.id}
                    style={[styles.expenseRow, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
                  >
                    <View style={styles.expenseLeft}>
                      <View style={styles.expenseIconBox}>
                        <Receipt color="#6366F1" size={18} />
                      </View>
                      <View>
                        <Text style={[styles.expenseTitle, { color: colors.text }]}>{expense.title}</Text>
                        <Text style={[styles.expenseMeta, { color: colors.textMuted }]}>
                          Paid by {expense.paidBy} • {expense.splitBetween.length} people
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.expenseAmount, { color: colors.text }]}>
                        {currencySymbol}{expense.amount.toLocaleString()}
                      </Text>
                      {expense.paidBy === 'You' ? (
                        <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '700' }}>
                          You lent {currencySymbol}{(expense.amount - yourShare).toLocaleString()}
                        </Text>
                      ) : yourShare > 0 ? (
                        <Text style={{ fontSize: 10, color: '#F43F5E', fontWeight: '700' }}>
                          Your share: {currencySymbol}{yourShare.toLocaleString()}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>No shared bills in this group yet.</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Users color="#6366F1" size={40} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Create Your First Split Group</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
              Split trip costs, flat rent, dinner parties, and office projects easily.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal visible={showCreateGroup} animationType="slide" transparent onRequestClose={() => setShowCreateGroup(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowCreateGroup(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Split Group</Text>
              <TouchableOpacity onPress={() => setShowCreateGroup(false)}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
              placeholder="Group Name (e.g. Goa Trip, Flat 402)"
              placeholderTextColor={colors.textMuted}
              value={groupName}
              onChangeText={setGroupName}
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
              placeholder="Members (e.g. Rahul, Pooja, Amit)"
              placeholderTextColor={colors.textMuted}
              value={membersInput}
              onChangeText={setMembersInput}
            />
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 14 }}>
              Comma-separated names. "You" will be included automatically.
            </Text>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateGroup}>
              <Text style={styles.saveBtnText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Shared Bill Modal */}
      {showAddExpense && selectedGroup && (
        <Modal visible={showAddExpense} animationType="slide" transparent onRequestClose={() => setShowAddExpense(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowAddExpense(false)} />
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Shared Bill</Text>
                <TouchableOpacity onPress={() => setShowAddExpense(false)}>
                  <X color={colors.text} size={18} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
                placeholder="What was it for? (e.g. Hotel, Dinner)"
                placeholderTextColor={colors.textMuted}
                value={expenseTitle}
                onChangeText={setExpenseTitle}
              />

              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
                placeholder="Total Amount (₹)"
                placeholderTextColor={colors.textMuted}
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                keyboardType="numeric"
              />

              {/* Paid By Selection */}
              <Text style={[styles.label, { color: colors.textMuted }]}>Paid By</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {selectedGroup.members.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setExpensePayer(m)}
                    style={[
                      styles.iconPill,
                      expensePayer === m && styles.iconPillActive,
                      { borderColor: colors.surfaceGlassBorder },
                    ]}
                  >
                    <Text style={{ color: expensePayer === m ? '#6366F1' : colors.text, fontWeight: '700', fontSize: 12 }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Split Between Selection */}
              <Text style={[styles.label, { color: colors.textMuted }]}>Split Between</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {selectedGroup.members.map((m) => {
                  const isSel = selectedSplitters.includes(m)
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => toggleSplitter(m)}
                      style={[
                        styles.splitterPill,
                        isSel && styles.splitterPillActive,
                        { borderColor: colors.surfaceGlassBorder },
                      ]}
                    >
                      <Text style={{ color: isSel ? '#FFFFFF' : colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                        {isSel ? '✓ ' : ''}{m}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddExpense}>
                <Text style={styles.saveBtnText}>Save Shared Bill</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  groupTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  groupTabActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  groupTabText: { fontSize: 13, fontWeight: '800' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  topActionsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  subActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  subActionText: { fontSize: 13, fontWeight: '700' },
  mainActionBtn: { flex: 1.2, borderRadius: 14, overflow: 'hidden' },
  mainActionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  mainActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  balanceHeroCard: { borderRadius: 22, padding: 18 },
  balanceHeroLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 0.8 },
  balanceHeroAmount: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginVertical: 4 },
  balanceHeroSub: { fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600' },
  settlementsCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
  settleTitle: { fontSize: 12, fontWeight: '800', color: '#F59E0B', marginBottom: 10 },
  settleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  settleText: { fontSize: 12 },
  settleAmount: { fontSize: 13, fontWeight: '800', color: '#F59E0B' },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginTop: 6 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expenseIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.15)', alignItems: 'center', justifyContent: 'center' },
  expenseTitle: { fontSize: 14, fontWeight: '800' },
  expenseMeta: { fontSize: 11, marginTop: 2 },
  expenseAmount: { fontSize: 14, fontWeight: '800' },
  emptyCard: { padding: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 24, padding: 20, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  iconPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  iconPillActive: { borderColor: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.15)' },
  splitterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  splitterPillActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  saveBtn: { backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
