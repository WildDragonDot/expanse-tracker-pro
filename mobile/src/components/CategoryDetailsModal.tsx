import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Tag,
  ArrowUpRight,
  TrendingUp,
  X,
  Calendar,
  Layers,
} from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'
import { api } from '../services/api'
import { Expense } from '../types'

export interface CategoryDetailsItem {
  name: string
  spent: number
  budget: number
  percentage: number
  color: string
}

interface Props {
  visible: boolean
  category: CategoryDetailsItem | null
  currencySymbol: string
  onClose: () => void
}

export const CategoryDetailsModal: React.FC<Props> = ({
  visible,
  category,
  currencySymbol = '₹',
  onClose,
}) => {
  const { colors } = useAppTheme()
  const [categoryTransactions, setCategoryTransactions] = useState<Expense[]>([])
  const [loadingTx, setLoadingTx] = useState(false)

  useEffect(() => {
    if (!visible || !category) {
      setCategoryTransactions([])
      return
    }
    setLoadingTx(true)
    api
      .getExpenses()
      .then((all) => {
        setCategoryTransactions(
          all
            .filter((e) => e.category === category.name)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
        )
      })
      .catch(() => setCategoryTransactions([]))
      .finally(() => setLoadingTx(false))
  }, [visible, category?.name])

  if (!category) return null

  const spentAmount = (category as any).spent ?? (category as any).amount ?? 0
  const budgetAmount = (category as any).budget ?? 0
  const hasBudget = budgetAmount > 0
  const percentageVal = (category as any).percentage ?? (hasBudget ? Math.round((spentAmount / budgetAmount) * 100) : 0)
  const remaining = Math.max(0, budgetAmount - spentAmount)
  const isOverBudget = hasBudget && spentAmount > budgetAmount

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
          {/* Header */}
          <LinearGradient
            colors={[category.color || '#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerTop}>
              <View style={styles.badgePill}>
                <Tag color="#FFFFFF" size={12} />
                <Text style={styles.badgePillText}>CATEGORY REPORT</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>

            <Text style={styles.catName}>{category.name}</Text>
            <Text style={styles.catSpent}>
              {currencySymbol || '₹'}{spentAmount.toLocaleString()}
              {hasBudget && (
                <Text style={styles.catBudget}> of {currencySymbol || '₹'}{budgetAmount.toLocaleString()} Budget</Text>
              )}
            </Text>

            {/* Gauge */}
            {hasBudget && (
              <>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, percentageVal)}%`, backgroundColor: '#FFFFFF' }]} />
                </View>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabelText}>{percentageVal}% Utilized</Text>
                  <Text style={styles.progressLabelText}>
                    {isOverBudget ? 'Over Budget' : `${currencySymbol || '₹'}${remaining.toLocaleString()} Remaining`}
                  </Text>
                </View>
              </>
            )}
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            {loadingTx ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
            ) : categoryTransactions.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>
                No transactions found in this category yet.
              </Text>
            ) : (
              categoryTransactions.map((tx) => (
                <View
                  key={tx.id}
                  style={[styles.txRow, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
                >
                  <View style={styles.txLeft}>
                    <View style={[styles.txIcon, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                      <ArrowUpRight color="#F43F5E" size={16} />
                    </View>
                    <View>
                      <Text style={[styles.txTitle, { color: colors.text }]}>{tx.title}</Text>
                      <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: colors.text }]}>
                    -{currencySymbol}{tx.amount.toLocaleString()}
                  </Text>
                </View>
              ))
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
  catName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  catSpent: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 14,
  },
  catBudget: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.85,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabelText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 10,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
})
