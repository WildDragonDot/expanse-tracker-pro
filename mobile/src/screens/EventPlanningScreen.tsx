import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Calendar,
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  Tag,
  Users,
  TrendingUp,
  X,
  Plane,
  Gift,
  Home,
  Briefcase,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

interface EventItem {
  id: string
  title: string
  estimated: number
  actual?: number
  isCompleted: boolean
}

interface EventPlan {
  id: string
  name: string
  icon: string
  budget: number
  spent: number
  date: string
  membersCount: number
  items: EventItem[]
}

export const EventPlanningScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const [events, setEvents] = useState<EventPlan[]>([
    {
      id: 'ev1',
      name: 'Goa Summer Trip 2026',
      icon: 'plane',
      budget: 35000,
      spent: 24600,
      date: '2026-09-15',
      membersCount: 4,
      items: [
        { id: 'i1', title: 'Roundtrip Flights', estimated: 16000, actual: 15400, isCompleted: true },
        { id: 'i2', title: 'Beach Villa Resort (3 Nights)', estimated: 12000, actual: 9200, isCompleted: true },
        { id: 'i3', title: 'Water Sports & Scuba', estimated: 7000, actual: 0, isCompleted: false },
      ],
    },
    {
      id: 'ev2',
      name: 'Diwali Festive Celebration',
      icon: 'gift',
      budget: 20000,
      spent: 8500,
      date: '2026-10-28',
      membersCount: 6,
      items: [
        { id: 'i4', title: 'Sweets & Dry Fruit Hampers', estimated: 8000, actual: 5500, isCompleted: true },
        { id: 'i5', title: 'Home Lighting & Decor', estimated: 6000, actual: 3000, isCompleted: true },
        { id: 'i6', title: 'New Festive Clothes', estimated: 6000, actual: 0, isCompleted: false },
      ],
    },
  ])

  // Modals
  const [showEventModal, setShowEventModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  // Event Form
  const [eventName, setEventName] = useState('')
  const [eventBudget, setEventBudget] = useState('')
  const [eventMembers, setEventMembers] = useState('1')

  // Item Form
  const [itemTitle, setItemTitle] = useState('')
  const [itemEstimate, setItemEstimate] = useState('')

  const handleCreateEvent = () => {
    if (!eventName || !eventBudget) {
      Alert.alert('Required', 'Please enter event name and planned budget.')
      return
    }

    const newEvent: EventPlan = {
      id: 'ev_' + Date.now(),
      name: eventName.trim(),
      icon: 'gift',
      budget: parseFloat(eventBudget),
      spent: 0,
      date: '2026-09-01',
      membersCount: parseInt(eventMembers) || 1,
      items: [],
    }

    setEvents((prev) => [newEvent, ...prev])
    setShowEventModal(false)
    setEventName('')
    setEventBudget('')
  }

  const handleAddItem = () => {
    if (!itemTitle || !itemEstimate || !activeEventId) {
      Alert.alert('Required', 'Please enter item title and estimated cost.')
      return
    }

    const estNum = parseFloat(itemEstimate)
    const newItem: EventItem = {
      id: 'item_' + Date.now(),
      title: itemTitle.trim(),
      estimated: estNum,
      isCompleted: false,
    }

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === activeEventId ? { ...ev, items: [...ev.items, newItem] } : ev
      )
    )

    setShowItemModal(false)
    setItemTitle('')
    setItemEstimate('')
  }

  const toggleItemComplete = (eventId: string, itemId: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev
        const updatedItems = ev.items.map((it) => {
          if (it.id !== itemId) return it
          const nextState = !it.isCompleted
          return {
            ...it,
            isCompleted: nextState,
            actual: nextState ? it.estimated : 0,
          }
        })
        const newSpent = updatedItems.reduce((sum, it) => sum + (it.actual || 0), 0)
        return {
          ...ev,
          items: updatedItems,
          spent: newSpent,
        }
      })
    )
  }

  const totalPlannedBudget = events.reduce((sum, ev) => sum + ev.budget, 0)
  const totalPlannedSpent = events.reduce((sum, ev) => sum + ev.spent, 0)

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Event Planning" onProfilePress={() => navigation?.navigate('Settings')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header 2-Col Stat Row */}
        <View style={styles.twoCardsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={[styles.iconRound, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
              <Calendar color="#F97316" size={16} />
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

        {/* Events List */}
        {events.map((ev) => {
          const usedPct = ev.budget > 0 ? Math.min(100, Math.round((ev.spent / ev.budget) * 100)) : 0
          const remaining = Math.max(0, ev.budget - ev.spent)

          return (
            <View
              key={ev.id}
              style={[styles.eventCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
            >
              {/* Event Header */}
              <View style={styles.eventCardHeader}>
                <View style={styles.eventTitleRow}>
                  <View style={styles.eventIconCircle}>
                    {ev.icon === 'plane' ? <Plane color="#FFFFFF" size={16} /> : <Gift color="#FFFFFF" size={16} />}
                  </View>
                  <View>
                    <Text style={[styles.eventName, { color: colors.text }]}>{ev.name}</Text>
                    <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
                      {ev.date} • {ev.membersCount} Members Split
                    </Text>
                  </View>
                </View>

                <View style={styles.eventAmounts}>
                  <Text style={[styles.eventSpentText, { color: colors.text }]}>
                    {currencySymbol}{ev.spent.toLocaleString()} / <Text style={{ color: colors.textSecondary }}>{currencySymbol}{ev.budget.toLocaleString()}</Text>
                  </Text>
                  <Text style={[styles.eventRemainingText, { color: '#10B981' }]}>
                    {currencySymbol}{remaining.toLocaleString()} left
                  </Text>
                </View>
              </View>

              {/* Progress Track */}
              <View style={[styles.track, { backgroundColor: colors.inputBg }]}>
                <View style={[styles.fill, { width: `${usedPct}%`, backgroundColor: '#F97316' }]} />
              </View>

              {/* Items Inside Event */}
              <View style={styles.itemsList}>
                {ev.items.map((it) => (
                  <TouchableOpacity
                    key={it.id}
                    activeOpacity={0.7}
                    onPress={() => toggleItemComplete(ev.id, it.id)}
                    style={[styles.itemRow, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}
                  >
                    <View style={styles.itemLeft}>
                      {it.isCompleted ? (
                        <CheckCircle2 color="#10B981" size={18} />
                      ) : (
                        <Circle color={colors.textMuted} size={18} />
                      )}
                      <Text
                        style={[
                          styles.itemTitle,
                          {
                            color: it.isCompleted ? colors.textMuted : colors.text,
                            textDecorationLine: it.isCompleted ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {it.title}
                      </Text>
                    </View>

                    <Text style={[styles.itemCost, { color: it.isCompleted ? '#10B981' : colors.textSecondary }]}>
                      {currencySymbol}{(it.actual || it.estimated).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Add Item inside Event */}
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
        })}
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={showEventModal} animationType="slide" transparent>
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

            <TouchableOpacity onPress={handleCreateEvent} style={styles.submitBtn}>
              <LinearGradient colors={['#F97316', '#EA580C']} style={styles.submitGradient}>
                <Text style={styles.submitText}>Save Planned Event</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={showItemModal} animationType="slide" transparent>
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

            <TouchableOpacity onPress={handleAddItem} style={styles.submitBtn}>
              <LinearGradient colors={colors.primaryGradient} style={styles.submitGradient}>
                <Text style={styles.submitText}>Add to Event</Text>
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
  twoCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconRound: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  addBtnText: { fontSize: 12, fontWeight: '800' },
  eventCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventName: { fontSize: 14, fontWeight: '800' },
  eventMeta: { fontSize: 11, marginTop: 2 },
  eventAmounts: { alignItems: 'flex-end' },
  eventSpentText: { fontSize: 12, fontWeight: '800' },
  eventRemainingText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  fill: { height: 6, borderRadius: 3 },
  itemsList: { marginBottom: 10 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemTitle: { fontSize: 12, fontWeight: '600' },
  itemCost: { fontSize: 12, fontWeight: '700' },
  addItemBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addItemBtnText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  submitGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
