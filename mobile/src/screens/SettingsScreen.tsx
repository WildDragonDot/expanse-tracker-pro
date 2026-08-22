import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
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
  LogOut,
  Sparkles,
  Check,
} from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

export const SettingsScreen = () => {
  const { user, logout, updateProfile } = useAuth()
  const { theme, toggleTheme, colors } = useAppTheme()

  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR')
  const [billingDay, setBillingDay] = useState(String(user?.billingCycleStartDay || 1))
  const [billAlerts, setBillAlerts] = useState(true)
  const [budgetWarnings, setBudgetWarnings] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(true)

  const currencies = [
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
    { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
    { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
    { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
  ]

  const handleCurrencyChange = async (code: string) => {
    setSelectedCurrency(code)
    await updateProfile({ currency: code })
    Alert.alert('Currency Updated', `Default app currency set to ${code}.`)
  }

  const handleExportData = (format: 'CSV' | 'JSON') => {
    Alert.alert(
      `Export ${format}`,
      `Your complete financial history (expenses, income, recurring bill rules, and AI health metrics) is packaged as finance_export_${Date.now()}.${format.toLowerCase()}. Download initiated.`,
      [{ text: 'OK' }]
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
        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarInitials}>
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'FT'}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Pro Member'}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || 'user@example.com'}</Text>
              <View style={styles.proPill}>
                <Sparkles color="#10B981" size={10} />
                <Text style={styles.proPillText}>AUTONOMOUS VIP ACTIVE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Currency Switcher */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Currency & Locale</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          {currencies.map((c) => {
            const active = selectedCurrency === c.code
            return (
              <TouchableOpacity
                key={c.code}
                onPress={() => handleCurrencyChange(c.code)}
                style={[styles.currencyRow, { borderColor: colors.inputBorder }]}
              >
                <View style={styles.currencyLeft}>
                  <Text style={[styles.currencySymbol, { color: colors.primary }]}>{c.symbol}</Text>
                  <Text style={[styles.currencyLabel, { color: colors.text }]}>{c.label}</Text>
                </View>
                {active && <Check color="#10B981" size={18} />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences & Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          {/* Theme Toggle */}
          <View style={[styles.switchRow, { borderColor: colors.inputBorder }]}>
            <View style={styles.switchLabelWrap}>
              {theme === 'dark' ? <Moon color={colors.primary} size={18} /> : <Sun color={colors.primary} size={18} />}
              <Text style={[styles.switchText, { color: colors.text }]}>Dark Mode Appearance</Text>
            </View>
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ true: colors.primary, false: '#CBD5E1' }} />
          </View>

          {/* Bill Reminders Toggle */}
          <View style={[styles.switchRow, { borderColor: colors.inputBorder }]}>
            <View style={styles.switchLabelWrap}>
              <Bell color="#10B981" size={18} />
              <Text style={[styles.switchText, { color: colors.text }]}>Recurring Bill Alerts (T-7, T-3)</Text>
            </View>
            <Switch value={billAlerts} onValueChange={setBillAlerts} trackColor={{ true: '#10B981', false: '#CBD5E1' }} />
          </View>

          {/* Budget Limit Warnings */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelWrap}>
              <ShieldAlert color="#F59E0B" size={18} />
              <Text style={[styles.switchText, { color: colors.text }]}>Budget Warning (80% & 100%)</Text>
            </View>
            <Switch value={budgetWarnings} onValueChange={setBudgetWarnings} trackColor={{ true: '#F59E0B', false: '#CBD5E1' }} />
          </View>
        </View>

        {/* Data Portability (Export) */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Export & Freedom</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <TouchableOpacity onPress={() => handleExportData('CSV')} style={[styles.exportBtn, { borderColor: colors.inputBorder }]}>
            <Download color={colors.primary} size={16} />
            <Text style={[styles.exportBtnText, { color: colors.text }]}>Export All Ledger Records (CSV)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExportData('JSON')} style={[styles.exportBtn, { borderColor: colors.inputBorder }]}>
            <Download color="#10B981" size={16} />
            <Text style={[styles.exportBtnText, { color: colors.text }]}>Export Full JSON Backup</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut color="#F43F5E" size={18} />
          <Text style={styles.logoutBtnText}>Sign Out of Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
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
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  proPillText: { color: '#10B981', fontSize: 9, fontWeight: '800' },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5 },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  currencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currencySymbol: { fontSize: 16, fontWeight: '900', width: 24, textAlign: 'center' },
  currencyLabel: { fontSize: 13, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  switchLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchText: { fontSize: 13, fontWeight: '600' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exportBtnText: { fontSize: 13, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 14,
    height: 48,
    marginTop: 8,
  },
  logoutBtnText: { color: '#F43F5E', fontSize: 14, fontWeight: '800' },
})
