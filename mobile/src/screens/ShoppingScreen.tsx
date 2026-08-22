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
  ShoppingCart,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  X,
  Package,
  DollarSign,
  Tag,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

interface ShoppingItem {
  id: string
  title: string
  estimatedAmount: number
  actualAmount?: number
  category: string
  completed: boolean
}

export const ShoppingScreen = ({ navigation }: { navigation?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const [items, setItems] = useState<ShoppingItem[]>([
    { id: 's1', title: 'Organic Almond Milk & Oats', estimatedAmount: 420, actualAmount: 390, category: 'Groceries', completed: true },
    { id: 's2', title: 'Noise Cancelling Headphones', estimatedAmount: 14999, actualAmount: 0, category: 'Electronics', completed: false },
    { id: 's3', title: 'Ergonomic Desk Mat', estimatedAmount: 899, actualAmount: 850, category: 'Home Office', completed: true },
    { id: 's4', title: 'Whey Protein Powder 2kg', estimatedAmount: 3200, actualAmount: 0, category: 'Health & Fitness', completed: false },
    { id: 's5', title: 'Toothpaste & Bath Essentials', estimatedAmount: 350, actualAmount: 320, category: 'Household', completed: true },
  ])

  const [selectedCategory, setSelectedCategory] = useState('All')

  // Add Item Modal
  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Groceries')

  // Actual Price Modal
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [itemForPrice, setItemForPrice] = useState<ShoppingItem | null>(null)
  const [actualPriceInput, setActualPriceInput] = useState('')

  const categories = ['All', 'Groceries', 'Electronics', 'Home Office', 'Health & Fitness', 'Household']

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((i) => i.category === selectedCategory)

  const totalEstimated = items.reduce((sum, item) => sum + item.estimatedAmount, 0)
  const totalActual = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + (item.actualAmount || item.estimatedAmount), 0)
  const remainingTotal = Math.max(0, totalEstimated - totalActual)

  const handleToggleComplete = (item: ShoppingItem) => {
    if (!item.completed) {
      // Prompt actual price
      setItemForPrice(item)
      setActualPriceInput(item.estimatedAmount.toString())
      setPriceModalVisible(true)
    } else {
      // Mark unbought
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, completed: false, actualAmount: 0 } : i))
      )
    }
  }

  const handleSaveActualPrice = () => {
    if (!itemForPrice) return
    const actualVal = parseFloat(actualPriceInput) || itemForPrice.estimatedAmount

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemForPrice.id ? { ...i, completed: true, actualAmount: actualVal } : i
      )
    )

    setPriceModalVisible(false)
    setItemForPrice(null)
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleAddItem = () => {
    if (!title || !amount) {
      Alert.alert('Required', 'Please enter item name and price.')
      return
    }

    const newItem: ShoppingItem = {
      id: 's_' + Date.now(),
      title: title.trim(),
      estimatedAmount: parseFloat(amount),
      actualAmount: 0,
      category: category.trim(),
      completed: false,
    }

    setItems((prev) => [newItem, ...prev])
    setModalVisible(false)
    setTitle('')
    setAmount('')
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top 2-Col Stat Row */}
      <View style={styles.headerArea}>
        <View style={styles.twoCardsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <ShoppingCart color="#3B82F6" size={16} />
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryPillsScroll}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            activeOpacity={0.8}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.categoryPill,
              {
                backgroundColor: selectedCategory === cat ? '#10B981' : colors.surfaceGlass,
                borderColor: selectedCategory === cat ? '#10B981' : colors.surfaceGlassBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryPillText,
                { color: selectedCategory === cat ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Checklist items */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredItems.map((item) => (
          <View
            key={item.id}
            style={[
              styles.itemCard,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.surfaceGlassBorder,
                opacity: item.completed ? 0.75 : 1,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleToggleComplete(item)}
              style={styles.checkboxTouch}
            >
              {item.completed ? (
                <CheckCircle2 color="#10B981" size={22} />
              ) : (
                <Circle color={colors.textMuted} size={22} />
              )}
            </TouchableOpacity>

            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: colors.text },
                  item.completed && styles.strikethrough,
                ]}
              >
                {item.title}
              </Text>
              <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
                {item.category} {item.completed && item.actualAmount ? `• Paid ${currencySymbol}${item.actualAmount}` : ''}
              </Text>
            </View>

            <View style={styles.itemRight}>
              <Text style={[styles.itemAmount, { color: item.completed ? '#10B981' : colors.text }]}>
                {currencySymbol}
                {(item.completed && item.actualAmount ? item.actualAmount : item.estimatedAmount).toLocaleString()}
              </Text>
              <TouchableOpacity
                onPress={() => deleteItem(item.id)}
                style={styles.deleteBtn}
              >
                <Trash2 color={colors.textMuted} size={14} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Add FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[styles.fab, { shadowColor: colors.primary }]}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Actual Price Modal */}
      <Modal visible={priceModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Actual Paid Price</Text>
              <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.actualSub, { color: colors.textSecondary }]}>
              Item: <Text style={{ color: colors.text, fontWeight: '700' }}>{itemForPrice?.title}</Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                ACTUAL PRICE PAID ({currencySymbol})
              </Text>
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
      <Modal visible={modalVisible} animationType="slide" transparent>
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                ESTIMATED PRICE ({currencySymbol})
              </Text>
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

            <TouchableOpacity onPress={handleAddItem} style={styles.submitBtn}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.submitGradient}>
                <Text style={styles.submitText}>Add to Shopping List</Text>
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
  twoCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  categoryPillsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: { fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 90 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkboxTouch: { marginRight: 12 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  itemCategory: { fontSize: 11, fontWeight: '500' },
  strikethrough: { textDecorationLine: 'line-through' },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  deleteBtn: { padding: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    elevation: 8,
  },
  fabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  actualSub: { fontSize: 12, marginBottom: 14 },
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
