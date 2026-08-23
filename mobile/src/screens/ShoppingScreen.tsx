import React, { useEffect, useState, useCallback } from 'react'
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
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ShoppingBag,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { TransactionSkeleton } from '../components/SkeletonLoader'
import { api } from '../services/api'
import { ShoppingListItem } from '../types'

export const ShoppingScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Add Item Modal
  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Groceries')
  const [saving, setSaving] = useState(false)

  // Actual Price Modal
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [itemForPrice, setItemForPrice] = useState<ShoppingListItem | null>(null)
  const [actualPriceInput, setActualPriceInput] = useState('')

  const loadItems = async () => {
    try {
      const data = await api.getShoppingList()
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadItems()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadItems()
  }

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))]

  const filteredItems = selectedCategory === 'All' ? items : items.filter((i) => i.category === selectedCategory)

  const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0)
  const totalActual = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + (item.actualPrice ?? item.estimatedPrice ?? 0), 0)

  const handleToggleComplete = (item: ShoppingListItem) => {
    if (!item.completed) {
      setItemForPrice(item)
      setActualPriceInput((item.estimatedPrice || 0).toString())
      setPriceModalVisible(true)
    } else {
      api.updateShoppingListItem(item.id, { completed: false }).then((updated) => {
        setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
      }).catch((err: any) => Alert.alert('Could not update', err.message || 'Please try again.'))
    }
  }

  const handleSaveActualPrice = async () => {
    if (!itemForPrice) return
    const actualVal = parseFloat(actualPriceInput) || itemForPrice.estimatedPrice || 0

    try {
      const updated = await api.updateShoppingListItem(itemForPrice.id, { completed: true, actualPrice: actualVal })
      setItems((prev) => prev.map((i) => (i.id === itemForPrice.id ? updated : i)))
      setPriceModalVisible(false)
      setItemForPrice(null)
    } catch (err: any) {
      Alert.alert('Could not save', err.message || 'Please try again.')
    }
  }

  const deleteItem = async (id: string) => {
    try {
      await api.deleteShoppingListItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err: any) {
      Alert.alert('Could not delete', err.message || 'Please try again.')
    }
  }

  const handleAddItem = async () => {
    if (!title || !amount) {
      Alert.alert('Required', 'Please enter item name and price.')
      return
    }
    setSaving(true)
    try {
      const created = await api.createShoppingListItem({
        name: title.trim(),
        quantity: 1,
        category: category.trim() || 'other',
        estimatedPrice: parseFloat(amount),
      })
      setItems((prev) => [created, ...prev])
      setModalVisible(false)
      setTitle('')
      setAmount('')
    } catch (err: any) {
      Alert.alert('Could not add item', err.message || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top 2-Col Stat Row */}
      <View style={styles.headerArea}>
        <View style={styles.twoCardsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <ShoppingBag color="#3B82F6" size={16} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {currencySymbol}{totalEstimated.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Estimated Budget</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <CheckCircle2 color="#10B981" size={16} />
            </View>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {currencySymbol}{totalActual.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Actual Paid</Text>
          </View>
        </View>
      </View>

      {/* Category Pills Bar */}
      {categories.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.8}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryPill,
                { backgroundColor: selectedCategory === cat ? '#10B981' : colors.surfaceGlass, borderColor: selectedCategory === cat ? '#10B981' : colors.surfaceGlassBorder },
              ]}
            >
              <Text style={[styles.categoryPillText, { color: selectedCategory === cat ? '#FFFFFF' : colors.textSecondary }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Checklist items */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <>
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
          </>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag color={colors.textMuted} size={28} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Your shopping list is empty. Tap + to add an item.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View
              key={item.id}
              style={[styles.itemCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder, opacity: item.completed ? 0.75 : 1 }]}
            >
              <TouchableOpacity onPress={() => handleToggleComplete(item)} style={styles.checkboxTouch}>
                {item.completed ? <CheckCircle2 color="#10B981" size={22} /> : <Circle color={colors.textMuted} size={22} />}
              </TouchableOpacity>

              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.text }, item.completed && styles.strikethrough]}>{item.name}</Text>
                <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
                  {item.category}{item.completed && item.actualPrice ? ` • Paid ${currencySymbol}${item.actualPrice}` : ''}
                </Text>
              </View>

              <View style={styles.itemRight}>
                <Text style={[styles.itemAmount, { color: item.completed ? '#10B981' : colors.text }]}>
                  {currencySymbol}
                  {(item.completed && item.actualPrice ? item.actualPrice : item.estimatedPrice || 0).toLocaleString()}
                </Text>
                <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}>
                  <Trash2 color={colors.textMuted} size={14} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Add FAB */}
      <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.fab, { shadowColor: colors.primary }]}>
        <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
          <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Actual Price Modal */}
      <Modal visible={priceModalVisible} animationType="fade" transparent onRequestClose={() => setPriceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Actual Paid Price</Text>
              <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.actualSub, { color: colors.textSecondary }]}>
              Item: <Text style={{ color: colors.text, fontWeight: '700' }}>{itemForPrice?.name}</Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ACTUAL PRICE PAID ({currencySymbol})</Text>
              <TextInput
                value={actualPriceInput}
                onChangeText={setActualPriceInput}
                placeholder="Amount paid at checkout"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <TouchableOpacity onPress={handleSaveActualPrice} style={styles.submitBtn}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.submitGradient}>
                <Text style={styles.submitText}>Mark as Purchased</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Shopping Item</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ITEM NAME</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Olive Oil, Monitor Stand"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ESTIMATED PRICE ({currencySymbol})</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="450"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Groceries, Electronics, etc."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <TouchableOpacity onPress={handleAddItem} disabled={saving} style={[styles.submitBtn, { opacity: saving ? 0.6 : 1 }]}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.submitGradient}>
                <Text style={styles.submitText}>{saving ? 'Adding…' : 'Add to Shopping List'}</Text>
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
  headerArea: { paddingHorizontal: 16, paddingTop: 16 },
  twoCardsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 14, borderRadius: 20, borderWidth: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  categoryPillsScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoryPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  categoryPillText: { fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 90 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  emptyStateText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  checkboxTouch: { marginRight: 12 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  itemCategory: { fontSize: 11, fontWeight: '500' },
  strikethrough: { textDecorationLine: 'line-through' },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  deleteBtn: { padding: 4 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 54, height: 54, borderRadius: 27, elevation: 8 },
  fabGradient: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  actualSub: { fontSize: 12, marginBottom: 14 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, fontWeight: '600' },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  submitGradient: { height: 48, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
