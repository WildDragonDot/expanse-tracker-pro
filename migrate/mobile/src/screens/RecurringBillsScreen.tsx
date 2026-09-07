import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Moon,
  ChevronRight,
  ShieldAlert,
  BellRing,
  Mail,
  Smartphone,
  Bell,
  Zap,
  Check,
  X,
} from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { CategoryIcon } from '../components/CategoryIcon'
import { RecurringBillsSkeleton } from '../components/SkeletonLoader'
import { BillDetailsModal } from '../components/BillDetailsModal'
import { BillOccurrence, RecurringPayment, BillFrequency } from '../types'
import { api } from '../services/api'

export const getCategoryDetails = (title: string, category: string) => {
  const query = (title + ' ' + category).toLowerCase()
  if (query.includes('broadband') || query.includes('wifi') || query.includes('fiber') || query.includes('internet')) {
    return { color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' }
  }
  if (query.includes('netflix') || query.includes('stream') || query.includes('ott') || query.includes('tv') || query.includes('movie') || query.includes('prime')) {
    return { color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)' }
  }
  if (query.includes('gym') || query.includes('fitness') || query.includes('workout') || query.includes('crossfit')) {
    return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' }
  }
  if (query.includes('house') || query.includes('rent') || query.includes('apartment') || query.includes('maintenance')) {
    return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' }
  }
  if (query.includes('electric') || query.includes('power') || query.includes('utilit')) {
    return { color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)' }
  }
  if (query.includes('mobile') || query.includes('phone') || query.includes('recharge')) {
    return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' }
  }
  return { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' }
}

export const RecurringBillsScreen = () => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'rules'>('timeline')
  const [selectedBill, setSelectedBill] = useState<BillOccurrence | null>(null)

  // Populated from the backend below — no bills exist until the user (or the
  // backend's subscription auto-detector) actually creates one.
  const [occurrences, setOccurrences] = useState<BillOccurrence[]>([])
  const [bills, setBills] = useState<RecurringPayment[]>([])

  // Modal State for adding new recurring rule
  const [modalVisible, setModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newCategory, setNewCategory] = useState('Utilities')
  const [newFrequency, setNewFrequency] = useState<BillFrequency>('MONTHLY')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isTrial, setIsTrial] = useState(false)
  const [isAutoDebit, setIsAutoDebit] = useState(false)

  // Multi-Channel reminder states
  const [enableInAppPopup, setEnableInAppPopup] = useState(true)
  const [enablePush, setEnablePush] = useState(true)
  const [enableEmail, setEnableEmail] = useState(true)
  const [selectedDays, setSelectedDays] = useState<number[]>([7, 3, 1, 0])

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day))
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }

  const loadBillsData = async () => {
    try {
      const [occs, recs] = await Promise.all([
        api.getBillOccurrences().catch(() => []),
        api.getRecurringBills().catch(() => []),
      ])
      setOccurrences(occs)
      setBills(recs)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadBillsData()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadBillsData()
  }

  // 1-Click Pay Handler — asks the backend to log a real Expense and advance the bill
  const handleMarkPaid = async (occurrence: BillOccurrence) => {
    Alert.alert(
      'Mark as Paid?',
      `Confirm payment of ${currencySymbol}${occurrence.amount.toLocaleString()} for ${occurrence.title}? An expense ledger entry will be logged automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Log Expense',
          style: 'default',
          onPress: async () => {
            try {
              await api.markBillPaid(occurrence.id, { date: new Date().toISOString() })
              await loadBillsData()
            } catch (err: any) {
              Alert.alert('Could not mark as paid', err.message || 'Please try again.')
            }
          },
        },
      ]
    )
  }

  // Snooze Bill Reminder by 3 days
  const handleSnooze = async (occurrenceId: string) => {
    try {
      await api.snoozeBill(occurrenceId, 3)
      await loadBillsData()
    } catch (err: any) {
      Alert.alert('Could not snooze reminder', err.message || 'Please try again.')
    }
  }

  const handleDeleteRule = async (id: string) => {
    try {
      await api.deleteRecurringBill(id)
      await loadBillsData()
    } catch (err: any) {
      Alert.alert('Could not delete bill', err.message || 'Please try again.')
    }
  }

  const handleCreateBill = async () => {
    if (!newTitle || !newAmount) {
      Alert.alert('Required', 'Please enter bill title and amount.')
      return
    }

    try {
      await api.createRecurringBill({
        title: newTitle.trim(),
        amount: parseFloat(newAmount),
        category: newCategory,
        frequency: newFrequency,
        nextDueDate: newDate,
        reminderDays: selectedDays.length ? selectedDays : [3, 0],
        isAutoDebit,
        isTrial,
        trialEndDate: isTrial ? newDate : undefined,
      })

      setModalVisible(false)
      const title = newTitle.trim()
      const amount = newAmount
      setNewTitle('')
      setNewAmount('')
      await loadBillsData()

      Alert.alert('✅ Bill Added', `"${title}" (${currencySymbol}${amount}) is scheduled for ${newDate}.`, [{ text: 'OK' }])
    } catch (err: any) {
      Alert.alert('Could not add bill', err.message || 'Please try again.')
    }
  }

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Tabs Switcher */}
      <View style={styles.headerArea}>
        <View style={[styles.tabSwitcher, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('timeline')}
            style={[styles.tabBtn, activeTab === 'timeline' && { backgroundColor: '#3B82F6' }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'timeline' ? '#FFFFFF' : colors.textSecondary }]}>
              Upcoming Timeline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('rules')}
            style={[styles.tabBtn, activeTab === 'rules' && { backgroundColor: '#3B82F6' }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'rules' ? '#FFFFFF' : colors.textSecondary }]}>
              Recurring Rules ({bills.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        {/* Active Reminders Notice */}
        <LinearGradient
          colors={['rgba(56, 189, 248, 0.12)', 'rgba(16, 185, 129, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.noticeBanner, { borderColor: colors.surfaceGlassBorder }]}
        >
          <View style={styles.noticeIconWrap}>
            <BellRing color="#38BDF8" size={20} />
          </View>
          <View style={styles.noticeTextWrap}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>Autonomous Reminder Engine Active</Text>
            <Text style={[styles.noticeSub, { color: colors.textSecondary }]}>
              Multi-tier notifications (T-7, T-3, Due Day) enabled with zero missed payments.
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <RecurringBillsSkeleton />
        ) : activeTab === 'timeline' && occurrences.length === 0 ? (
          <View style={styles.emptyState}>
            <BellRing color={colors.textMuted} size={28} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No recurring bills yet. Tap + to add your first one.
            </Text>
          </View>
        ) : activeTab === 'rules' && bills.length === 0 ? (
          <View style={styles.emptyState}>
            <BellRing color={colors.textMuted} size={28} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No recurring bill rules yet. Tap + to add one.
            </Text>
          </View>
        ) : activeTab === 'timeline' ? (
          /* ================= TIMELINE VIEW ================= */
          occurrences.map((occ) => {
            const isPaid = occ.status === 'PAID'
            const isSnoozed = occ.status === 'SNOOZED'
            const cat = getCategoryDetails(occ.title, occ.category)

            return (
              <View
                key={occ.id}
                style={[
                  styles.billCard,
                  { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
                  isPaid && { opacity: 0.7 },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedBill(occ)}
                  style={styles.billHeader}
                >
                  <CategoryIcon
                    name={occ.title}
                    iconKey={occ.category}
                    color={cat.color}
                    size={20}
                    containerSize={42}
                    containerBg={cat.bg}
                    style={{ marginRight: 12 }}
                  />
                  <View style={styles.billDetails}>
                    <Text style={[styles.billTitle, { color: colors.text }]}>{occ.title}</Text>
                    <Text style={[styles.billMeta, { color: colors.textSecondary }]}>
                      Due: {occ.dueDate} • {occ.category}
                    </Text>
                  </View>
                  <View style={styles.billAmountWrap}>
                    <Text style={[styles.billAmount, { color: colors.text }]}>
                      {currencySymbol}
                      {occ.amount.toLocaleString()}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isPaid
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isSnoozed
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(56, 189, 248, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: isPaid ? '#10B981' : isSnoozed ? '#F59E0B' : '#38BDF8',
                          },
                        ]}
                      >
                        {occ.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Reminder Channel Indicators */}
                {!isPaid && (
                  <View style={styles.channelsRow}>
                    <View style={[styles.channelPill, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                      <Smartphone color="#06B6D4" size={11} />
                      <Text style={[styles.channelPillText, { color: '#06B6D4' }]}>In-App Popup</Text>
                    </View>
                    <View style={[styles.channelPill, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                      <Bell color="#3B82F6" size={11} />
                      <Text style={[styles.channelPillText, { color: '#3B82F6' }]}>Push</Text>
                    </View>
                    <View style={[styles.channelPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                      <Mail color="#10B981" size={11} />
                      <Text style={[styles.channelPillText, { color: '#10B981' }]}>Email Alert</Text>
                    </View>
                  </View>
                )}

                {/* Notes / Alert */}
                {occ.notes ? (
                  <View style={styles.notesRow}>
                    <Clock color={colors.textMuted} size={12} />
                    <Text style={[styles.notesText, { color: colors.textSecondary }]}>{occ.notes}</Text>
                  </View>
                ) : null}

                {/* Action Controls for Upcoming Bills */}
                {!isPaid && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => handleMarkPaid(occ)}
                      style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    >
                      <CheckCircle2 color="#FFFFFF" size={14} />
                      <Text style={styles.actionBtnText}>1-Click Mark Paid</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSnooze(occ.id)}
                      style={[styles.actionBtnSecondary, { borderColor: colors.inputBorder }]}
                    >
                      <Moon color={colors.textSecondary} size={14} />
                      <Text style={[styles.actionBtnSecondaryText, { color: colors.textSecondary }]}>Snooze 3d</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          })
        ) : (
          /* ================= RULES VIEW ================= */
          bills.map((bill) => {
            const cat = getCategoryDetails(bill.title, bill.category)
            return (
              <TouchableOpacity
                key={bill.id}
                activeOpacity={0.8}
                onPress={() =>
                  setSelectedBill({
                    id: bill.id,
                    recurringPaymentId: bill.id,
                    title: bill.title,
                    amount: bill.amount,
                    category: bill.category,
                    dueDate: bill.nextDueDate,
                    status: 'UPCOMING',
                    notes: `${bill.frequency} automated schedule`,
                  })
                }
                style={[styles.ruleCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
              >
                <View style={styles.ruleHeader}>
                  <CategoryIcon
                    name={bill.title}
                    iconKey={bill.category}
                    color={cat.color}
                    size={20}
                    containerSize={42}
                    containerBg={cat.bg}
                    style={{ marginRight: 12 }}
                  />
                  <View style={styles.ruleInfo}>
                    <Text style={[styles.ruleTitle, { color: colors.text }]}>{bill.title}</Text>
                    <Text style={[styles.ruleMeta, { color: colors.textSecondary }]}>
                      {bill.frequency} • Next Due: {bill.nextDueDate}
                    </Text>
                  </View>
                  <Text style={[styles.ruleAmount, { color: colors.text }]}>
                    {currencySymbol}
                    {bill.amount.toLocaleString()}
                  </Text>
                </View>

                {/* Channels */}
                <View style={styles.channelsRow}>
                  <View style={[styles.channelPill, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                    <Smartphone color="#06B6D4" size={11} />
                    <Text style={[styles.channelPillText, { color: '#06B6D4' }]}>In-App</Text>
                  </View>
                  <View style={[styles.channelPill, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                    <Bell color="#3B82F6" size={11} />
                    <Text style={[styles.channelPillText, { color: '#3B82F6' }]}>Push</Text>
                  </View>
                  <View style={[styles.channelPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Mail color="#10B981" size={11} />
                    <Text style={[styles.channelPillText, { color: '#10B981' }]}>Email</Text>
                  </View>
                  {bill.isAutoDebit && (
                    <View style={[styles.channelPill, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                      <Zap color="#F59E0B" size={11} />
                      <Text style={[styles.channelPillText, { color: '#F59E0B' }]}>Auto-Debit</Text>
                    </View>
                  )}
                </View>

                {bill.isTrial && (
                  <View style={[styles.trialBadge, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                    <ShieldAlert color="#F43F5E" size={12} />
                    <Text style={styles.trialText}>Free Trial Expiring: {bill.trialEndDate}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* Bill Details Modal */}
      <BillDetailsModal
        visible={!!selectedBill}
        bill={selectedBill}
        currencySymbol={currencySymbol}
        onClose={() => setSelectedBill(null)}
        onMarkPaid={handleMarkPaid}
        onSnooze={handleSnooze}
        onDelete={handleDeleteRule}
      />

      {/* Floating Add Bill FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
        style={[styles.fab, { shadowColor: '#2563EB' }]}
      >
        <LinearGradient
          colors={['#2563EB', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Recurring Bill Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(false)} style={StyleSheet.absoluteFill} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder, maxHeight: '88%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Bill & Reminders</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X color={colors.textSecondary} size={22} />
                </TouchableOpacity>
              </View>

              {/* Bill Name */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>BILL / SUBSCRIPTION NAME</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g. Electricity, Netflix, House Rent"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                />
              </View>

              {/* Amount */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>AMOUNT ({currencySymbol})</Text>
                <TextInput
                  value={newAmount}
                  onChangeText={setNewAmount}
                  placeholder="1,499"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                />
              </View>

              {/* Category & Date Row */}
              <View style={styles.modalRow}>
                <View style={[styles.modalInputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
                  <TextInput
                    value={newCategory}
                    onChangeText={setNewCategory}
                    style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  />
                </View>
                <View style={[styles.modalInputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>NEXT DUE DATE</Text>
                  <TextInput
                    value={newDate}
                    onChangeText={setNewDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  />
                </View>
              </View>

              {/* Reminder Notification Channels Section */}
              <View style={[styles.reminderSectionBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <View style={styles.reminderHeaderRow}>
                  <BellRing color="#3B82F6" size={16} />
                  <Text style={[styles.reminderSectionTitle, { color: colors.text }]}>Reminder Channels</Text>
                </View>
                <Text style={[styles.reminderSectionSub, { color: colors.textSecondary }]}>
                  Choose where to receive alerts when payment date approaches
                </Text>

                {/* In-App Popup Toggle */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setEnableInAppPopup(!enableInAppPopup)}
                  style={styles.channelRow}
                >
                  <View style={styles.channelRowLeft}>
                    <Smartphone color="#06B6D4" size={16} />
                    <View>
                      <Text style={[styles.channelRowTitle, { color: colors.text }]}>In-App Urgent Popup</Text>
                      <Text style={[styles.channelRowSub, { color: colors.textSecondary }]}>Modal banner when opening app</Text>
                    </View>
                  </View>
                  <Switch
                    value={enableInAppPopup}
                    onValueChange={setEnableInAppPopup}
                    trackColor={{ false: '#334155', true: '#06B6D4' }}
                    thumbColor="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Mobile Push Toggle */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setEnablePush(!enablePush)}
                  style={styles.channelRow}
                >
                  <View style={styles.channelRowLeft}>
                    <Bell color="#3B82F6" size={16} />
                    <View>
                      <Text style={[styles.channelRowTitle, { color: colors.text }]}>Device Push Notification</Text>
                      <Text style={[styles.channelRowSub, { color: colors.textSecondary }]}>Phone lockscreen reminder</Text>
                    </View>
                  </View>
                  <Switch
                    value={enablePush}
                    onValueChange={setEnablePush}
                    trackColor={{ false: '#334155', true: '#3B82F6' }}
                    thumbColor="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Email Alert Toggle */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setEnableEmail(!enableEmail)}
                  style={styles.channelRow}
                >
                  <View style={styles.channelRowLeft}>
                    <Mail color="#10B981" size={16} />
                    <View>
                      <Text style={[styles.channelRowTitle, { color: colors.text }]}>Email Alert</Text>
                      <Text style={[styles.channelRowSub, { color: colors.textSecondary }]}>To: {user?.email || 'Registered Email'}</Text>
                    </View>
                  </View>
                  <Switch
                    value={enableEmail}
                    onValueChange={setEnableEmail}
                    trackColor={{ false: '#334155', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* Advance Lead Days Selection */}
              <View style={[styles.reminderSectionBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, marginTop: 10 }]}>
                <Text style={[styles.reminderSectionTitle, { color: colors.text, marginBottom: 8 }]}>Alert Schedule (Days Before)</Text>
                <View style={styles.daysGrid}>
                  {[
                    { label: '7 Days Before', val: 7 },
                    { label: '3 Days Before', val: 3 },
                    { label: '1 Day Before', val: 1 },
                    { label: 'On Due Day', val: 0 },
                  ].map((d) => {
                    const isSelected = selectedDays.includes(d.val)
                    return (
                      <TouchableOpacity
                        key={d.val}
                        activeOpacity={0.7}
                        onPress={() => toggleDay(d.val)}
                        style={[
                          styles.dayPill,
                          {
                            backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : colors.surfaceGlass,
                            borderColor: isSelected ? '#38BDF8' : colors.surfaceGlassBorder,
                          },
                        ]}
                      >
                        {isSelected && <Check color="#38BDF8" size={12} style={{ marginRight: 4 }} />}
                        <Text style={[styles.dayPillText, { color: isSelected ? '#38BDF8' : colors.textSecondary }]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity onPress={handleCreateBill} style={styles.modalSubmitBtn}>
                <LinearGradient
                  colors={['#2563EB', '#06B6D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalGradientBtn}
                >
                  <Text style={styles.modalSubmitText}>Save Rule & Activate Multi-Alerts</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { paddingHorizontal: 16, paddingTop: 10 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: { padding: 16, paddingBottom: 80 },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  noticeIconWrap: { marginRight: 12 },
  noticeTextWrap: { flex: 1 },
  noticeTitle: { fontSize: 13, fontWeight: '800' },
  noticeSub: { fontSize: 11, marginTop: 2 },
  billCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billDetails: { flex: 1 },
  billTitle: { fontSize: 14, fontWeight: '800' },
  billMeta: { fontSize: 11, marginTop: 2 },
  billAmountWrap: { alignItems: 'flex-end' },
  billAmount: { fontSize: 15, fontWeight: '900' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: { fontSize: 9, fontWeight: '800' },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  notesText: { fontSize: 11 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 10,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  actionBtnSecondary: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnSecondaryText: { fontSize: 11, fontWeight: '700' },
  ruleCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleInfo: { flex: 1 },
  ruleTitle: { fontSize: 14, fontWeight: '800' },
  ruleMeta: { fontSize: 11, marginTop: 2 },
  ruleAmount: { fontSize: 15, fontWeight: '900' },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  trialText: { color: '#F43F5E', fontSize: 11, fontWeight: '700' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalInputGroup: { marginBottom: 14 },
  modalLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  modalRow: { flexDirection: 'row' },
  modalSubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  modalGradientBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  channelPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  testEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  testEmailBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A855F7',
  },
  reminderSectionBox: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 8,
  },
  reminderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reminderSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  reminderSectionSub: {
    fontSize: 10,
    marginBottom: 10,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  channelRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  channelRowTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  channelRowSub: {
    fontSize: 9,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
})
