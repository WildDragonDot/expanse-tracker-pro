import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  Bell,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Receipt,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Clock,
  CheckCircle2,
} from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'
import { api } from '../services/api'
import { formatTimeAgo, formatLocalDateTime } from '../utils/dateUtils'

interface NotificationItem {
  id: string
  type: 'bill' | 'budget' | 'udhar' | 'report' | 'system' | 'tip'
  title: string
  message: string
  createdAt: string
  read: boolean
  priority: 'high' | 'medium' | 'low'
  actionScreen?: string
  actionParams?: any
  metadata?: any
}

export const NotificationsScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'bill' | 'budget' | 'other'>('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications()
      if (res.success && res.notifications) {
        setNotifications(res.notifications)
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadNotifications()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadNotifications()
  }

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setReadIds(allIds)
  }

  const handleNotificationPress = (item: NotificationItem) => {
    setReadIds((prev) => new Set([...prev, item.id]))
    if (item.actionScreen) {
      navigation.navigate(item.actionScreen, item.actionParams)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'bill') return n.type === 'bill'
    if (activeFilter === 'budget') return n.type === 'budget'
    return n.type !== 'bill' && n.type !== 'budget'
  })

  const unreadCount = notifications.filter((n) => !n.read && !readIds.has(n.id)).length

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'bill':
        return <Calendar color="#EC4899" size={18} />
      case 'budget':
        return <AlertTriangle color="#F59E0B" size={18} />
      case 'udhar':
        return <Receipt color="#8B5CF6" size={18} />
      case 'report':
        return <FileSpreadsheet color="#3B82F6" size={18} />
      case 'tip':
        return <Sparkles color="#10B981" size={18} />
      default:
        return <Bell color="#6366F1" size={18} />
    }
  }

  const getIconBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'bill':
        return 'rgba(236, 72, 153, 0.15)'
      case 'budget':
        return 'rgba(245, 158, 11, 0.15)'
      case 'udhar':
        return 'rgba(139, 92, 246, 0.15)'
      case 'report':
        return 'rgba(59, 130, 246, 0.15)'
      case 'tip':
        return 'rgba(16, 185, 129, 0.15)'
      default:
        return 'rgba(99, 102, 241, 0.15)'
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}
          >
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts up to date'}
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={markAllAsRead}
            style={[styles.markReadBtn, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}
          >
            <CheckCheck color="#818CF8" size={14} style={{ marginRight: 4 }} />
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterScroll}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveFilter('all')}
          style={[
            styles.filterPill,
            activeFilter === 'all'
              ? { backgroundColor: '#6366F1', borderColor: '#6366F1' }
              : { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: activeFilter === 'all' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveFilter('bill')}
          style={[
            styles.filterPill,
            activeFilter === 'bill'
              ? { backgroundColor: '#EC4899', borderColor: '#EC4899' }
              : { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: activeFilter === 'bill' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Bills & Reminders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveFilter('budget')}
          style={[
            styles.filterPill,
            activeFilter === 'budget'
              ? { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }
              : { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: activeFilter === 'budget' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Budgets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveFilter('other')}
          style={[
            styles.filterPill,
            activeFilter === 'other'
              ? { backgroundColor: '#10B981', borderColor: '#10B981' }
              : { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: activeFilter === 'other' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Tips & System
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading alerts...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <CheckCircle2 color="#10B981" size={42} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No New Notifications</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              You are completely caught up! We will alert you whenever bills are due or budgets are close to limit.
            </Text>
          </View>
        ) : (
          filteredNotifications.map((item) => {
            const isRead = item.read || readIds.has(item.id)
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: isRead ? colors.surfaceGlass : 'rgba(99, 102, 241, 0.08)',
                    borderColor: isRead ? colors.surfaceGlassBorder : 'rgba(99, 102, 241, 0.3)',
                  },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: getIconBg(item.type) }]}>
                  {getIconForType(item.type)}
                </View>

                <View style={styles.notifBody}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={[styles.notifTitle, { color: colors.text }, !isRead && styles.unreadTitle]}>
                      {item.title}
                    </Text>
                    {!isRead && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>
                    {item.message}
                  </Text>

                  <View style={styles.notifFooterRow}>
                    <View style={styles.timeRow}>
                      <Clock color={colors.textMuted} size={11} style={{ marginRight: 4 }} />
                      <Text style={[styles.timeText, { color: colors.textMuted }]}>
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                    </View>

                    {item.actionScreen && (
                      <View style={styles.actionPrompt}>
                        <Text style={styles.actionPromptText}>View</Text>
                        <ChevronRight color="#818CF8" size={13} />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
  },
  filterScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBody: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  notifFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
    marginRight: 2,
  },
})
