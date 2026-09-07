import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import {
  Home,
  UtensilsCrossed,
  Zap,
  Car,
  Tv,
  HeartPulse,
  TrendingUp,
  Wallet,
  GraduationCap,
  ShoppingBag,
  Briefcase,
  Gift,
  CreditCard,
  Coffee,
  Plane,
  Dumbbell,
  Tag,
  Smartphone,
  Wifi,
  Package,
  PiggyBank,
} from 'lucide-react-native'

interface Props {
  name?: string
  iconKey?: string
  color?: string
  size?: number
  containerSize?: number
  containerBg?: string
  style?: ViewStyle
}

export const getCategoryIconComponent = (categoryName?: string, iconKey?: string) => {
  const query = (iconKey || categoryName || '').toLowerCase().trim()

  if (query.includes('house') || query.includes('rent') || query.includes('home') || query === '🏠') {
    return Home
  }
  if (query.includes('food') || query.includes('grocer') || query.includes('eat') || query.includes('dining') || query === '🍔' || query === '🍕') {
    return UtensilsCrossed
  }
  if (query.includes('bill') || query.includes('utilit') || query.includes('electr') || query.includes('power') || query === '💡') {
    return Zap
  }
  if (query.includes('travel') || query.includes('commut') || query.includes('ride') || query.includes('cab') || query.includes('uber') || query === '🚗' || query === 'plane') {
    return query === 'plane' || query.includes('flight') ? Plane : Car
  }
  if (query.includes('subscri') || query.includes('stream') || query.includes('netflix') || query === '🎬' || query.includes('entertain')) {
    return Tv
  }
  if (query.includes('health') || query.includes('medic') || query.includes('doctor') || query.includes('pharma') || query === '🏥') {
    return HeartPulse
  }
  if (query.includes('invest') || query.includes('sip') || query.includes('stock') || query.includes('mutual') || query === '📈') {
    return TrendingUp
  }
  if (query.includes('salar') || query.includes('income') || query.includes('payout')) {
    return Wallet
  }
  if (query.includes('shop') || query.includes('cloth') || query.includes('store') || query === '🛒') {
    return ShoppingBag
  }
  if (query.includes('fitness') || query.includes('gym')) {
    return Dumbbell
  }
  if (query.includes('gift') || query.includes('festiv') || query.includes('diwali') || query === 'gift') {
    return Gift
  }
  if (query.includes('educat') || query.includes('course') || query.includes('study')) {
    return GraduationCap
  }
  if (query.includes('work') || query.includes('office') || query.includes('business')) {
    return Briefcase
  }
  if (query.includes('phone') || query.includes('mobile') || query.includes('recharge')) {
    return Smartphone
  }
  if (query.includes('wifi') || query.includes('broadband') || query.includes('internet')) {
    return Wifi
  }
  if (query.includes('bank') || query.includes('loan') || query.includes('udhar')) {
    return CreditCard
  }
  if (query.includes('saving') || query.includes('piggy')) {
    return PiggyBank
  }
  if (query.includes('coffee') || query.includes('cafe')) {
    return Coffee
  }
  if (query.includes('pack') || query.includes('deliver')) {
    return Package
  }

  return Tag
}

export const CategoryIcon: React.FC<Props> = ({
  name,
  iconKey,
  color = '#8B5CF6',
  size = 18,
  containerSize,
  containerBg,
  style,
}) => {
  const IconComponent = getCategoryIconComponent(name, iconKey)

  if (containerSize) {
    return (
      <View
        style={[
          styles.container,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize * 0.3,
            backgroundColor: containerBg || `${color}20`,
          },
          style,
        ]}
      >
        <IconComponent color={color} size={size} strokeWidth={2} />
      </View>
    )
  }

  return <IconComponent color={color} size={size} strokeWidth={2} style={style} />
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
