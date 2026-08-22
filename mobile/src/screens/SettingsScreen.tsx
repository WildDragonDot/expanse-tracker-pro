import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  User as UserIcon,
  Globe,
  Calendar,
  Moon,
  Sun,
  Bell,
  Download,
  ShieldAlert,
  ShieldCheck,
  Lock,
  LogOut,
  Sparkles,
  Check,
  X,
  Trash2,
  Sliders,
  Vibrate,
  Smartphone,
  EyeOff,
  Cloud,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

export const SettingsScreen = ({ navigation }: { navigation?: any }) => {
  const { user, logout, updateProfile } = useAuth()
  const { theme, toggleTheme, colors } = useAppTheme()

  // State
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR')
  const [billingDay, setBillingDay] = useState(user?.billingCycleStartDay || 1)
  const [billAlerts, setBillAlerts] = useState(true)
  const [budgetWarnings, setBudgetWarnings] = useState(true)
  const [hapticsEnabled, setHapticsEnabled] = useState(true)
  const [biometricsEnabled, setBiometricsEnabled] = useState(false)
  const [maskBalances, setMaskBalances] = useState(false)

  // Modals
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false)
  const [billingModalVisible, setBillingModalVisible] = useState(false)
  const [profileModalVisible, setProfileModalVisible] = useState(false)
  const [securityModalVisible, setSecurityModalVisible] = useState(false)
  const [clearDataModalVisible, setClearDataModalVisible] = useState(false)

  // Profile Form
  const [editName, setEditName] = useState(user?.name || '')
  const [editEmail, setEditEmail] = useState(user?.email || '')
  const [editSalary, setEditSalary] = useState('85,000')
  const [editSavingsTarget, setEditSavingsTarget] = useState('25,000')

  const currencies = [
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
    { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
    { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
    { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
    { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CAD)' },
    { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar (AUD)' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)' },
  ]

  const handleCurrencySelect = async (code: string) => {
    setSelectedCurrency(code)
    await updateProfile({ currency: code })
    setCurrencyModalVisible(false)
    Alert.alert('Currency Set', `Default display currency updated to ${code}.`)
  }

  const handleBillingDaySelect = async (day: number) => {
    setBillingDay(day)
    await updateProfile({ billingCycleStartDay: day })
    setBillingModalVisible(false)
    Alert.alert('Billing Cycle Updated', `Your monthly budget will now reset on day ${day} of every month.`)
  }

  const handleSaveProfile = async () => {
    if (!editName) {
      Alert.alert('Required', 'Name cannot be blank.')
      return
    }
    await updateProfile({ name: editName })
    setProfileModalVisible(false)
    Alert.alert('Profile Updated', 'Your profile details have been saved successfully.')
  }

  const handleExportData = (format: 'CSV' | 'JSON') => {
    Alert.alert(
      `Export ${format} Statement`,
      `Your full financial ledger data, budgets, and categorization rules are being exported as finance_export_${Date.now()}.${format.toLowerCase()}.`,
      [{ text: 'OK' }]
    )
  }

  const handleClearDataConfirm = () => {
    setClearDataModalVisible(false)
    Alert.alert(
      'Data Cleared',
      'All local test transactions and cache have been reset to fresh defaults.'
    )
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of FinanceTracker Pro?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Profile Hero Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setProfileModalVisible(true)}
          style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
        >
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarInitials}>
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'DR'}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Dragon (Demo VIP)'}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || 'user@example.com'}</Text>
              <View style={styles.proPill}>
                <Sparkles color="#10B981" size={10} />
                <Text style={styles.proPillText}>AUTONOMOUS VIP ACTIVE</Text>
              </View>
            </View>
            <Sliders color={colors.textSecondary} size={18} />
          </View>
        </TouchableOpacity>

        {/* 2. Account Preferences Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences & Regional</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          {/* Currency Modal Trigger */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrencyModalVisible(true)}
            style={[styles.settingRow, { borderColor: colors.inputBorder }]}
          >
            <View style={styles.rowLeft}>
              <Globe color={colors.primary} size={18} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Default Currency</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{selectedCurrency} ({currencies.find(c => c.code === selectedCurrency)?.symbol})</Text>
              </View>
            </View>
            <Text style={[styles.chevronText, { color: colors.primary }]}>Change ›</Text>
          </TouchableOpacity>

          {/* Billing Cycle Modal Trigger */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setBillingModalVisible(true)}
            style={[styles.settingRow, { borderColor: colors.inputBorder }]}
          >
            <View style={styles.rowLeft}>
              <Calendar color="#8B5CF6" size={18} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Billing Cycle Start</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Day {billingDay} of each month</Text>
              </View>
            </View>
            <Text style={[styles.chevronText, { color: '#8B5CF6' }]}>Change ›</Text>
          </TouchableOpacity>

          {/* Theme Switch */}
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              {theme === 'dark' ? <Moon color="#38BDF8" size={18} /> : <Sun color="#F59E0B" size={18} />}
              <Text style={[styles.rowTitle, { color: colors.text }]}>Dark Mode Appearance</Text>
            </View>
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ true: colors.primary, false: '#CBD5E1' }} />
          </View>
        </View>

        {/* 3. Security & Privacy */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Security & Privacy</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={[styles.switchRow, { borderColor: colors.inputBorder }]}>
            <View style={styles.rowLeft}>
              <Smartphone color="#10B981" size={18} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Biometric & PIN Lock</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Protect app with Fingerprint/FaceID</Text>
              </View>
            </View>
            <Switch value={biometricsEnabled} onValueChange={setBiometricsEnabled} trackColor={{ true: '#10B981', false: '#CBD5E1' }} />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <EyeOff color="#8B5CF6" size={18} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Mask Financial Balances</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Hide numbers on public screen</Text>
              </View>
            </View>
            <Switch value={maskBalances} onValueChange={setMaskBalances} trackColor={{ true: '#8B5CF6', false: '#CBD5E1' }} />
          </View>
        </View>

        {/* 4. Notifications & Alerts */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications & Reminders</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={[styles.switchRow, { borderColor: colors.inputBorder }]}>
            <View style={styles.rowLeft}>
              <Bell color="#10B981" size={18} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Recurring Bill Reminders</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Alert 7 days & 3 days before due date</Text>
              </View>
            </View>
            <Switch value={billAlerts} onValueChange={setBillAlerts} trackColor={{ true: '#10B981', false: '#CBD5E1' }} />
          </View>

          <View style={[styles.switchRow, { borderColor: colors.inputBorder }]}>
            <View style={styles.rowLeft}>
              <ShieldAlert color="#F59E0B" size={18} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Budget Limit Warnings</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Notify at 80% & 100% threshold</Text>
              </View>
            </View>
            <Switch value={budgetWarnings} onValueChange={setBudgetWarnings} trackColor={{ true: '#F59E0B', false: '#CBD5E1' }} />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <Vibrate color="#EC4899" size={18} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Haptic Tactile Feedback</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Vibrate on transaction log & actions</Text>
              </View>
            </View>
            <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} trackColor={{ true: '#EC4899', false: '#CBD5E1' }} />
          </View>
        </View>

        {/* 5. Data Freedom & Backups */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Freedom & Backups</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <TouchableOpacity onPress={() => handleExportData('CSV')} style={[styles.exportBtn, { borderColor: colors.inputBorder }]}>
            <Download color={colors.primary} size={16} />
            <Text style={[styles.exportBtnText, { color: colors.text }]}>Download Ledger Records (CSV)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExportData('JSON')} style={[styles.exportBtn, { borderColor: colors.inputBorder }]}>
            <Cloud color="#10B981" size={16} />
            <Text style={[styles.exportBtnText, { color: colors.text }]}>Export Full JSON Backup</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Danger Zone & Logout */}
        <Text style={[styles.sectionTitle, { color: '#F43F5E' }]}>Danger Zone</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <TouchableOpacity
            onPress={() => setClearDataModalVisible(true)}
            style={[styles.dangerBtn, { borderColor: 'rgba(244, 63, 94, 0.2)' }]}
          >
            <Trash2 color="#F43F5E" size={16} />
            <Text style={styles.dangerBtnText}>Reset Local Storage & Cache</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut color="#F43F5E" size={16} />
            <Text style={styles.logoutBtnText}>Sign Out of Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {currencies.map((c) => {
                const isSelected = selectedCurrency === c.code
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => handleCurrencySelect(c.code)}
                    style={[
                      styles.currencyModalRow,
                      {
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        borderColor: isSelected ? '#8B5CF6' : 'rgba(255, 255, 255, 0.06)',
                      },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <Text style={[styles.currencySymbolBadge, { color: colors.primary }]}>{c.symbol}</Text>
                      <Text style={[styles.currencyLabelModal, { color: colors.text }]}>{c.label}</Text>
                    </View>
                    {isSelected && <Check color="#10B981" size={18} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Billing Cycle Modal */}
      <Modal visible={billingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Billing Cycle Reset Day</Text>
              <TouchableOpacity onPress={() => setBillingModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Pick the day of the month when your salary is credited or monthly budget resets:
            </Text>
            <View style={styles.daysGrid}>
              {[1, 5, 10, 15, 20, 25, 28, 30].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => handleBillingDaySelect(d)}
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: billingDay === d ? '#8B5CF6' : colors.inputBg,
                      borderColor: billingDay === d ? '#8B5CF6' : colors.inputBorder,
                    },
                  ]}
                >
                  <Text style={[styles.dayPillText, { color: billingDay === d ? '#FFFFFF' : colors.text }]}>
                    Day {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Personal Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MONTHLY SALARY / INFLOW</Text>
              <TextInput
                value={editSalary}
                onChangeText={setEditSalary}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              />
            </View>

            <TouchableOpacity onPress={handleSaveProfile} style={styles.saveProfileBtn}>
              <LinearGradient colors={colors.primaryGradient} style={styles.submitGradient}>
                <Text style={styles.submitText}>Save Profile Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Data Confirmation Modal */}
      <Modal visible={clearDataModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: '#F43F5E' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#F43F5E' }]}>Confirm Reset Local Data</Text>
              <TouchableOpacity onPress={() => setClearDataModalVisible(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary, marginBottom: 20 }]}>
              This will clear local cache and reload fresh sample transactions. Are you sure you want to proceed?
            </Text>
            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={() => setClearDataModalVisible(false)} style={[styles.modalCancelBtn, { borderColor: colors.inputBorder }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearDataConfirm} style={styles.modalDangerConfirmBtn}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Reset Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  proPillText: { color: '#10B981', fontSize: 9, fontWeight: '800' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowTitle: { fontSize: 13, fontWeight: '700' },
  rowSub: { fontSize: 11, marginTop: 2 },
  chevronText: { fontSize: 12, fontWeight: '800' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exportBtnText: { fontSize: 13, fontWeight: '600' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dangerBtnText: { color: '#F43F5E', fontSize: 13, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
  },
  logoutBtnText: { color: '#F43F5E', fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalSub: { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  currencyModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  currencySymbolBadge: { fontSize: 16, fontWeight: '900', width: 36 },
  currencyLabelModal: { fontSize: 13, fontWeight: '700' },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  dayPill: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayPillText: { fontSize: 12, fontWeight: '800' },
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
  saveProfileBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  submitGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDangerConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F43F5E',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
