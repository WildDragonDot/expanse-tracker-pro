import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Dimensions } from 'react-native'
import { useAppTheme } from '../context/ThemeContext'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
}

const { width } = Dimensions.get('window')

export const ShimmerBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { theme, colors } = useAppTheme()
  const shimmerAnim = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const boxBg = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.07)'

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: boxBg,
          opacity: shimmerAnim,
        },
        style,
      ]}
    />
  )
}

export const CardSkeleton: React.FC<{ height?: number; style?: any }> = ({ height, style }) => {
  const { colors } = useAppTheme()
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        height ? { height } : {},
        style,
      ]}
    >
      <ShimmerBox width="35%" height={14} borderRadius={6} />
      <ShimmerBox width="60%" height={28} borderRadius={8} style={{ marginVertical: 14 }} />
      <View style={styles.row}>
        <ShimmerBox width="45%" height={12} borderRadius={4} />
        <ShimmerBox width="45%" height={12} borderRadius={4} />
      </View>
    </View>
  )
}

export const TransactionSkeleton: React.FC = () => {
  const { colors } = useAppTheme()
  return (
    <View style={[styles.transRow, { borderColor: colors.border }]}>
      <ShimmerBox width={44} height={44} borderRadius={14} />
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <ShimmerBox width="60%" height={15} borderRadius={4} />
        <ShimmerBox width="35%" height={11} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <ShimmerBox width={70} height={18} borderRadius={6} />
    </View>
  )
}

export const BillSkeleton: React.FC = () => {
  const { colors } = useAppTheme()
  return (
    <View style={[styles.billCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.billHeader}>
        <ShimmerBox width={40} height={40} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <ShimmerBox width="55%" height={15} borderRadius={4} />
          <ShimmerBox width="35%" height={11} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <ShimmerBox width={75} height={18} borderRadius={6} />
      </View>
      <View style={[styles.billActions, { borderTopColor: colors.border }]}>
        <ShimmerBox width="48%" height={36} borderRadius={10} />
        <ShimmerBox width="48%" height={36} borderRadius={10} />
      </View>
    </View>
  )
}

// 1. Dashboard Skeleton (Full Screen Layout)
export const DashboardSkeleton: React.FC = () => {
  const { colors } = useAppTheme()
  return (
    <View style={styles.screenContainer}>
      {/* Hero Balance Card */}
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <ShimmerBox width="35%" height={16} borderRadius={6} />
          <ShimmerBox width={24} height={24} borderRadius={12} />
        </View>
        <ShimmerBox width="70%" height={36} borderRadius={8} style={{ marginVertical: 16 }} />
        <ShimmerBox width="40%" height={14} borderRadius={6} />
      </View>

      {/* 2x Income & Expense Cards */}
      <View style={styles.rowBetween}>
        <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ShimmerBox width="45%" height={12} borderRadius={4} />
          <ShimmerBox width="80%" height={22} borderRadius={6} style={{ marginVertical: 8 }} />
          <ShimmerBox width="60%" height={10} borderRadius={4} />
        </View>
        <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ShimmerBox width="45%" height={12} borderRadius={4} />
          <ShimmerBox width="80%" height={22} borderRadius={6} style={{ marginVertical: 8 }} />
          <ShimmerBox width="60%" height={10} borderRadius={4} />
        </View>
      </View>

      {/* Bill Reminder Card Skeleton */}
      <BillSkeleton />

      {/* Health Score Gauge Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <ShimmerBox width="45%" height={14} borderRadius={4} />
          <ShimmerBox width="25%" height={14} borderRadius={4} />
        </View>
        <ShimmerBox width="100%" height={10} borderRadius={5} style={{ marginVertical: 14 }} />
        <View style={styles.rowBetween}>
          <ShimmerBox width="30%" height={12} borderRadius={4} />
          <ShimmerBox width="30%" height={12} borderRadius={4} />
          <ShimmerBox width="30%" height={12} borderRadius={4} />
        </View>
      </View>

      {/* Recent Transactions List */}
      <TransactionSkeleton />
      <TransactionSkeleton />
    </View>
  )
}

// 2. Expenses Screen Skeleton
export const ExpensesSkeleton: React.FC = () => {
  const { colors } = useAppTheme()
  return (
    <View style={styles.screenContainer}>
      <CardSkeleton />
      <View style={[styles.row, { marginVertical: 12 }]}>
        <ShimmerBox width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        <ShimmerBox width={90} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        <ShimmerBox width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
      </View>
      <TransactionSkeleton />
      <TransactionSkeleton />
      <TransactionSkeleton />
      <TransactionSkeleton />
    </View>
  )
}

// 3. Analytics Screen Skeleton
export const AnalyticsSkeleton: React.FC = () => {
  const { colors } = useAppTheme()
  return (
    <View style={styles.screenContainer}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, height: 220 }]}>
        <ShimmerBox width="40%" height={16} borderRadius={6} />
        <ShimmerBox width="100%" height={140} borderRadius={12} style={{ marginTop: 16 }} />
      </View>
      <View style={styles.rowBetween}>
        <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ShimmerBox width="50%" height={12} borderRadius={4} />
          <ShimmerBox width="70%" height={20} borderRadius={6} style={{ marginTop: 8 }} />
        </View>
        <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ShimmerBox width="50%" height={12} borderRadius={4} />
          <ShimmerBox width="70%" height={20} borderRadius={6} style={{ marginTop: 8 }} />
        </View>
      </View>
      <CardSkeleton />
    </View>
  )
}

// 4. Monthly Budget Skeleton
export const MonthlyBudgetSkeleton: React.FC = () => {
  const { colors } = useAppTheme()
  return (
    <View style={styles.screenContainer}>
      <CardSkeleton />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ShimmerBox width="40%" height={16} borderRadius={6} />
        <ShimmerBox width="100%" height={8} borderRadius={4} style={{ marginVertical: 12 }} />
        <ShimmerBox width="30%" height={12} borderRadius={4} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ShimmerBox width="40%" height={16} borderRadius={6} />
        <ShimmerBox width="100%" height={8} borderRadius={4} style={{ marginVertical: 12 }} />
        <ShimmerBox width="30%" height={12} borderRadius={4} />
      </View>
    </View>
  )
}

// 5. Recurring Bills Skeleton
export const RecurringBillsSkeleton: React.FC = () => {
  return (
    <View style={styles.screenContainer}>
      <CardSkeleton />
      <BillSkeleton />
      <BillSkeleton />
      <BillSkeleton />
    </View>
  )
}

// 6. Udhar / Khata Skeleton
export const UdharSkeleton: React.FC = () => {
  const { colors } = useAppTheme()
  return (
    <View style={styles.screenContainer}>
      <CardSkeleton />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <ShimmerBox width="40%" height={16} borderRadius={6} />
          <ShimmerBox width="25%" height={16} borderRadius={6} />
        </View>
        <ShimmerBox width="60%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <ShimmerBox width="40%" height={16} borderRadius={6} />
          <ShimmerBox width="25%" height={16} borderRadius={6} />
        </View>
        <ShimmerBox width="60%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    </View>
  )
}

// 7. Reports Skeleton
export const ReportsSkeleton: React.FC = () => {
  return (
    <View style={styles.screenContainer}>
      <CardSkeleton />
      <CardSkeleton />
      <TransactionSkeleton />
      <TransactionSkeleton />
    </View>
  )
}

const styles = StyleSheet.create({
  screenContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  heroCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  halfCard: {
    width: '48%',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
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
  billActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
})
