import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TrendingUp, Sun, Moon } from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

interface Props {
  title: string
  subtitle?: string
  onProfilePress?: () => void
}

export const HeaderBar: React.FC<Props> = ({
  title,
  subtitle = 'FinanceTracker Pro',
  onProfilePress,
}) => {
  const insets = useSafeAreaInsets()
  const { colors, theme, toggleTheme } = useAppTheme()
  const { user } = useAuth()

  const isDark = theme === 'dark'

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: 12,
        },
      ]}
    >
      <View style={styles.left}>
        <View style={styles.logoCircle}>
          <TrendingUp color="#FFFFFF" size={18} strokeWidth={2.5} />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.iconBtn, { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}
        >
          {isDark ? <Sun color="#F59E0B" size={16} /> : <Moon color="#6366F1" size={16} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={onProfilePress} style={styles.avatarBtn}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CV'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
})
