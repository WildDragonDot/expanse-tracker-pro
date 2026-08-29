import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  ReceiptText,
  TrendingUp,
  Calculator,
  Search,
  FileSpreadsheet,
  ChevronRight,
  Info,
  X,
  PlusCircle,
  ArrowUpCircle,
  Camera,
  Sparkles,
  MessageSquare,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { ExpensesSkeleton, TransactionSkeleton } from '../components/SkeletonLoader'
import { TransactionDetailsModal, TransactionItem } from '../components/TransactionDetailsModal'
import { InfoTooltipModal, TooltipData } from '../components/InfoTooltipModal'
import { Expense, Income, ExpenseCategoryItem, ExpenseBankItem, ExpensePaymentModeItem } from '../types'
import { api } from '../services/api'
import { formatTransactionDate } from '../utils/dateUtils'

const DEFAULT_CATEGORIES = [
  { id: 'c1', name: 'Food', icon: '🍔' },
  { id: 'c2', name: 'Transport', icon: '🚗' },
  { id: 'c3', name: 'Shopping', icon: '🛍️' },
  { id: 'c4', name: 'Bills', icon: '📄' },
  { id: 'c5', name: 'Entertainment', icon: '🎬' },
  { id: 'c6', name: 'Healthcare', icon: '🏥' },
  { id: 'c7', name: 'Education', icon: '📚' },
  { id: 'c8', name: 'Other', icon: '📁' },
]

const DEFAULT_MODES = [
  { id: 'm1', name: 'Cash', icon: '💵' },
  { id: 'm2', name: 'UPI', icon: '📱' },
  { id: 'm3', name: 'Net Banking', icon: '🏦' },
  { id: 'm4', name: 'Udhar', icon: '🤝' },
  { id: 'm5', name: 'Card', icon: '💳' },
  { id: 'm6', name: 'Wallet', icon: '👛' },
]

const DEFAULT_BANKS = [
  { id: 'b1', name: 'Cash', icon: '💵' },
  { id: 'b2', name: 'HDFC Bank', icon: '🏦' },
  { id: 'b3', name: 'SBI', icon: '🏦' },
  { id: 'b4', name: 'ICICI Bank', icon: '🏦' },
  { id: 'b5', name: 'Axis Bank', icon: '🏦' },
]

