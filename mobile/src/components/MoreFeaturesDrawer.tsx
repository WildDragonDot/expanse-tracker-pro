import React from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import {
  CalendarDays,
  ShoppingBag,
  Repeat,
  HandCoins,
  FileSpreadsheet,
  BrainCircuit,
  SlidersHorizontal,
  BellRing,
  Target,
  Users,
  X,
} from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'

interface Props {
  visible: boolean
  onClose: () => void
  onNavigate: (screenName: string) => void
}

export const MoreFeaturesDrawer: React.FC<Props> = ({
  visible,
  onClose,
  onNavigate,
}) => {
  const { colors } = useAppTheme()

  const tools = [
    {
      id: 'event',
      title: 'Event Planning',
      desc: 'Budget for festivals, trips & celebrations',
      icon: <CalendarDays color="#FFFFFF" size={20} strokeWidth={2} />,
      iconBg: '#F97316', // Orange
      screen: 'EventPlanning',
    },
    {
      id: 'shopping',
      title: 'Shopping Lists',
      desc: 'Smart lists with estimated & actual prices',
      icon: <ShoppingBag color="#FFFFFF" size={20} strokeWidth={2} />,
      iconBg: '#10B981', // Green
      screen: 'Shopping',
    },
    {
      id: 'subscriptions',
      title: 'Bills & Reminders',
      desc: 'Recurring payments, auto-debits, email & app alerts',
      icon: <BellRing color="#FFFFFF" size={20} strokeWidth={2} />,
      iconBg: '#3B82F6', // Blue
      screen: 'Subscriptions',
    },
    {
      id: 'udhar',
      title: 'Udhar & Loans',
      desc: 'Track money you owe or are owed',
      icon: <HandCoins color="#FFFFFF" size={20} strokeWidth={2} />,
      iconBg: '#F43F5E', // Pink/Rose
      screen: 'Udhar',
    },
    {
      id: 'savings',
      title: 'Savings Goals',
      desc: 'Track targets, milestones & wealth funds',
      icon: <Target color="#FFFFFF" size={20} strokeWidth={2} />,
      iconBg: '#10B981', // Emerald
      screen: 'SavingsGoals',
    },
    {
      id: 'split',
      title: 'Split Expenses',
      desc: 'Splitwise style group bills & settle-ups',
      icon: <Users color="#FFFFFF" size={20} strokeWidth={2} />,
      iconBg: '#6366F1', // Indigo
      screen: 'SplitExpenses',
    },
    {
      id: 'reports',
      title: 'Reports & Statements',
      desc: 'Download CSV, Excel and tax summaries',
      icon: <FileSpreadsheet color="#FFFFFF" size={20} strokeWidth={2} />,
      iconBg: '#06B6D4', // Cyan
      screen: 'Reports',
    },
    {
      id: 'ai',
      title: 'Financial Intelligence',
      desc: 'Smart insights and budget advisory',
      icon: <BrainCircuit color="#FFFFFF" size={20} strokeWidth={2} />,
      iconBg: '#8B5CF6', // Purple
      screen: 'AI Advisor',
    },
    {
      id: 'settings',
      title: 'Settings & Preferences',
      desc: 'Currency, billing cycle, notifications & security',
      icon: <SlidersHorizontal color="#FFFFFF" size={20} strokeWidth={2} />,
      iconBg: '#475569', // Dark Slate
      screen: 'Settings',
    },
  ]

  const handleSelect = (screen: string) => {
    onClose()
    onNavigate(screen)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.drawerCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceGlassBorder,
            },
          ]}
        >
          {/* Drag Pill */}
          <View style={styles.dragPillWrap}>
            <View style={styles.dragPill} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>More Features</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                Quick access to all tools
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textSecondary} size={18} />
            </TouchableOpacity>
          </View>

          {/* Tools List */}
          <ScrollView contentContainerStyle={styles.list}>
            {tools.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => handleSelect(item.screen)}
                style={[
                  styles.toolItem,
                  {
                    backgroundColor: colors.surfaceGlass,
                    borderColor: colors.surfaceGlassBorder,
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                  {item.icon}
                </View>
                <View style={styles.info}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
                    {item.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  drawerCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  dragPillWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  sub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: 10,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toolDesc: {
    fontSize: 11,
    marginTop: 2,
  },
})
