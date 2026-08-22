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
} from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

interface ShoppingItem {
  id: string
  title: string
  estimatedAmount: number
  category: string
  completed: boolean
}

export const ShoppingScreen = () => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  const [items, setItems] = useState<ShoppingItem[]>([
    { id: 's1', title: 'Organic Almond Milk & Oats', estimatedAmount: 420, category: 'Groceries', completed: false },
    { id: 's2', title: 'Noise Cancelling Headphones', estimatedAmount: 14999, category: 'Electronics', completed: false },
    { id: 's3', title: 'Ergonomic Desk Mat', estimatedAmount: 899, category: 'Home Office', completed: true },
    { id: 's4', title: 'Whey Protein Powder 2kg', estimatedAmount: 3200, category: 'Health & Fitness', completed: false },
    { id: 's5', title: 'Toothpaste & Bath Essentials', estimatedAmount: 350, category: 'Household', completed: true },
  ])

  // Modal
  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Groceries')

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const totalEstimated = items.reduce((sum, item) => sum + item.estimatedAmount, 0)
  const completedTotal = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.estimatedAmount, 0)
  const remainingTotal = totalEstimated - completedTotal

  const toggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i))
    )
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
      {/* Top Planned Budget Progress Card */}
      <View style={styles.headerArea}>
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.budgetCard}
        >
          <View style={styles.budgetHeader}>
            <View style={styles.badgePill}>
              <ShoppingCart color="#FFFFFF" size={12} />
              <Text style={styles.badgePillText}>SHOPPING & EXPENSE PLANNER</Text>
            </View>
            <Text style={styles.completedRatio}>
              {items.filter((i) => i.completed).length}/{items.length} Done
            </Text>
          </View>

          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>PLANNED SPEND</Text>
              <Text style={styles.amountValue}>
                {currencySymbol}
                {totalEstimated.toLocaleString()}
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View>
              <Text style={styles.amountLabel}>REMAINING</Text>
              <Text style={styles.amountValue}>
                {currencySymbol}
                {remainingTotal.toLocaleString()}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Checklist items */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.itemCard,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.surfaceGlassBorder,
                opacity: item.completed ? 0.6 : 1,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => toggleComplete(item.id)}
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
                {item.category}
              </Text>
            </View>

            <View style={styles.itemRight}>
              <Text style={[styles.itemAmount, { color: colors.text }]}>
                {currencySymbol}
                {item.estimatedAmount.toLocaleString()}
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
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceGlassBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Planned Shopping Item
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                ITEM NAME
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Wireless Mouse, Grocery"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                ESTIMATED PRICE ({currencySymbol})
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="1,200"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                CATEGORY
              </Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <TouchableOpacity onPress={handleAddItem} style={styles.saveBtn}>
              <LinearGradient
                colors={colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                <Text style={styles.saveBtnText}>Add to Shopping List</Text>
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
  headerArea: { padding: 16, paddingBottom: 8 },
  budgetCard: {
    padding: 18,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  completedRatio: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  amountLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  amountValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  amountDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  scrollContent: { padding: 16, paddingBottom: 80 },
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
  itemTitle: { fontSize: 13, fontWeight: '700' },
  strikethrough: { textDecorationLine: 'line-through', opacity: 0.6 },
  itemCategory: { fontSize: 11, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 14, fontWeight: '800' },
  deleteBtn: { marginTop: 4, padding: 2 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  saveGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
})
