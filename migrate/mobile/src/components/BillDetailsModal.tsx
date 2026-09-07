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
  Clock,
  CheckCircle2,
  Moon,
  AlertTriangle,
  CreditCard,
  Bell,
  X,
  Trash2,
} from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'
import { CategoryIcon } from './CategoryIcon'
import { BillOccurrence } from '../types'

interface Props {
  visible: boolean
  bill: BillOccurrence | null
  currencySymbol: string
  onClose: () => void
  onMarkPaid: (bill: BillOccurrence) => void
  onSnooze: (id: string) => void
  onDelete?: (id: string) => void
}

export const BillDetailsModal: React.FC<Props> = ({
  visible,
  bill,
  currencySymbol,
  onClose,
  onMarkPaid,
  onSnooze,
  onDelete,
}) => {
  const { colors } = useAppTheme()

  if (!bill) return null

  const isPaid = bill.status === 'PAID'
  const isSnoozed = bill.status === 'SNOOZED'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
          {/* Header Gradient */}
          <LinearGradient
            colors={isPaid ? ['#059669', '#10B981'] : isSnoozed ? ['#D97706', '#F59E0B'] : ['#1E3A8A', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerTop}>
              <View style={styles.badgePill}>
                <CategoryIcon name={bill.title} iconKey={bill.category} color="#FFFFFF" size={14} />
                <Text style={styles.badgePillText}>{bill.status} • {bill.category.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>

            <Text style={styles.billAmount}>
              {currencySymbol}{bill.amount.toLocaleString()}
            </Text>
            <Text style={styles.billTitle}>{bill.title}</Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Meta Grid */}
            <View style={[styles.metaBox, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Category</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{bill.category}</Text>
              </View>
              <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: colors.inputBorder }]}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Due Date</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{bill.dueDate}</Text>
              </View>
              <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: colors.inputBorder }]}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Reminder Tier</Text>
                <Text style={[styles.metaValue, { color: colors.primary }]}>Active (7d, 3d, Due Day)</Text>
              </View>
            </View>

            {/* Notes */}
            {bill.notes ? (
              <View style={[styles.notesCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>AUTONOMOUS REMINDER NOTES</Text>
                <Text style={[styles.notesBody, { color: colors.text }]}>{bill.notes}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            {!isPaid && (
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  onPress={() => {
                    onMarkPaid(bill)
                    onClose()
                  }}
                  style={[styles.primaryBtn, { backgroundColor: '#10B981' }]}
                >
                  <CheckCircle2 color="#FFFFFF" size={16} />
                  <Text style={styles.primaryBtnText}>1-Click Mark as Paid</Text>
                </TouchableOpacity>

                <View style={styles.secondaryRow}>
                  <TouchableOpacity
                    onPress={() => {
                      onSnooze(bill.id)
                      onClose()
                    }}
                    style={[styles.secondaryBtn, { borderColor: colors.inputBorder }]}
                  >
                    <Moon color={colors.textSecondary} size={15} />
                    <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Snooze 3 Days</Text>
                  </TouchableOpacity>

                  {onDelete && (
                    <TouchableOpacity
                      onPress={() => {
                        onDelete(bill.id)
                        onClose()
                      }}
                      style={[styles.secondaryBtn, { borderColor: 'rgba(244, 63, 94, 0.3)', backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}
                    >
                      <Trash2 color="#F43F5E" size={15} />
                      <Text style={[styles.secondaryBtnText, { color: '#F43F5E' }]}>Delete Rule</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
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
    maxHeight: '80%',
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
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
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
  billAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  billTitle: {
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
  metaLabel: { fontSize: 12, fontWeight: '600' },
  metaValue: { fontSize: 13, fontWeight: '700' },
  notesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  notesBody: { fontSize: 13, lineHeight: 18 },
  actionsGrid: { marginTop: 4 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginBottom: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '700' },
})
