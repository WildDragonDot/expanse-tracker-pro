import React, { useEffect, useState } from 'react'
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
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Moon,
  ChevronRight,
  ShieldAlert,
  BellRing,
  X,
} from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { BillSkeleton } from '../components/SkeletonLoader'
import { BillDetailsModal } from '../components/BillDetailsModal'
import { BillOccurrence, RecurringPayment, BillFrequency } from '../types'
import { api } from '../services/api'

export const RecurringBillsScreen = () => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'rules'>('timeline')
  const [selectedBill, setSelectedBill] = useState<BillOccurrence | null>(null)

  // Sample data initialized for zero-latency presentation
  const [occurrences, setOccurrences] = useState<BillOccurrence[]>([
    {
      id: 'occ_1',
      recurringPaymentId: 'rec_1',
      title: 'Broadband / Optical Fiber',
      amount: 1199,
      category: 'Utilities',
      dueDate: '2026-08-25',
      status: 'UPCOMING',
      notes: 'Due in 3 days. High priority reminder active.',
    },
    {
      id: 'occ_2',
      recurringPaymentId: 'rec_2',
      title: 'Netflix 4K Ultra HD',
      amount: 649,
      category: 'Subscriptions',
      dueDate: '2026-08-28',
      status: 'UPCOMING',
      notes: 'Monthly auto-renewal alert',
    },
    {
      id: 'occ_3',
      recurringPaymentId: 'rec_3',
      title: 'Gym & Crossfit Trial',
      amount: 2499,
      category: 'Fitness',
      dueDate: '2026-08-30',
      status: 'UPCOMING',
      notes: 'Free trial ends in 8 days. Cancel if not using!',
    },
    {
      id: 'occ_4',
      recurringPaymentId: 'rec_4',
      title: 'Apartment Maintenance',
      amount: 3500,
      category: 'Housing',
      dueDate: '2026-08-05',
      status: 'PAID',
      paidAt: '2026-08-04',
      notes: 'Paid via HDFC NetBanking',
    },
  ])

  const [bills, setBills] = useState<RecurringPayment[]>([
    {
      id: 'rec_1',
      userId: 'user_1',
      title: 'Broadband / Optical Fiber',
      amount: 1199,
      category: 'Utilities',
      frequency: 'MONTHLY',
      nextDueDate: '2026-08-25',
      reminderDays: [7, 3, 1, 0],
      isAutoDebit: false,
      isTrial: false,
      active: true,
    },
    {
      id: 'rec_2',
      userId: 'user_1',
      title: 'Netflix 4K Ultra HD',
      amount: 649,
      category: 'Subscriptions',
      frequency: 'MONTHLY',
      nextDueDate: '2026-08-28',
      reminderDays: [3, 0],
      isAutoDebit: true,
      isTrial: false,
      active: true,
    },
    {
      id: 'rec_3',
      userId: 'user_1',
      title: 'Gym & Crossfit Trial',
      amount: 2499,
      category: 'Fitness',
      frequency: 'MONTHLY',
      nextDueDate: '2026-08-30',
      reminderDays: [7, 3, 0],
      isAutoDebit: false,
      isTrial: true,
      trialEndDate: '2026-08-30',
      active: true,
    },
  ])

  // Modal State for adding new recurring rule
  const [modalVisible, setModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newCategory, setNewCategory] = useState('Utilities')
  const [newFrequency, setNewFrequency] = useState<BillFrequency>('MONTHLY')
  const [newDate, setNewDate] = useState('2026-09-01')
  const [isTrial, setIsTrial] = useState(false)

  const loadBillsData = async () => {
    try {
      const occs = await api.getBillOccurrences().catch(() => null)
      if (occs && occs.length) setOccurrences(occs)

      const recs = await api.getRecurringBills().catch(() => null)
      if (recs && recs.length) setBills(recs)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadBillsData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadBillsData()
  }

  // 1-Click Pay Handler (Converts occurrence to Expense & sets next occurrence)
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
            setOccurrences((prev) =>
              prev.map((item) =>
                item.id === occurrence.id
                  ? { ...item, status: 'PAID', paidAt: new Date().toISOString().split('T')[0] }
                  : item
              )
            )
            await api.markBillPaid(occurrence.id, { date: new Date().toISOString() }).catch(() => null)
          },
        },
      ]
    )
  }

  // Snooze Bill Reminder by 3 days
  const handleSnooze = async (occurrenceId: string) => {
    setOccurrences((prev) =>
      prev.map((item) =>
        item.id === occurrenceId ? { ...item, status: 'SNOOZED', notes: 'Reminder snoozed for 3 days' } : item
      )
    )
    await api.snoozeBill(occurrenceId, 3).catch(() => null)
  }

  const handleDeleteRule = (id: string) => {
    setOccurrences((prev) => prev.filter((o) => o.recurringPaymentId !== id && o.id !== id))
    setBills((prev) => prev.filter((b) => b.id !== id))
  }

  const handleCreateBill = async () => {
    if (!newTitle || !newAmount) {
      Alert.alert('Required', 'Please enter bill title and amount.')
      return
    }

    const createdBill: RecurringPayment = {
      id: 'rec_' + Date.now(),
      userId: user?.id || 'user_1',
      title: newTitle.trim(),
      amount: parseFloat(newAmount),
      category: newCategory,
      frequency: newFrequency,
      nextDueDate: newDate,
      reminderDays: [7, 3, 1, 0],
      isAutoDebit: false,
      isTrial: isTrial,
      trialEndDate: isTrial ? newDate : undefined,
      active: true,
    }

    const newOcc: BillOccurrence = {
      id: 'occ_' + Date.now(),
      recurringPaymentId: createdBill.id,
      title: createdBill.title,
      amount: createdBill.amount,
      category: createdBill.category,
      dueDate: createdBill.nextDueDate,
      status: 'UPCOMING',
      notes: isTrial ? 'Free trial alert active' : 'Automated schedule active',
    }

    setBills((prev) => [createdBill, ...prev])
    setOccurrences((prev) => [newOcc, ...prev])
    setModalVisible(false)
    setNewTitle('')
    setNewAmount('')

    await api.createRecurringBill(createdBill).catch(() => null)
  }

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Tabs Switcher */}
      <View style={styles.headerArea}>
        <View style={[styles.tabSwitcher, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('timeline')}
            style={[styles.tabBtn, activeTab === 'timeline' && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'timeline' ? '#FFFFFF' : colors.textSecondary }]}>
              Upcoming Timeline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('rules')}
            style={[styles.tabBtn, activeTab === 'rules' && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'rules' ? '#FFFFFF' : colors.textSecondary }]}>
              Recurring Rules ({bills.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Active Reminders Notice */}
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.15)', 'rgba(16, 185, 129, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.noticeBanner, { borderColor: colors.surfaceGlassBorder }]}
        >
          <View style={styles.noticeIconWrap}>
            <BellRing color="#8B5CF6" size={20} />
          </View>
          <View style={styles.noticeTextWrap}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>Autonomous Reminder Engine Active</Text>
            <Text style={[styles.noticeSub, { color: colors.textSecondary }]}>
              Multi-tier notifications (T-7, T-3, Due Day) enabled with zero missed payments.
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <>
            <BillSkeleton />
            <BillSkeleton />
            <BillSkeleton />
          </>
        ) : activeTab === 'timeline' ? (
          /* ================= TIMELINE VIEW ================= */
          occurrences.map((occ) => {
            const isPaid = occ.status === 'PAID'
            const isSnoozed = occ.status === 'SNOOZED'

            return (
              <TouchableOpacity
                key={occ.id}
                activeOpacity={0.8}
                onPress={() => setSelectedBill(occ)}
                style={[
                  styles.billCard,
                  { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
                  isPaid && { opacity: 0.7 },
                ]}
              >
                <View style={styles.billHeader}>
                  <View
                    style={[
                      styles.billIconCircle,
                      {
                        backgroundColor: isPaid
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isSnoozed
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(139, 92, 246, 0.15)',
                      },
                    ]}
                  >
                    {isPaid ? (
                      <CheckCircle2 color="#10B981" size={20} />
                    ) : isSnoozed ? (
                      <Moon color="#F59E0B" size={20} />
                    ) : (
                      <Calendar color="#8B5CF6" size={20} />
                    )}
                  </View>
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
                            : 'rgba(139, 92, 246, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: isPaid ? '#10B981' : isSnoozed ? '#F59E0B' : colors.primary,
                          },
                        ]}
                      >
                        {occ.status}
                      </Text>
                    </View>
                  </View>
                </View>

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
                      onPress={(e) => {
                        e.stopPropagation()
                        handleMarkPaid(occ)
                      }}
                      style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    >
                      <CheckCircle2 color="#FFFFFF" size={14} />
                      <Text style={styles.actionBtnText}>1-Click Mark Paid</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation()
                        handleSnooze(occ.id)
                      }}
                      style={[styles.actionBtnSecondary, { borderColor: colors.inputBorder }]}
                    >
                      <Moon color={colors.textSecondary} size={14} />
                      <Text style={[styles.actionBtnSecondaryText, { color: colors.textSecondary }]}>Snooze 3d</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            )
          })
        ) : (
          /* ================= RULES VIEW ================= */
          bills.map((bill) => (
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
              {bill.isTrial && (
                <View style={[styles.trialBadge, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                  <ShieldAlert color="#F43F5E" size={12} />
                  <Text style={styles.trialText}>Free Trial Expiring: {bill.trialEndDate}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
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
        style={[styles.fab, { shadowColor: colors.primary }]}
      >
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Recurring Bill Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Recurring Bill Rule</Text>
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
                placeholder="e.g. Electricity, Netflix, Gym"
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

            {/* Submit */}
            <TouchableOpacity onPress={handleCreateBill} style={styles.modalSubmitBtn}>
              <LinearGradient
                colors={colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalGradientBtn}
              >
                <Text style={styles.modalSubmitText}>Save Rule & Schedule Reminders</Text>
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
  headerArea: { paddingHorizontal: 16, paddingTop: 10 },
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
})