export const ExpensesScreen = ({ navigation, route }: { navigation?: any; route?: any }) => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null)
  const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string; icon: string }>>(DEFAULT_CATEGORIES)
  const [modesList, setModesList] = useState<Array<{ id: string; name: string; icon: string }>>(DEFAULT_MODES)
  const [banksList, setBanksList] = useState<Array<{ id: string; name: string; icon: string }>>(DEFAULT_BANKS)

  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'expense' | 'income'>('expense')
  const [formTitle, setFormTitle] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('Food')
  const [formMode, setFormMode] = useState('UPI')
  const [formBank, setFormBank] = useState('HDFC Bank')
  const [formNotes, setFormNotes] = useState('')

  const loadData = async () => {
    try {
      const [expList, incList, cats, modes, banks] = await Promise.all([
        api.getExpenses().catch(() => []),
        api.getIncomes().catch(() => []),
        api.getExpenseCategories().catch(() => []),
        api.getExpensePaymentModes().catch(() => []),
        api.getExpenseBanks().catch(() => []),
      ])
      setExpenses(expList)
      setIncomes(incList)
      if (Array.isArray(cats) && cats.length > 0) {
        setCategoriesList(cats.map(c => ({ id: c.id, name: c.name, icon: c.icon })))
        if (!formCategory) setFormCategory(cats[0].name)
      }
      if (Array.isArray(modes) && modes.length > 0) {
        setModesList(modes.map(m => ({ id: m.id, name: m.name, icon: m.icon })))
      }
      if (Array.isArray(banks) && banks.length > 0) {
        setBanksList(banks.map(b => ({ id: b.id, name: b.name, icon: b.icon })))
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  useEffect(() => {
    if (route?.params?.openModal) {
      setModalType(route.params.openModal === 'income' ? 'income' : 'expense')
      setModalVisible(true)
      navigation?.setParams({ openModal: undefined })
    }
  }, [route?.params?.openModal])

  const [isScanning, setIsScanning] = useState(false)
  const [smsModalVisible, setSmsModalVisible] = useState(false)
  const [smsText, setSmsText] = useState('')

  const handleScanReceipt = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll permission is required to scan receipt.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets[0]?.base64) {
        setIsScanning(true)
        try {
          const res = await api.scanReceiptOCR(result.assets[0].base64)
          if (res.scannedData) {
            if (res.scannedData.title) setFormTitle(res.scannedData.title)
            if (res.scannedData.amount) setFormAmount(String(res.scannedData.amount))
            if (res.scannedData.category) setFormCategory(res.scannedData.category)
            if (res.scannedData.paymentMode) setFormMode(res.scannedData.paymentMode)
            Alert.alert('📸 Receipt Scanned!', `Auto-filled details for ${res.scannedData.title}`)
          }
        } catch {
          Alert.alert('Scan Failed', 'Could not extract text. Please enter details manually.')
        } finally {
          setIsScanning(false)
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not pick image.')
      setIsScanning(false)
    }
  }

  const handleParseSms = async () => {
    if (!smsText.trim()) return
    try {
      const res = await api.parseBankSMS(smsText.trim())
      if (res.transaction && res.transaction.amount) {
        const t = res.transaction
        if (t.merchant) setFormTitle(t.merchant)
        setFormAmount(String(t.amount))
        if (t.bank) setFormBank(t.bank)
        if (t.paymentMode) setFormMode(t.paymentMode)
        setSmsModalVisible(false)
        setSmsText('')
        Alert.alert('📲 SMS Parsed!', `Auto-filled ₹${t.amount} from ${t.bank}`)
      } else {
        Alert.alert('Parse Note', 'Could not detect an amount in this SMS. Please check.')
      }
    } catch {
      Alert.alert('Parse Failed', 'Could not identify bank transaction in pasted SMS.')
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleSaveTransaction = async () => {
    if (!formTitle || !formAmount) {
      Alert.alert('Required', 'Please enter transaction title and amount.')
      return
    }

    const amountNum = parseFloat(formAmount)
    const currentTimestamp = new Date().toISOString()

    try {
      if (modalType === 'expense') {
        const created = await api.createExpense({
          title: formTitle.trim(),
          amount: amountNum,
          category: formCategory,
          bank: formBank,
          paymentMode: formMode,
          date: currentTimestamp,
          notes: formNotes.trim(),
        })
        setExpenses((prev) => [created, ...prev])
      } else {
        const created = await api.createIncome({
          source: formTitle.trim(),
          amount: amountNum,
          date: currentTimestamp,
          notes: formNotes.trim(),
        })
        setIncomes((prev) => [created, ...prev])
      }

      setModalVisible(false)
      setFormTitle('')
      setFormAmount('')
      setFormNotes('')
    } catch (err: any) {
      Alert.alert('Could not save', err.message || 'Please try again.')
    }
  }

  const handleDelete = async (id: string, type: 'expense' | 'income') => {
    const remove = type === 'expense' ? api.deleteExpense(id) : api.deleteIncome(id)
    try {
      await remove
      if (type === 'expense') setExpenses((prev) => prev.filter((item) => item.id !== id))
      else setIncomes((prev) => prev.filter((item) => item.id !== id))
    } catch (err: any) {
      Alert.alert('Could not delete', err.message || 'Please try again.')
    }
  }

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  // Combine and sort
  const allTransactions: TransactionItem[] = [
    ...expenses.map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      category: e.category,
      bank: e.bank,
      paymentMode: e.paymentMode,
      date: e.date,
      type: 'expense' as const,
      notes: e.notes,
    })),
    ...incomes.map((i) => ({
      id: i.id,
      title: i.source,
      amount: i.amount,
      category: 'Income',
      bank: 'Primary Salary Account',
      paymentMode: 'Bank Transfer / IMPS',
      date: i.date,
      type: 'income' as const,
      notes: i.notes,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filteredTransactions = searchQuery
    ? allTransactions.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.bank && t.bank.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allTransactions

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const txCount = allTransactions.length
  const avgSpent = expenses.length > 0 ? Math.round(totalSpent / expenses.length) : 0
  const peakSpent = expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount)) : 0

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Expenses & Income" onProfilePress={() => navigation?.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <ExpensesSkeleton />
        ) : (
          <>
            {/* 1. 4 Stat Cards in 2 Rows of 2 (Exact 2 per row layout) */}
            <View style={styles.twoCardsRow}>
          {/* Card 1: Total Spent */}
          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.statHeader}>
              <View style={styles.iconCircleRed}>
                <CreditCard color="#FFFFFF" size={14} />
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() =>
                  setActiveTooltip({
                    title: 'Total Expenditure',
                    description: 'Cumulative total of all debit expenses recorded in this period across all bank accounts and cash.',
                    details: 'Excludes incoming credits and transfers between your own accounts.',
                    accentColor: '#F43F5E',
                  })
                }
                style={styles.pillRed}
              >
                <Text style={styles.pillRedText}>Total</Text>
                <Info color="rgba(244, 63, 94, 0.9)" size={10} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.statValue, { color: '#F43F5E' }]}>
              {currencySymbol}{totalSpent.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Spent</Text>
          </View>

          {/* Card 2: Count */}
          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.statHeader}>
              <View style={styles.iconCircleBlue}>
                <ReceiptText color="#FFFFFF" size={14} />
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() =>
                  setActiveTooltip({
                    title: 'Transaction Volume',
                    description: 'Total number of transactions completed and logged in the current ledger timeframe.',
                    details: 'Helps evaluate spending frequency and micro-transactions patterns.',
                    accentColor: '#3B82F6',
                  })
                }
                style={styles.pillBlue}
              >
                <Text style={styles.pillBlueText}>Count</Text>
                <Info color="rgba(59, 130, 246, 0.9)" size={10} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{txCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Transactions</Text>
          </View>
        </View>

        <View style={styles.twoCardsRow}>
          {/* Card 3: Avg */}
          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.statHeader}>
              <View style={styles.iconCircleOrange}>
                <Calculator color="#FFFFFF" size={14} />
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() =>
                  setActiveTooltip({
                    title: 'Average Expense Value',
                    description: 'The average amount spent per transaction during this period.',
                    details: 'Formula: Total Spend / Number of Debit Transactions.',
                    accentColor: '#F59E0B',
                  })
                }
                style={styles.pillOrange}
              >
                <Text style={styles.pillOrangeText}>Avg</Text>
                <Info color="rgba(245, 158, 11, 0.9)" size={10} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {currencySymbol}{avgSpent.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
          </View>

          {/* Card 4: Peak */}
          <View style={[styles.statCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.statHeader}>
              <View style={styles.iconCirclePink}>
                <TrendingUp color="#FFFFFF" size={14} />
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() =>
                  setActiveTooltip({
                    title: 'Highest Single Expense',
                    description: 'The maximum single transaction amount recorded in the current active period.',
                    details: 'Highlights large one-off purchases or annual subscription payments.',
                    accentColor: '#F43F5E',
                  })
                }
                style={styles.pillPink}
              >
                <Text style={styles.pillPinkText}>Peak</Text>
                <Info color="rgba(244, 63, 94, 0.9)" size={10} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.statValue, { color: '#F43F5E' }]}>
              {currencySymbol}{peakSpent.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Highest</Text>
          </View>
        </View>

        {/* 2. Monthly Budget Banner (Exact image 2 style) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation?.navigate('Budget')}
          style={[styles.budgetBanner, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
        >
          <View style={styles.bannerLeft}>
            <View style={styles.calcIconCircle}>
              <Calculator color="#FFFFFF" size={18} />
            </View>
            <View>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>Monthly Budget</Text>
              <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                Set & track category-wise budgets
              </Text>
            </View>
          </View>
          <ChevronRight color={colors.textSecondary} size={18} />
        </TouchableOpacity>

        {/* 3. Search Bar (Exact image 2 style) */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Search color={colors.textSecondary} size={16} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search across title, category, bank, tags"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* 4. 3 Action Buttons in a Row (Exact image 2 style) */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setModalType('expense')
              setModalVisible(true)
            }}
            style={[styles.actionBtnLarge, { backgroundColor: '#F43F5E' }]}
          >
            <View style={styles.btnIconRound}>
              <PlusCircle color="#FFFFFF" size={16} strokeWidth={2.5} />
            </View>
            <Text style={styles.actionBtnLargeText}>Add Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setModalType('income')
              setModalVisible(true)
            }}
            style={[styles.actionBtnLarge, { backgroundColor: '#10B981' }]}
          >
            <View style={styles.btnIconRound}>
              <ArrowUpCircle color="#FFFFFF" size={16} strokeWidth={2.5} />
            </View>
            <Text style={styles.actionBtnLargeText}>Add Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation?.navigate('Reports')}
            style={[styles.actionBtnLarge, { backgroundColor: '#6366F1' }]}
          >
            <View style={styles.btnIconRound}>
              <FileSpreadsheet color="#FFFFFF" size={16} strokeWidth={2} />
            </View>
            <Text style={styles.actionBtnLargeText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Transactions List */}
        <View style={styles.txList}>
          {loading ? (
            <>
              <TransactionSkeleton />
              <TransactionSkeleton />
              <TransactionSkeleton />
            </>
          ) : (
            filteredTransactions.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                activeOpacity={0.75}
                onPress={() => setSelectedTx(tx)}
                style={[styles.txCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
              >
                <CategoryIcon
                  name={tx.category}
                  color={tx.type === 'income' ? '#10B981' : '#F43F5E'}
                  size={18}
                  containerSize={40}
                  containerBg={tx.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}
                  style={{ marginRight: 12 }}
                />
                <View style={styles.txInfo}>
                  <Text style={[styles.txTitle, { color: colors.text }]}>{tx.title}</Text>
                  <Text style={[styles.txMeta, { color: colors.textSecondary }]}>
                    {tx.category} • {formatTransactionDate(tx.date)} • {tx.bank || 'Account'}
                  </Text>
                </View>
                <View style={styles.amountWrap}>
                  <Text style={[styles.txAmount, { color: tx.type === 'income' ? '#10B981' : colors.text }]}>
                    {tx.type === 'income' ? '+' : '-'}
                    {currencySymbol}
                    {tx.amount.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        </>
      )}
      </ScrollView>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        visible={!!selectedTx}
        transaction={selectedTx}
        currencySymbol={currencySymbol}
        onClose={() => setSelectedTx(null)}
        onDelete={(id) => handleDelete(id, selectedTx?.type === 'income' ? 'income' : 'expense')}
      />

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalType === 'expense' ? 'Log New Expense' : 'Log New Income'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false}>
              {/* Smart Auto-Fill Quick Tools */}
              {modalType === 'expense' && (
                <View style={[styles.smartToolsCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Sparkles color="#F43F5E" size={14} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>AI SMART AUTO-FILL</Text>
                    </View>
                    {isScanning && <Text style={{ fontSize: 10, color: '#F43F5E', fontWeight: '700' }}>Scanning...</Text>}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={handleScanReceipt}
                      style={[styles.smartToolBtn, { backgroundColor: 'rgba(244, 63, 94, 0.12)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}
                    >
                      <Camera color="#F43F5E" size={15} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#F43F5E' }}>Scan Receipt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setSmsModalVisible(true)}
                      style={[styles.smartToolBtn, { backgroundColor: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}
                    >
                      <MessageSquare color="#6366F1" size={15} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#6366F1' }}>Paste Bank SMS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Category Selector (Expense only) */}
              {modalType === 'expense' && (
                <View style={styles.modalInputGroup}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {categoriesList.map((cat) => {
                      const isSelected = formCategory.toLowerCase() === cat.name.toLowerCase()
                      return (
                        <TouchableOpacity
                          key={cat.id || cat.name}
                          activeOpacity={0.75}
                          onPress={() => setFormCategory(cat.name)}
                          style={[
                            styles.chip,
                            { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                            isSelected && [styles.chipActive, { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: '#F43F5E' }],
                          ]}
                        >
                          <Text style={styles.chipIcon}>{cat.icon || '📁'}</Text>
                          <Text
                            style={[
                              styles.chipText,
                              { color: colors.textSecondary },
                              isSelected && [styles.chipTextActive, { color: '#F43F5E' }],
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Transaction / Payment Mode Selector (Expense only) */}
              {modalType === 'expense' && (
                <View style={styles.modalInputGroup}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>TRANSACTION MODE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {modesList.map((mode) => {
                      const isSelected = formMode.toLowerCase() === mode.name.toLowerCase()
                      return (
                        <TouchableOpacity
                          key={mode.id || mode.name}
                          activeOpacity={0.75}
                          onPress={() => setFormMode(mode.name)}
                          style={[
                            styles.chip,
                            { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                            isSelected && [styles.chipActive, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }],
                          ]}
                        >
                          <Text style={styles.chipIcon}>{mode.icon || '💳'}</Text>
                          <Text
                            style={[
                              styles.chipText,
                              { color: colors.textSecondary },
                              isSelected && [styles.chipTextActive, { color: '#F59E0B' }],
                            ]}
                          >
                            {mode.name}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Bank / Account Selector (Expense only) */}
              {modalType === 'expense' && (
                <View style={styles.modalInputGroup}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>ACCOUNT / BANK</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {banksList.map((b) => {
                      const isSelected = formBank.toLowerCase() === b.name.toLowerCase()
                      return (
                        <TouchableOpacity
                          key={b.id || b.name}
                          activeOpacity={0.75}
                          onPress={() => setFormBank(b.name)}
                          style={[
                            styles.chip,
                            { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                            isSelected && [styles.chipActive, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }],
                          ]}
                        >
                          <Text style={styles.chipIcon}>{b.icon || '🏦'}</Text>
                          <Text
                            style={[
                              styles.chipText,
                              { color: colors.textSecondary },
                              isSelected && [styles.chipTextActive, { color: '#3B82F6' }],
                            ]}
                          >
                            {b.name}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  {modalType === 'expense' ? 'MERCHANT / DESCRIPTION' : 'INCOME SOURCE'}
                </Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder={modalType === 'expense' ? 'e.g. Grocery, Flight, Dinner' : 'e.g. Salary, Client Payout'}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>AMOUNT ({currencySymbol})</Text>
                <TextInput
                  value={formAmount}
                  onChangeText={setFormAmount}
                  placeholder="2,500"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>NOTES</Text>
                <TextInput
                  value={formNotes}
                  onChangeText={setFormNotes}
                  placeholder="Optional notes or description"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                />
              </View>

              <TouchableOpacity onPress={handleSaveTransaction} style={styles.modalSubmitBtn}>
                <LinearGradient
                  colors={modalType === 'expense' ? colors.primaryGradient : colors.secondaryGradient}
                  style={styles.modalGradientBtn}
                >
                  <Text style={styles.modalSubmitText}>Save Transaction to Ledger</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Quick SMS Paste Modal */}
      <Modal visible={smsModalVisible} animationType="fade" transparent onRequestClose={() => setSmsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSmsModalVisible(false)} />
          <View style={[styles.smsModalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Paste Bank SMS Alert</Text>
              <TouchableOpacity onPress={() => setSmsModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TextInput
              multiline
              numberOfLines={4}
              style={[styles.smsTextArea, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
              placeholder="Paste SMS here (e.g. Rs 450.00 debited from HDFC Bank to Swiggy on 29-Aug...)"
              placeholderTextColor={colors.textMuted}
              value={smsText}
              onChangeText={setSmsText}
              autoFocus
            />

            <TouchableOpacity style={styles.smsParseBtn} onPress={handleParseSms}>
              <Text style={styles.smsParseBtnText}>Auto-Fill Expense Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Info Tooltip Modal */}
      <InfoTooltipModal
        visible={!!activeTooltip}
        tooltip={activeTooltip}
        onClose={() => setActiveTooltip(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  twoCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircleRed: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F43F5E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillRedText: { color: '#F43F5E', fontSize: 10, fontWeight: '800' },
  iconCircleBlue: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillBlueText: { color: '#3B82F6', fontSize: 10, fontWeight: '800' },
  iconCircleOrange: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillOrangeText: { color: '#F59E0B', fontSize: 10, fontWeight: '800' },
  iconCirclePink: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillPink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillPinkText: { color: '#EC4899', fontSize: 10, fontWeight: '800' },
  statValue: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  budgetBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calcIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: { fontSize: 14, fontWeight: '800' },
  bannerSub: { fontSize: 11, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 12, fontWeight: '500' },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionBtnLarge: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnIconRound: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnLargeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  txList: {},
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: '700' },
  txMeta: { fontSize: 11, marginTop: 2 },
  amountWrap: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '800' },
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalInputGroup: { marginBottom: 14 },
  modalLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  modalGradientBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  chipActive: {
    borderWidth: 1.5,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    fontWeight: '800',
  },
  smartToolsCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  smartToolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  smsModalCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  smsTextArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    minHeight: 100,
    textAlignVertical: 'top',
    marginVertical: 12,
  },
  smsParseBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  smsParseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
})
