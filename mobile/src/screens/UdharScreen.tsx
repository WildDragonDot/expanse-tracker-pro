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
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Plus,
  X,
  Phone,
  Clock,
  Send,
  HandCoins,
} from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

interface UdharRecord {
  id: string
  personName: string
  phoneNumber?: string
  amount: number
  type: 'LENT' | 'BORROWED' // LENT = You will receive, BORROWED = You have to pay
  dueDate?: string
  status: 'PENDING' | 'SETTLED'
  notes?: string
}

export const UdharScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'ALL' | 'LENT' | 'BORROWED'>('ALL')

  const [records, setRecords] = useState<UdharRecord[]>([
    {
      id: 'u1',
      personName: 'Rahul Sharma',
      phoneNumber: '+919876543210',
      amount: 4500,
      type: 'LENT',
      dueDate: '2026-08-30',
      status: 'PENDING',
      notes: 'Weekend trip split share',
    },
    {
      id: 'u2',
      personName: 'Amit Verma',
      phoneNumber: '+919811223344',
      amount: 1800,
      type: 'LENT',
      dueDate: '2026-08-25',
      status: 'PENDING',
      notes: 'Dinner bill contribution',
    },
    {
      id: 'u3',
      personName: 'Pooja Singh',
      phoneNumber: '+919777888999',
      amount: 2200,
      type: 'BORROWED',
      dueDate: '2026-09-01',
      status: 'PENDING',
      notes: 'Flight booking share',
    },
    {
      id: 'u4',
      personName: 'Vikram Joshi',
      phoneNumber: '+919666555444',
      amount: 5000,
      type: 'LENT',
      dueDate: '2026-08-10',
      status: 'SETTLED',
      notes: 'Settled via Google Pay on Aug 10',
    },
  ])

  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<'LENT' | 'BORROWED'>('LENT')
  const [dueDate, setDueDate] = useState('2026-09-05')
  const [notes, setNotes] = useState('')

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const totalLent = records
    .filter((r) => r.type === 'LENT' && r.status === 'PENDING')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalBorrowed = records
    .filter((r) => r.type === 'BORROWED' && r.status === 'PENDING')
    .reduce((sum, r) => sum + r.amount, 0)

  const handleSettle = (id: string) => {
    Alert.alert('Settle Record', 'Confirm that this amount has been fully settled?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark as Settled',
        style: 'default',
        onPress: () => {
          setRecords((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'SETTLED' } : r))
          )
        },
      },
    ])
  }

  const handleSendReminder = (record: UdharRecord) => {
    Alert.alert(
      'Send WhatsApp / SMS Reminder',
      `Reminder prepared for ${record.personName} for ${currencySymbol}${record.amount.toLocaleString()}. Message: "Hi ${record.personName}, friendly reminder regarding the pending amount of ${currencySymbol}${record.amount} on FinanceTracker Pro."`,
      [{ text: 'Send Now' }]
    )
  }

  const handleSave = () => {
    if (!personName || !amount) {
      Alert.alert('Required', 'Please enter person name and amount.')
      return
    }

    const newRecord: UdharRecord = {
      id: 'u_' + Date.now(),
      personName: personName.trim(),
      phoneNumber: phone.trim(),
      amount: parseFloat(amount),
      type,
      dueDate,
      status: 'PENDING',
      notes: notes.trim(),
    }

    setRecords((prev) => [newRecord, ...prev])
    setModalVisible(false)
    setPersonName('')
    setAmount('')
    setPhone('')
    setNotes('')
  }

  const filteredRecords =
    activeTab === 'ALL' ? records : records.filter((r) => r.type === activeTab)

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Summary Cards */}
      <View style={styles.summaryRow}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>YOU ARE OWED</Text>
            <HandCoins color="#FFFFFF" size={16} />
          </View>
          <Text style={styles.summaryAmount}>
            {currencySymbol}
            {totalLent.toLocaleString()}
          </Text>
          <Text style={styles.summarySub}>From friends & peers</Text>
        </LinearGradient>

        <LinearGradient
          colors={['#F43F5E', '#E11D48']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>YOU OWE</Text>
            <HandCoins color="#FFFFFF" size={16} />
          </View>
          <Text style={styles.summaryAmount}>
            {currencySymbol}
            {totalBorrowed.toLocaleString()}
          </Text>
          <Text style={styles.summarySub}>Pending to repay</Text>
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {(['ALL', 'LENT', 'BORROWED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabBtn,
              {
                backgroundColor:
                  activeTab === tab ? colors.primary : colors.surfaceGlass,
                borderColor: colors.surfaceGlassBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === tab ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {tab === 'ALL'
                ? 'All Udhar'
                : tab === 'LENT'
                ? 'You Gave (Lent)'
                : 'You Took (Borrowed)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Records List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredRecords.map((r) => {
          const isSettled = r.status === 'SETTLED'
          const isLent = r.type === 'LENT'

          return (
            <View
              key={r.id}
              style={[
                styles.recordCard,
                {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.surfaceGlassBorder,
                  opacity: isSettled ? 0.65 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.avatarCircle,
                    {
                      backgroundColor: isLent
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(244, 63, 94, 0.15)',
                    },
                  ]}
                >
                  <Users color={isLent ? '#10B981' : '#F43F5E'} size={18} />
                </View>
                <View style={styles.recordDetails}>
                  <Text style={[styles.personName, { color: colors.text }]}>
                    {r.personName}
                  </Text>
                  <Text style={[styles.recordMeta, { color: colors.textSecondary }]}>
                    {isLent ? 'Lent to' : 'Borrowed from'} • Due: {r.dueDate}
                  </Text>
                </View>
                <View style={styles.amountWrap}>
                  <Text
                    style={[
                      styles.recordAmount,
                      { color: isLent ? '#10B981' : '#F43F5E' },
                    ]}
                  >
                    {isLent ? '+' : '-'}
                    {currencySymbol}
                    {r.amount.toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isSettled
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isSettled ? '#10B981' : '#F59E0B' },
                      ]}
                    >
                      {r.status}
                    </Text>
                  </View>
                </View>
              </View>

              {r.notes ? (
                <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                  {r.notes}
                </Text>
              ) : null}

              {/* Action Buttons */}
              {!isSettled && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleSettle(r.id)}
                    style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                  >
                    <CheckCircle2 color="#FFFFFF" size={14} />
                    <Text style={styles.actionBtnText}>1-Click Settle Up</Text>
                  </TouchableOpacity>

                  {isLent && (
                    <TouchableOpacity
                      onPress={() => handleSendReminder(r)}
                      style={[
                        styles.actionBtnSecondary,
                        { borderColor: colors.inputBorder },
                      ]}
                    >
                      <Send color={colors.primary} size={14} />
                      <Text
                        style={[
                          styles.actionBtnSecondaryText,
                          { color: colors.primary },
                        ]}
                      >
                        Send Reminder
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>

      {/* Floating Add FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
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

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceGlassBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Udhar / Debt Entry
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            {/* Type Selector */}
            <View style={styles.typeSwitcher}>
              <TouchableOpacity
                onPress={() => setType('LENT')}
                style={[
                  styles.typeBtn,
                  type === 'LENT' && { backgroundColor: '#10B981' },
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: type === 'LENT' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  I Gave (Lent)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType('BORROWED')}
                style={[
                  styles.typeBtn,
                  type === 'BORROWED' && { backgroundColor: '#F43F5E' },
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    {
                      color:
                        type === 'BORROWED' ? '#FFFFFF' : colors.textSecondary,
                    },
                  ]}
                >
                  I Took (Borrowed)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                PERSON NAME
              </Text>
              <TextInput
                value={personName}
                onChangeText={setPersonName}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                AMOUNT ({currencySymbol})
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="3,000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                REASON / NOTES
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Dinner bill split"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <LinearGradient
                colors={colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                <Text style={styles.saveBtnText}>Save Udhar Record</Text>
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
  summaryRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 6,
  },
  summarySub: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 11 },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabBtnText: { fontSize: 11, fontWeight: '800' },
  scrollContent: { padding: 16, paddingBottom: 80 },
  recordCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordDetails: { flex: 1 },
  personName: { fontSize: 14, fontWeight: '800' },
  recordMeta: { fontSize: 11, marginTop: 2 },
  amountWrap: { alignItems: 'flex-end' },
  recordAmount: { fontSize: 15, fontWeight: '900' },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: { fontSize: 9, fontWeight: '800' },
  notesText: {
    fontSize: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnSecondaryText: { fontSize: 11, fontWeight: '700' },
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
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  typeSwitcher: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  typeText: { fontSize: 12, fontWeight: '800' },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  saveGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
