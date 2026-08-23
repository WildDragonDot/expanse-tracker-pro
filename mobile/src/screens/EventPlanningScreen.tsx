import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Circle,
  X,
  Plane,
  Gift,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { TransactionSkeleton } from '../components/SkeletonLoader'
import { api } from '../services/api'
import { ShoppingCategory } from '../types'

export const EventPlanningScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [events, setEvents] = useState<ShoppingCategory[]>([])

  // Modals
  const [showEventModal, setShowEventModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Event Form
  const [eventName, setEventName] = useState('')
  const [eventBudget, setEventBudget] = useState('')
  const [eventMembers, setEventMembers] = useState('1')

  // Item Form
  const [itemTitle, setItemTitle] = useState('')
  const [itemEstimate, setItemEstimate] = useState('')

  const loadEvents = async () => {
    try {
      const data = await api.getShoppingCategories()
      setEvents(data)
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadEvents()
  }

  const handleCreateEvent = async () => {
    if (!eventName || !eventBudget) {
      Alert.alert('Required', 'Please enter event name and planned budget.')
      return
    }
    setSaving(true)
    try {
      const created = await api.createShoppingCategory({
        name: eventName.trim(),
        icon: '🎉',
        expectedCost: parseFloat(eventBudget),
        membersCount: parseInt(eventMembers) || 1,
      })
      setEvents((prev) => [{ ...created, items: [] }, ...prev])
      setShowEventModal(false)
      setEventName('')
      setEventBudget('')
    } catch (err: any) {
      Alert.alert('Could not create event', err.message || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async () => {
    if (!itemTitle || !itemEstimate || !activeEventId) {
      Alert.alert('Required', 'Please enter item title and estimated cost.')
      return
    }
    setSaving(true)
    try {
      const created = await api.createShoppingItem({
        name: itemTitle.trim(),
        expectedPrice: parseFloat(itemEstimate),
        categoryId: activeEventId,
      })
      setEvents((prev) => prev.map((ev) => (ev.id === activeEventId ? { ...ev, items: [...ev.items, created] } : ev)))
      setShowItemModal(false)
      setItemTitle('')
      setItemEstimate('')
    } catch (err: any) {
      Alert.alert('Could not add item', err.message || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleItemComplete = async (eventId: string, itemId: string) => {
    const event = events.find((ev) => ev.id === eventId)
    const item = event?.items.find((it) => it.id === itemId)
    if (!item) return

    try {
      const updated = await api.updateShoppingItem(itemId, {
        isBought: !item.isBought,
        actualPrice: !item.isBought ? item.expectedPrice : undefined,
      })
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id !== eventId) return ev
          const updatedItems = ev.items.map((it) => (it.id === itemId ? updated : it))
          const realCost = updatedItems.filter((it) => it.isBought && it.actualPrice).reduce((sum, it) => sum + (it.actualPrice || 0) * it.quantity, 0)
          return { ...ev, items: updatedItems, realCost }
        })
      )
    } catch (err: any) {
      Alert.alert('Could not update item', err.message || 'Please try again.')
    }
  }

  const totalPlannedBudget = events.reduce((sum, ev) => sum + ev.expectedCost, 0)
  const totalPlannedSpent = events.reduce((sum, ev) => sum + ev.realCost, 0)

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Event Planning" onProfilePress={() => navigation?.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header 2-Col Stat Row */}
        <View style={styles.twoCardsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={[styles.iconRound, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
              <CalendarDays color="#F97316" size={16} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {currencySymbol}{totalPlannedBudget.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Planned Budget</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={[styles.iconRound, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <CheckCircle2 color="#10B981" size={16} />
            </View>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {currencySymbol}{totalPlannedSpent.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Actual Spent</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events & Trips</Text>
          <TouchableOpacity onPress={() => setShowEventModal(true)}>
            <Text style={[styles.addBtnText, { color: colors.primary }]}>+ New Event</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <TransactionSkeleton />
            <TransactionSkeleton />
          </>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarDays color={colors.textMuted} size={28} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No planned events yet. Tap "+ New Event" to budget a trip or celebration.
            </Text>
          </View>
        ) : (
          events.map((ev) => {
            const usedPct = ev.expectedCost > 0 ? Math.min(100, Math.round((ev.realCost / ev.expectedCost) * 100)) : 0
            const remaining = Math.max(0, ev.expectedCost - ev.realCost)

            return (
              <View key={ev.id} style={[styles.eventCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                <View style={styles.eventCardHeader}>
                  <View style={styles.eventTitleRow}>
                    <View style={styles.eventIconCircle}>
                      {ev.name.toLowerCase().includes('trip') ? <Plane color="#FFFFFF" size={16} /> : <Gift color="#FFFFFF" size={16} />}
                    </View>
                    <View>
                      <Text style={[styles.eventName, { color: colors.text }]}>{ev.name}</Text>
                      <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
                        {ev.membersCount} Member{ev.membersCount === 1 ? '' : 's'} Split
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventAmounts}>
                    <Text style={[styles.eventSpentText, { color: colors.text }]}>
                      {currencySymbol}{ev.realCost.toLocaleString()} / <Text style={{ color: colors.textSecondary }}>{currencySymbol}{ev.expectedCost.toLocaleString()}</Text>
                    </Text>
                    <Text style={[styles.eventRemainingText, { color: '#10B981' }]}>
                      {currencySymbol}{remaining.toLocaleString()} left
                    </Text>
                  </View>
                </View>

                <View style={[styles.track, { backgroundColor: colors.inputBg }]}>
                  <View style={[styles.fill, { width: `${usedPct}%`, backgroundColor: '#F97316' }]} />
                </View>

                <View style={styles.itemsList}>
                  {ev.items.map((it) => (
                    <TouchableOpacity
                      key={it.id}
                      activeOpacity={0.7}
                      onPress={() => toggleItemComplete(ev.id, it.id)}
                      style={[styles.itemRow, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}
                    >
                      <View style={styles.itemLeft}>
                        {it.isBought ? <CheckCircle2 color="#10B981" size={18} /> : <Circle color={colors.textMuted} size={18} />}
                        <Text style={[styles.itemTitle, { color: it.isBought ? colors.textMuted : colors.text, textDecorationLine: it.isBought ? 'line-through' : 'none' }]}>
                          {it.name}
                        </Text>
                      </View>

                      <Text style={[styles.itemCost, { color: it.isBought ? '#10B981' : colors.textSecondary }]}>
                        {currencySymbol}{((it.isBought ? it.actualPrice : it.expectedPrice) || 0).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setActiveEventId(ev.id)
                    setShowItemModal(true)
                  }}
                  style={[styles.addItemBtn, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                >
                  <Plus color={colors.textSecondary} size={14} />
                  <Text style={[styles.addItemBtnText, { color: colors.textSecondary }]}>Add Planned Item</Text>
                </TouchableOpacity>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={showEventModal} animationType="slide" transparent onRequestClose={() => setShowEventModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Planned Event</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EVENT / TRIP TITLE</Text>
              <TextInput
                value={eventName}
                onChangeText={setEventName}
                placeholder="e.g. Goa Trip 2026, Diwali Celebration"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PLANNED TOTAL BUDGET ({currencySymbol})</Text>
              <TextInput
                value={eventBudget}
                onChangeText={setEventBudget}
                placeholder="35,000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MEMBERS SPLITTING COST</Text>
              <TextInput
                value={eventMembers}
                onChangeText={setEventMembers}
                placeholder="4"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <TouchableOpacity onPress={handleCreateEvent} disabled={saving} style={[styles.submitBtn, { opacity: saving ? 0.6 : 1 }]}>
              <LinearGradient colors={['#F97316', '#EA580C']} style={styles.submitGradient}>
                <Text style={styles.submitText}>{saving ? 'Saving…' : 'Save Planned Event'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={showItemModal} animationType="slide" transparent onRequestClose={() => setShowItemModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Event Expense Item</Text>
              <TouchableOpacity onPress={() => setShowItemModal(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ITEM NAME</Text>
              <TextInput
                value={itemTitle}
                onChangeText={setItemTitle}
                placeholder="e.g. Flight Tickets, Hotel Booking"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ESTIMATED COST ({currencySymbol})</Text>
              <TextInput
                value={itemEstimate}
                onChangeText={setItemEstimate}
                placeholder="10,000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <TouchableOpacity onPress={handleAddItem} disabled={saving} style={[styles.submitBtn, { opacity: saving ? 0.6 : 1 }]}>
              <LinearGradient colors={colors.primaryGradient} style={styles.submitGradient}>
                <Text style={styles.submitText}>{saving ? 'Adding…' : 'Add to Event'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  twoCardsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 14, borderRadius: 20, borderWidth: 1 },
  iconRound: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  addBtnText: { fontSize: 12, fontWeight: '800' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  emptyStateText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  eventCard: { padding: 16, borderRadius: 22, borderWidth: 1, marginBottom: 14 },
  eventCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventIconCircle: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  eventName: { fontSize: 14, fontWeight: '800' },
  eventMeta: { fontSize: 11, marginTop: 2 },
  eventAmounts: { alignItems: 'flex-end' },
  eventSpentText: { fontSize: 12, fontWeight: '800' },
  eventRemainingText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  fill: { height: 6, borderRadius: 3 },
  itemsList: { marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  itemTitle: { fontSize: 12, fontWeight: '600' },
  itemCost: { fontSize: 12, fontWeight: '700' },
  addItemBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  addItemBtnText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, fontWeight: '600' },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  submitGradient: { height: 48, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
