import React from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
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
  CheckCircle2,
} from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'
import { formatLocalDateTime } from '../utils/dateUtils'

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
}

export const TransactionDetailsModal: React.FC<Props> = ({
  visible,
  transaction,
  currencySymbol,
  onClose,
  onDelete,
}) => {
  const { colors } = useAppTheme()

  if (!transaction) return null

  const isIncome = transaction.type === 'income'

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to remove "${transaction.title}" from your ledger?`,
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
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
                <Text style={styles.typePillText}>{isIncome ? 'INCOME RECEIVED' : 'EXPENSE RECORD'}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>

            <Text style={styles.txAmount}>
              {isIncome ? '+' : '-'}
              {currencySymbol}
              {transaction.amount.toLocaleString()}
            </Text>
            <Text style={styles.txTitle}>{transaction.title}</Text>
          </LinearGradient>

          {/* Details Content */}
          <ScrollView contentContainerStyle={styles.content}>
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
            {transaction.notes ? (
              <View style={[styles.notesCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <View style={styles.notesHeader}>
                  <FileText color={colors.textSecondary} size={14} />
                  <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>NOTES / DESCRIPTION</Text>
                </View>
                <Text style={[styles.notesBody, { color: colors.text }]}>{transaction.notes}</Text>
              </View>
            ) : null}

            {/* Actions Grid */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity onPress={handleShare} style={[styles.actionButton, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <Share2 color={colors.text} size={16} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Share Receipt</Text>
              </TouchableOpacity>

              {onDelete && (
                <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, { backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}>
                  <Trash2 color="#F43F5E" size={16} />
                  <Text style={[styles.actionButtonText, { color: "#F43F5E" }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
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
    maxHeight: '85%',
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    padding: 16,
    paddingBottom: 32,
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
})
