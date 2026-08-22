import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { useAppTheme } from '../context/ThemeContext'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
}

export const ShimmerBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useAppTheme()
  const shimmerAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.inputBorder,
          opacity: shimmerAnim,
        },
        style,
      ]}
    />
  )
}

export const CardSkeleton: React.FC = () => {
  const { colors } = useAppTheme()
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
      <ShimmerBox width="40%" height={14} borderRadius={6} />
      <ShimmerBox width="65%" height={28} borderRadius={8} style={{ marginVertical: 12 }} />
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
    <View style={[styles.transRow, { borderColor: colors.surfaceGlassBorder }]}>
      <ShimmerBox width={40} height={40} borderRadius={12} />
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <ShimmerBox width="60%" height={14} borderRadius={4} />
        <ShimmerBox width="35%" height={10} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <ShimmerBox width={65} height={16} borderRadius={6} />
    </View>
  )
}

export const BillSkeleton: React.FC = () => {
  const { colors } = useAppTheme()
  return (
    <View style={[styles.billCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
      <View style={styles.billHeader}>
        <ShimmerBox width={36} height={36} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <ShimmerBox width="50%" height={14} borderRadius={4} />
          <ShimmerBox width="30%" height={10} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <ShimmerBox width={70} height={16} borderRadius={6} />
      </View>
      <View style={styles.billActions}>
        <ShimmerBox width="48%" height={32} borderRadius={8} />
        <ShimmerBox width="48%" height={32} borderRadius={8} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  transRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  billCard: {
    padding: 14,
    borderRadius: 16,
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
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
})
