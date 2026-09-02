import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Building2,
  CreditCard,
  Tag,
  FileText,
  Trash2,
  Edit3,
  Share2,
  X,
  Check,
  History,
  Clock,
} from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'
import { formatLocalDateTime } from '../utils/dateUtils'
import { api } from '../services/api'

export interface TransactionItem {
  id: string
  title: string
  amount: number
  type: 'expense' | 'income'
  date: string
  category: string
  bank?: string
  paymentMode?: string
  notes?: string
}

interface Props {
  visible: boolean
  transaction: TransactionItem | null
  currencySymbol: string
  onClose: () => void
  onDelete?: (id: string) => void
  onUpdate?: () => void
}

const CATEGORIES_LIST = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Investment',
  'Salary',
  'Other',
]

const BANKS_LIST = ['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Cash Wallet', 'Primary Bank']
const MODES_LIST = ['UPI', 'Cash', 'Net Banking', 'Card', 'Udhar', 'Wallet']

export const TransactionDetailsModal: React.FC<Props> = ({
  visible,
  transaction,
  currencySymbol,
  onClose,
  onDelete,
  onUpdate,
}) => {
  const { colors } = useAppTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit Form Fields
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editBank, setEditBank] = useState('')
  const [editMode, setEditMode] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Sync state on transaction change
  useEffect(() => {
    if (transaction) {
      setEditTitle(transaction.title || '')
      setEditAmount(transaction.amount?.toString() || '')
      setEditCategory(transaction.category || (transaction.type === 'income' ? 'Salary' : 'Food'))
      setEditBank(transaction.bank || 'HDFC Bank')
      setEditMode(transaction.paymentMode || 'UPI')
      
      // Clean notes without history lines for the edit input
      const cleanNotes = (transaction.notes || '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('[Edited on'))
        .join('\n')
        .trim()
      setEditNotes(cleanNotes)
      setIsEditing(false)
    }
  }, [transaction, visible])

  if (!transaction) return null

  const isIncome = transaction.type === 'income'

  // Parse change history from notes
  const historyEntries = (transaction.notes || '')
    .split('\n')
    .filter((line) => line.trim().startsWith('[Edited on'))
    .map((line) => line.trim().replace(/^\[|\]$/g, ''))

  const cleanUserNotes = (transaction.notes || '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('[Edited on'))
    .join('\n')
    .trim()

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to remove "${transaction.title}" from your ledger? All dependent calculations will update immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(transaction.id)
            onClose()
          },
        },
      ]
    )
  }

  const handleShare = () => {
    Alert.alert(
      'Share Receipt',
      `Transaction receipt for "${transaction.title}" (${currencySymbol}${transaction.amount.toLocaleString()}) copied to clipboard.`
    )
  }

  const handleSaveEdit = async () => {
    const numAmount = parseFloat(editAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.')
      return
    }
    if (!editTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a title or source name.')
      return
    }

    setSaving(true)
    try {
      if (isIncome) {
        await api.updateIncome(transaction.id, {
          source: editTitle.trim(),
          amount: Math.round(numAmount),
          notes: editNotes.trim(),
        })
      } else {
        await api.updateExpense(transaction.id, {
          title: editTitle.trim(),
          amount: Math.round(numAmount),
          category: editCategory,
          bank: editBank,
          paymentMode: editMode,
          notes: editNotes.trim(),
        })
      }

      setIsEditing(false)
      if (onUpdate) {
        onUpdate()
      }
      onClose()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update transaction.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
          {/* Header Gradient */}
          <LinearGradient
            colors={isIncome ? ['#10B981', '#059669'] : ['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerTop}>
              <View style={styles.typePill}>
                {isIncome ? <ArrowDownLeft color="#FFFFFF" size={14} /> : <ArrowUpRight color="#FFFFFF" size={14} />}
                <Text style={styles.typePillText}>
                  {isEditing ? 'EDIT TRANSACTION' : isIncome ? 'INCOME RECEIVED' : 'EXPENSE RECORD'}
                </Text>
              </View>

              <View style={styles.headerActionIcons}>
                {/* Pencil Edit Icon Button */}
                <TouchableOpacity
                  onPress={() => setIsEditing(!isEditing)}
                  style={[styles.iconBtn, isEditing && styles.activeIconBtn]}
                  activeOpacity={0.8}
                >
                  <Edit3 color="#FFFFFF" size={16} />
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.8}>
                  <X color="#FFFFFF" size={18} />
                </TouchableOpacity>
              </View>
            </View>

            {!isEditing ? (
              <>
                <Text style={styles.txAmount}>
                  {isIncome ? '+' : '-'}
                  {currencySymbol}
                  {transaction.amount.toLocaleString()}
                </Text>
                <Text style={styles.txTitle}>{transaction.title}</Text>
              </>
            ) : (
              <Text style={styles.editingBannerText}>Editing Amount, Details & Ledger Metadata</Text>
            )}
          </LinearGradient>

          {/* Details / Edit Content */}
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {isEditing ? (
              /* --- EDIT FORM MODE --- */
              <View style={styles.editFormContainer}>
                {/* Amount Input */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>AMOUNT ({currencySymbol})</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <Text style={[styles.currencyPrefix, { color: colors.primary }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.amountInput, { color: colors.text }]}
                    keyboardType="numeric"
                    value={editAmount}
                    onChangeText={setEditAmount}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Title / Description */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  {isIncome ? 'INCOME SOURCE / TITLE' : 'EXPENSE TITLE'}
                </Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="e.g. Salary, Grocery, Rent"
                  placeholderTextColor={colors.textMuted}
                />

                {!isIncome && (
                  <>
                    {/* Category Selector */}
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                      {CATEGORIES_LIST.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setEditCategory(cat)}
                          style={[
                            styles.selectorPill,
                            { borderColor: colors.inputBorder, backgroundColor: colors.surfaceGlass },
                            editCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectorPillText,
                              { color: colors.textSecondary },
                              editCategory === cat && { color: '#FFFFFF', fontWeight: '800' },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Bank / Account Selector */}
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>BANK / ACCOUNT</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                      {BANKS_LIST.map((b) => (
                        <TouchableOpacity
                          key={b}
                          onPress={() => setEditBank(b)}
                          style={[
                            styles.selectorPill,
                            { borderColor: colors.inputBorder, backgroundColor: colors.surfaceGlass },
                            editBank === b && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectorPillText,
                              { color: colors.textSecondary },
                              editBank === b && { color: '#FFFFFF', fontWeight: '800' },
                            ]}
                          >
                            {b}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Payment Mode Selector */}
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>PAYMENT MODE</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                      {MODES_LIST.map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setEditMode(m)}
                          style={[
                            styles.selectorPill,
                            { borderColor: colors.inputBorder, backgroundColor: colors.surfaceGlass },
                            editMode === m && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectorPillText,
                              { color: colors.textSecondary },
                              editMode === m && { color: '#FFFFFF', fontWeight: '800' },
                            ]}
                          >
                            {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                {/* Notes Input */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>NOTES (OPTIONAL)</Text>
                <TextInput
                  style={[styles.notesInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Add details, transaction ID, receipt reference..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                />

                {/* Edit Form Actions */}
                <View style={styles.editActionsRow}>
                  <TouchableOpacity
                    onPress={() => setIsEditing(false)}
                    style={[styles.cancelBtn, { borderColor: colors.inputBorder, backgroundColor: colors.surfaceGlass }]}
                    disabled={saving}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Check color="#FFFFFF" size={16} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* --- VIEW DETAILS MODE --- */
              <>
                {/* Meta Grid */}
                <View style={[styles.metaBox, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                  {/* Category */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaLeft}>
                      <Tag color={colors.primary} size={16} />
                      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Category</Text>
                    </View>
                    <View style={[styles.categoryBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                      <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{transaction.category}</Text>
                    </View>
                  </View>

                  {/* Date */}
                  <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: colors.inputBorder }]}>
                    <View style={styles.metaLeft}>
                      <Calendar color={colors.textSecondary} size={16} />
                      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Date & Time</Text>
                    </View>
                    <Text style={[styles.metaValue, { color: colors.text }]}>{formatLocalDateTime(transaction.date)}</Text>
                  </View>

                  {/* Bank Account */}
                  <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: colors.inputBorder }]}>
                    <View style={styles.metaLeft}>
                      <Building2 color={colors.textSecondary} size={16} />
                      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Account / Bank</Text>
                    </View>
                    <Text style={[styles.metaValue, { color: colors.text }]}>{transaction.bank || 'Primary Bank'}</Text>
                  </View>

                  {/* Payment Mode */}
                  <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: colors.inputBorder }]}>
                    <View style={styles.metaLeft}>
                      <CreditCard color={colors.textSecondary} size={16} />
                      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Payment Mode</Text>
                    </View>
                    <Text style={[styles.metaValue, { color: colors.text }]}>{transaction.paymentMode || 'UPI / NetBanking'}</Text>
                  </View>
                </View>

                {/* Notes if any */}
                {cleanUserNotes ? (
                  <View style={[styles.notesCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                    <View style={styles.notesHeader}>
                      <FileText color={colors.textSecondary} size={14} />
                      <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>NOTES / DESCRIPTION</Text>
                    </View>
                    <Text style={[styles.notesBody, { color: colors.text }]}>{cleanUserNotes}</Text>
                  </View>
                ) : null}

                {/* Change History / Audit Trail Section */}
                {historyEntries.length > 0 && (
                  <View style={[styles.historyCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                    <View style={styles.historyHeader}>
                      <History color="#8B5CF6" size={14} />
                      <Text style={[styles.historyLabel, { color: '#8B5CF6' }]}>CHANGE AUDIT HISTORY</Text>
                    </View>
                    {historyEntries.map((entry, index) => (
                      <View key={index} style={[styles.historyItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.inputBorder }]}>
                        <Clock color={colors.textMuted} size={12} style={{ marginTop: 2 }} />
                        <Text style={[styles.historyText, { color: colors.textSecondary }]}>{entry}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Actions Grid */}
                <View style={styles.actionsContainer}>
                  {/* Edit Button with Pencil Icon */}
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={[styles.actionButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    <Edit3 color="#FFFFFF" size={16} />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Edit Record</Text>
                  </TouchableOpacity>

                  {/* Share Receipt */}
                  <TouchableOpacity
                    onPress={handleShare}
                    style={[styles.actionButton, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
                  >
                    <Share2 color={colors.text} size={16} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Share</Text>
                  </TouchableOpacity>

                  {/* Delete Button */}
                  {onDelete && (
                    <TouchableOpacity
                      onPress={handleDelete}
                      style={[styles.actionButton, { backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}
                    >
                      <Trash2 color="#F43F5E" size={16} />
                      <Text style={[styles.actionButtonText, { color: '#F43F5E' }]}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 20,
    paddingTop: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  txAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  txTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  editingBannerText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  metaBox: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  notesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  notesBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 6,
  },
  historyText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Edit Form Styles
  editFormContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '900',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    height: 70,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  pillsScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  selectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  selectorPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
})
