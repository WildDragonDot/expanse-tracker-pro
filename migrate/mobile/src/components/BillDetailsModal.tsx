import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
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
  Mail,
  Smartphone,
  Zap,
  Send,
  Calendar,
  ShieldCheck,
} from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'
import { CategoryIcon } from './CategoryIcon'
import { BillOccurrence } from '../types'
import { formatLocalDate } from '../utils/dateUtils'

interface Props {
  visible: boolean
  bill: BillOccurrence | null
  currencySymbol: string
  onClose: () => void
  onMarkPaid: (bill: BillOccurrence) => void
  onSnooze: (id: string) => void
  onDelete?: (id: string) => void
  onSendTestEmail?: (bill: BillOccurrence) => Promise<void>
}

export const BillDetailsModal: React.FC<Props> = ({
  visible,
  bill,
  currencySymbol,
  onClose,
  onMarkPaid,
  onSnooze,
  onDelete,
  onSendTestEmail,
}) => {
  const { colors } = useAppTheme()
  const [sendingAlert, setSendingAlert] = useState(false)

  if (!bill) return null

  const isPaid = bill.status === 'PAID'
  const isSnoozed = bill.status === 'SNOOZED'

  const handleTestEmail = async () => {
    if (!onSendTestEmail) return
    setSendingAlert(true)
    try {
      await onSendTestEmail(bill)
    } finally {
      setSendingAlert(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
          {/* Top Drag Indicator */}
          <View style={styles.dragHandle} />

          {/* Header Gradient */}
          <LinearGradient
            colors={
              isPaid
                ? ['#065F46', '#10B981']
                : isSnoozed
                ? ['#92400E', '#F59E0B']
                : ['#1E3A8A', '#2563EB']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerTop}>
              <View style={styles.badgePill}>
                <CategoryIcon name={bill.title} iconKey={bill.category} color="#FFFFFF" size={13} />
                <Text style={styles.badgePillText}>{bill.status} • {(bill.category || 'UTILITIES').toUpperCase()}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.closeBtn}>
                <X color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.amountPrefix}>{currencySymbol}</Text>
              <Text style={styles.billAmount}>{bill.amount.toLocaleString()}</Text>
            </View>
            <Text style={styles.billTitle}>{bill.title}</Text>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Due Date & Schedule Status Card */}
            <View style={[styles.metaBox, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
              <View style={styles.metaRow}>
                <View style={styles.metaRowLeft}>
                  <Calendar color="#38BDF8" size={16} />
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Payment Due Date</Text>
                </View>
                <Text style={[styles.metaValue, { color: colors.text }]}>{formatLocalDate(bill.dueDate)}</Text>
              </View>

              <View style={[styles.metaRow, { borderTopWidth: 1, borderTopColor: colors.surfaceGlassBorder }]}>
                <View style={styles.metaRowLeft}>
                  <CreditCard color="#10B981" size={16} />
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Category</Text>
                </View>
                <Text style={[styles.metaValue, { color: colors.text }]}>{bill.category}</Text>
              </View>

              <View style={[styles.metaColumnRow, { borderTopWidth: 1, borderTopColor: colors.surfaceGlassBorder }]}>
                <View style={styles.metaRowLeft}>
                  <ShieldCheck color="#F59E0B" size={16} />
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Active Notification Channels</Text>
                </View>
                <View style={styles.activeChannelsRow}>
                  <View style={[styles.channelMiniPill, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                    <Smartphone color="#06B6D4" size={12} />
                    <Text style={{ color: '#06B6D4', fontSize: 11, fontWeight: '800' }}>In-App Alert</Text>
                  </View>
                  <View style={[styles.channelMiniPill, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Bell color="#3B82F6" size={12} />
                    <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '800' }}>Push Notification</Text>
                  </View>
                  <View style={[styles.channelMiniPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Mail color="#10B981" size={12} />
                    <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>Verified Email</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Test Multi-Channel Alert Action */}
            {onSendTestEmail && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleTestEmail}
                disabled={sendingAlert}
                style={[styles.testEmailBtnBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}
              >
                {sendingAlert ? (
                  <ActivityIndicator size="small" color="#38BDF8" />
                ) : (
                  <>
                    <Send color="#38BDF8" size={15} />
                    <Text style={styles.testEmailBtnText}>Send Live Email & Push Alert Now</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

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
                  activeOpacity={0.85}
                  onPress={() => {
                    onMarkPaid(bill)
                    onClose()
                  }}
                  style={styles.primaryBtnWrapper}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    <CheckCircle2 color="#FFFFFF" size={18} strokeWidth={2.5} />
                    <Text style={styles.primaryBtnText}>1-Click Mark as Paid</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.secondaryRow}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      onSnooze(bill.id)
                      onClose()
                    }}
                    style={[styles.secondaryBtn, { borderColor: colors.inputBorder, backgroundColor: colors.surfaceGlass }]}
                  >
                    <Moon color={colors.textSecondary} size={15} />
                    <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Snooze 3 Days</Text>
                  </TouchableOpacity>

                  {onDelete && (
                    <TouchableOpacity
                      activeOpacity={0.75}
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    maxHeight: '88%',
    overflow: 'hidden',
    paddingTop: 8,
  },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 18,
    marginHorizontal: 12,
    borderRadius: 22,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountPrefix: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 24,
    fontWeight: '800',
    marginRight: 4,
  },
  billAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  billTitle: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  metaBox: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  metaColumnRow: {
    paddingVertical: 14,
  },
  metaRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaLabel: { fontSize: 13, fontWeight: '600' },
  metaValue: { fontSize: 13, fontWeight: '800' },
  activeChannelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  channelMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  testEmailBtnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  testEmailBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
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
  primaryBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '700' },
})
