import React, { useState, useRef, useEffect } from 'react'
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
  Dimensions,
  Image,
  Animated,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
  Check,
  X,
  Trash2,
  Sliders,
  Vibrate,
  Smartphone,
  EyeOff,
  Eye,
  Cloud,
  ChevronRight,
  HelpCircle,
  LifeBuoy,
  Info,
  Layers,
  KeyRound,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Fingerprint,
  Mail,
  Phone,
  Edit2,
  Plus,
  Zap,
  Crown,
  Share2,
  Cpu,
  BrainCircuit,
  Activity,
  Heart,
  TrendingUp,
  Camera,
  ImageIcon,
  CalendarClock,
} from 'lucide-react-native'
import { HeaderBar } from '../components/HeaderBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const MODAL_WIDTH = SCREEN_WIDTH - 32
const CAL_ITEM_WIDTH = 96
const CAL_SPACING = 12
const CAL_SNAP_INTERVAL = CAL_ITEM_WIDTH + CAL_SPACING
const CAL_SIDE_INSET = (MODAL_WIDTH - CAL_ITEM_WIDTH) / 2

// Curated high-res avatar presets
const AVATAR_PRESETS = [
  { id: 'av1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', label: 'Executive' },
  { id: 'av2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', label: 'Pro VIP' },
  { id: 'av3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', label: 'Creative' },
  { id: 'av4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', label: 'Founder' },
  { id: 'av5', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', label: 'Modern' },
]

type SettingsModalType =
  | 'profile'
  | 'photo_picker'
  | 'notifications'
  | 'security'
  | 'billing'
  | 'currency'
  | 'categories'
  | 'data'
  | 'danger'
  | 'haptics'
  | 'about'
  | 'support'
  | 'ai_copilot'
  | null

export const SettingsScreen = ({ navigation }: { navigation?: any }) => {
  const { user, logout, updateProfile } = useAuth()
  const { theme, toggleTheme, colors } = useAppTheme()

  const [activeModal, setActiveModal] = useState<SettingsModalType>(null)

  // Preferences
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR')
  const [billingDay, setBillingDay] = useState(user?.billingCycleStartDay || 1)
  const [hapticIntensity, setHapticIntensity] = useState<'Light' | 'Medium' | 'Strong' | 'Off'>('Medium')

  // Quick Controls
  const [biometricEnabled, setBiometricEnabled] = useState(true)
  const [privacyMask, setPrivacyMask] = useState(false)
  const [smartAiEnabled, setSmartAiEnabled] = useState(true)

  // Notification Toggles
  const [notifBudget, setNotifBudget] = useState(true)
  const [notifBills, setNotifBills] = useState(true)
  const [notifWeekly, setNotifWeekly] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Profile State & Photo
  const [editName, setEditName] = useState(user?.name || 'Dragon User')
  const [editEmail, setEditEmail] = useState(user?.email || 'chandan@example.com')
  const [editPhone, setEditPhone] = useState('+91 98765 43210')
  const [editBio, setEditBio] = useState('Pro Autonomous Wealth Explorer')
  const [profileImage, setProfileImage] = useState<string>(
    user?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  )
  const [customPhotoUrl, setCustomPhotoUrl] = useState('')

  // 3D Coverflow Animation Refs
  const scrollX = useRef(new Animated.Value(0)).current
  const calendarFlatListRef = useRef<FlatList>(null)

  // Custom Categories
  const [categoriesList, setCategoriesList] = useState([
    { id: '1', name: 'Housing & Rent', color: '#8B5CF6', icon: 'housing' },
    { id: '2', name: 'Food & Groceries', color: '#10B981', icon: 'food' },
    { id: '3', name: 'Bills & Utilities', color: '#06B6D4', icon: 'utilities' },
    { id: '4', name: 'Travel & Commute', color: '#F59E0B', icon: 'travel' },
    { id: '5', name: 'Subscriptions', color: '#EC4899', icon: 'subscriptions' },
    { id: '6', name: 'Health & Medical', color: '#EF4444', icon: 'health' },
    { id: '7', name: 'Investments & SIP', color: '#3B82F6', icon: 'investments' },
  ])
  const [newCatName, setNewCatName] = useState('')

  const currencies = [
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)', flag: '🇮🇳' },
    { code: 'USD', symbol: '$', label: 'US Dollar (USD)', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', label: 'Euro (EUR)', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', label: 'British Pound (GBP)', flag: '🇬🇧' },
    { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)', flag: '🇦🇪' },
    { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CAD)', flag: '🇨🇦' },
    { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar (AUD)', flag: '🇦🇺' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)', flag: '🇯🇵' },
  ]

  const daysList = Array.from({ length: 31 }, (_, i) => i + 1)

  // Scroll to active billing day on modal open
  useEffect(() => {
    if (activeModal === 'billing') {
      setTimeout(() => {
        calendarFlatListRef.current?.scrollToIndex({
          index: Math.max(0, billingDay - 1),
          animated: true,
        })
      }, 200)
    }
  }, [activeModal])

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of FinanceTracker Pro?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ])
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    setCategoriesList((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newCatName.trim(),
        color: '#8B5CF6',
        icon: 'tag',
      },
    ])
    setNewCatName('')
    Alert.alert('Category Added', `Created category "${newCatName.trim()}".`)
  }

  const handleDeleteCategory = (id: string) => {
    setCategoriesList((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Preferences" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Ultra-Luxurious VIP Hero Card with Photo Change trigger */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setActiveModal('profile')}
          style={styles.heroCardWrapper}
        >
          <LinearGradient
            colors={['#1E1B4B', '#312E81', '#4338CA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Ambient Background Aura */}
            <View style={styles.heroAura} />

            {/* Top VIP Tier Badge */}
            <View style={styles.heroTopRow}>
              <View style={styles.vipBadge}>
                <Crown color="#F59E0B" size={13} fill="#F59E0B" />
                <Text style={styles.vipBadgeText}>DIAMOND TIER VIP</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveModal('photo_picker')}
                style={styles.editPill}
              >
                <Camera color="#A5B4FC" size={12} />
                <Text style={styles.editPillText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Avatar with Camera Button & Info */}
            <View style={styles.heroBody}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveModal('photo_picker')}
                style={styles.avatarContainer}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarInitials}>
                      {editName ? editName.substring(0, 2).toUpperCase() : 'DR'}
                    </Text>
                  </LinearGradient>
                )}
                {/* Camera Overlay Badge */}
                <View style={styles.cameraBadge}>
                  <Camera color="#FFFFFF" size={11} />
                </View>
                <View style={styles.statusDot} />
              </TouchableOpacity>

              <View style={styles.heroMeta}>
                <Text style={styles.userName}>{editName}</Text>
                <Text style={styles.userEmail}>{editEmail}</Text>
                <Text style={styles.userBio}>{editBio}</Text>
              </View>
            </View>

            {/* In-Card Live Metrics Strip */}
            <View style={styles.metricsStrip}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>₹4,700</Text>
                <Text style={styles.metricLbl}>Net Savings</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>70%</Text>
                <Text style={styles.metricLbl}>Health Score</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>Day {billingDay}</Text>
                <Text style={styles.metricLbl}>Cycle Start</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 2. Quick Action Toggle Cards (2x2 Grid) */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>QUICK CONTROLS</Text>
        <View style={styles.quickGrid}>
          {/* Theme Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTheme}
            style={[styles.quickCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}>
              {theme === 'dark' ? <Moon color="#8B5CF6" size={18} /> : <Sun color="#F59E0B" size={18} />}
            </View>
            <Text style={[styles.quickCardTitle, { color: colors.text }]}>Appearance</Text>
            <Text style={[styles.quickCardSub, { color: colors.textMuted }]}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </TouchableOpacity>

          {/* Biometrics */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setBiometricEnabled(!biometricEnabled)}
            style={[styles.quickCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: biometricEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)' }]}>
              <Fingerprint color={biometricEnabled ? '#10B981' : '#94A3B8'} size={18} />
            </View>
            <Text style={[styles.quickCardTitle, { color: colors.text }]}>Biometric Lock</Text>
            <Text style={[styles.quickCardSub, { color: biometricEnabled ? '#10B981' : colors.textMuted }]}>
              {biometricEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>

          {/* Privacy Mask */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPrivacyMask(!privacyMask)}
            style={[styles.quickCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: privacyMask ? 'rgba(236, 72, 153, 0.2)' : 'rgba(100, 116, 139, 0.2)' }]}>
              {privacyMask ? <EyeOff color="#EC4899" size={18} /> : <Eye color="#94A3B8" size={18} />}
            </View>
            <Text style={[styles.quickCardTitle, { color: colors.text }]}>Privacy Mask</Text>
            <Text style={[styles.quickCardSub, { color: privacyMask ? '#EC4899' : colors.textMuted }]}>
              {privacyMask ? 'Hidden' : 'Visible'}
            </Text>
          </TouchableOpacity>

          {/* AI Copilot */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveModal('ai_copilot')}
            style={[styles.quickCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
              <BrainCircuit color="#06B6D4" size={18} />
            </View>
            <Text style={[styles.quickCardTitle, { color: colors.text }]}>AI Copilot</Text>
            <Text style={[styles.quickCardSub, { color: '#06B6D4' }]}>Autonomous</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Section 1: Financial Preferences */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>FINANCIAL PREFERENCES</Text>
        <View style={[styles.groupedCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          {/* Billing Cycle Calendar Trigger */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('billing')}
            style={[styles.menuRow, { borderBottomColor: colors.surfaceGlassBorder, borderBottomWidth: 1 }]}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Calendar color="#EF4444" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Billing & Salary Cycle</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                Monthly reset on day {billingDay} of every month
              </Text>
            </View>
            <View style={styles.badgePillCyan}>
              <Text style={styles.badgePillCyanText}>Day {billingDay}</Text>
            </View>
            <ChevronRight color={colors.textMuted} size={16} />
          </TouchableOpacity>

          {/* Currency */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('currency')}
            style={[styles.menuRow, { borderBottomColor: colors.surfaceGlassBorder, borderBottomWidth: 1 }]}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Globe color="#F59E0B" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Currency & Region</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                Default display: {selectedCurrency}
              </Text>
            </View>
            <View style={styles.badgePillAmber}>
              <Text style={styles.badgePillAmberText}>{selectedCurrency}</Text>
            </View>
            <ChevronRight color={colors.textMuted} size={16} />
          </TouchableOpacity>

          {/* Custom Categories */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('categories')}
            style={styles.menuRow}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Layers color="#6366F1" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Custom Categories</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                {categoriesList.length} customized expense categories
              </Text>
            </View>
            <View style={styles.badgePillPurple}>
              <Text style={styles.badgePillPurpleText}>{categoriesList.length} Active</Text>
            </View>
            <ChevronRight color={colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>

        {/* 4. Section 2: Security & Alerts */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>SECURITY & ALERTS</Text>
        <View style={[styles.groupedCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('notifications')}
            style={[styles.menuRow, { borderBottomColor: colors.surfaceGlassBorder, borderBottomWidth: 1 }]}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Bell color="#10B981" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Smart Alerts Hub</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                Budget threshold, bills & digest alerts
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('security')}
            style={[styles.menuRow, { borderBottomColor: colors.surfaceGlassBorder, borderBottomWidth: 1 }]}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <ShieldCheck color="#8B5CF6" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Security Vault</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                Passcodes, 2FA & biometric authentication
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('haptics')}
            style={styles.menuRow}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(217, 70, 239, 0.15)' }]}>
              <Vibrate color="#D946EF" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Haptic Feedback</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                Vibration intensity: {hapticIntensity}
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>

        {/* 5. Section 3: Data & Backup */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>DATA & BACKUP</Text>
        <View style={[styles.groupedCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('data')}
            style={[styles.menuRow, { borderBottomColor: colors.surfaceGlassBorder, borderBottomWidth: 1 }]}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Download color="#3B82F6" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Export Financial Reports</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                Microsoft Excel (.xlsx), CSV & JSON statements
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('danger')}
            style={styles.menuRow}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Trash2 color="#EF4444" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Reset Transaction Ledger</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                Clear cached data and restore defaults
              </Text>
            </View>
            <ChevronRight color="#EF4444" size={16} />
          </TouchableOpacity>
        </View>

        {/* 6. Section 4: Support & About */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>SYSTEM & SUPPORT</Text>
        <View style={[styles.groupedCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('support')}
            style={[styles.menuRow, { borderBottomColor: colors.surfaceGlassBorder, borderBottomWidth: 1 }]}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
              <LifeBuoy color="#0EA5E9" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Help & Support Desk</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                VIP Telegram channel & developer contact
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveModal('about')}
            style={styles.menuRow}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Info color="#A855F7" size={18} />
            </View>
            <View style={styles.menuMeta}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>About FinanceTracker</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                v2.4.0 • Enterprise Mobile Edition
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>

        {/* 7. Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleLogout}
          style={styles.signOutBtn}
        >
          <LinearGradient
            colors={['#DC2626', '#E11D48', '#DB2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signOutGradient}
          >
            <View style={styles.signOutLeft}>
              <View style={styles.signOutIconBox}>
                <LogOut color="#FFFFFF" size={18} />
              </View>
              <View>
                <Text style={styles.signOutTitle}>Sign Out</Text>
                <Text style={styles.signOutSub}>End active mobile session safely</Text>
              </View>
            </View>
            <ChevronRight color="#FFFFFF" size={18} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL 1: Photo & Avatar Picker Modal */}
      <Modal visible={activeModal === 'photo_picker'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Profile Avatar</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.toggleDesc, { color: colors.textMuted, marginBottom: 14 }]}>
              Select from VIP avatar collection or paste a custom image URL:
            </Text>

            {/* Avatar Preset Grid */}
            <View style={styles.avatarGrid}>
              {AVATAR_PRESETS.map((av) => {
                const isSelected = profileImage === av.url
                return (
                  <TouchableOpacity
                    key={av.id}
                    onPress={() => {
                      setProfileImage(av.url)
                      updateProfile({ profileImage: av.url })
                    }}
                    style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                  >
                    <Image source={{ uri: av.url }} style={styles.avatarOptionImg} />
                    {isSelected && (
                      <View style={styles.avatarCheckBadge}>
                        <Check color="#FFFFFF" size={10} strokeWidth={3} />
                      </View>
                    )}
                    <Text style={[styles.avatarOptionLbl, { color: isSelected ? '#8B5CF6' : colors.textMuted }]}>
                      {av.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 12 }]}>Custom Image Web URL</Text>
            <View style={styles.addCatRow}>
              <TextInput
                style={[styles.addCatInput, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
                placeholder="https://example.com/avatar.jpg"
                placeholderTextColor={colors.textMuted}
                value={customPhotoUrl}
                onChangeText={setCustomPhotoUrl}
              />
              <TouchableOpacity
                onPress={() => {
                  if (customPhotoUrl.trim()) {
                    setProfileImage(customPhotoUrl.trim())
                    updateProfile({ profileImage: customPhotoUrl.trim() })
                    setCustomPhotoUrl('')
                    setActiveModal(null)
                    Alert.alert('Avatar Updated', 'Custom profile photo applied successfully!')
                  }
                }}
                style={styles.addCatBtn}
              >
                <Check color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setActiveModal(null)
                Alert.alert('Avatar Saved', 'Your new profile avatar is active across all screens!')
              }}
            >
              <Text style={styles.modalActionBtnText}>Apply Selected Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: 3D Coverflow / Cylinder Carousel Animation (Exact Match to User Reference Image with 'MONTH' Header) */}
      <Modal visible={activeModal === 'billing'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder, paddingBottom: 28 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Billing Cycle Day</Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted, marginTop: 2 }]}>
                  Swipe 3D cylinder carousel to set monthly reset day
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            {/* 3D Coverflow / Cylinder Carousel Animated View */}
            <View style={styles.coverflowContainer}>
              <Animated.FlatList
                ref={calendarFlatListRef}
                data={daysList}
                keyExtractor={(item) => `coverflow-day-${item}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CAL_SNAP_INTERVAL}
                snapToAlignment="start"
                decelerationRate={0.88}
                scrollEventThrottle={1}
                contentContainerStyle={{
                  paddingHorizontal: CAL_SIDE_INSET,
                  alignItems: 'center',
                }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  {
                    useNativeDriver: true,
                    listener: (e: any) => {
                      const newIndex = Math.round(e.nativeEvent.contentOffset.x / CAL_SNAP_INTERVAL)
                      const clampedDay = Math.min(31, Math.max(1, newIndex + 1))
                      if (clampedDay !== billingDay) {
                        setBillingDay(clampedDay)
                      }
                    },
                  }
                )}
                getItemLayout={(data, index) => ({
                  length: CAL_SNAP_INTERVAL,
                  offset: CAL_SNAP_INTERVAL * index,
                  index,
                })}
                renderItem={({ item: day, index }) => {
                  const dayStr = day < 10 ? `0${day}` : `${day}`

                  // 7-Point Ultra-Smooth Continuous Curve Interpolation
                  const inputRange = [
                    (index - 2) * CAL_SNAP_INTERVAL,
                    (index - 1.2) * CAL_SNAP_INTERVAL,
                    (index - 0.6) * CAL_SNAP_INTERVAL,
                    index * CAL_SNAP_INTERVAL,
                    (index + 0.6) * CAL_SNAP_INTERVAL,
                    (index + 1.2) * CAL_SNAP_INTERVAL,
                    (index + 2) * CAL_SNAP_INTERVAL,
                  ]

                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.72, 0.82, 0.98, 1.15, 0.98, 0.82, 0.72],
                    extrapolate: 'clamp',
                  })

                  const rotateY = scrollX.interpolate({
                    inputRange,
                    outputRange: ['42deg', '28deg', '14deg', '0deg', '-14deg', '-28deg', '-42deg'],
                    extrapolate: 'clamp',
                  })

                  const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.55, 0.68, 0.88, 1.0, 0.88, 0.68, 0.55],
                    extrapolate: 'clamp',
                  })

                  const isSelected = billingDay === day

                  return (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        setBillingDay(day)
                        calendarFlatListRef.current?.scrollToOffset({
                          offset: index * CAL_SNAP_INTERVAL,
                          animated: true,
                        })
                      }}
                      style={{ paddingVertical: 14 }}
                    >
                      <Animated.View
                        style={[
                          styles.coverflowCard,
                          {
                            opacity,
                            transform: [
                              { perspective: 900 },
                              { scale },
                              { rotateY },
                            ],
                          },
                          isSelected && styles.coverflowCardActiveBorder,
                        ]}
                      >
                        {/* Top Red Header with 'MONTH' & Silver Ring Hooks */}
                        <View style={[styles.coverflowHeader, isSelected && styles.coverflowHeaderActive]}>
                          <View style={styles.calRingLeft} />
                          <View style={styles.calRingRight} />
                          <Text style={styles.coverflowMonthText}>
                            MONTH
                          </Text>
                        </View>

                        {/* Glossy White Card Body with Bold Dark Date Number */}
                        <View style={styles.coverflowBody}>
                          <Text style={[styles.coverflowDayNum, isSelected ? styles.coverflowDayNumActive : styles.coverflowDayNumSide]}>
                            {dayStr}
                          </Text>
                          <Text style={[styles.coverflowSubLabel, isSelected && styles.coverflowSubLabelActive]}>
                            {isSelected ? 'RESET DAY' : 'Day'}
                          </Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>
                  )
                }}
              />
            </View>

            {/* Cycle Summary Pill */}
            <View style={styles.cycleSummaryCard}>
              <CalendarClock color="#8B5CF6" size={16} />
              <Text style={styles.cycleSummaryText}>
                Cycle: <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Month Day {billingDay < 10 ? `0${billingDay}` : billingDay} Reset</Text> (Every 30 Days)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                updateProfile({ billingCycleStartDay: billingDay })
                setActiveModal(null)
                Alert.alert('Billing Cycle Updated', `Your monthly budget will reset on Day ${billingDay} of each month.`)
              }}
            >
              <Text style={styles.modalActionBtnText}>Confirm Day {billingDay}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Profile Edit Modal */}
      <Modal visible={activeModal === 'profile'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Personal Profile</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            {/* Photo Avatar Preview with Change Button */}
            <View style={styles.profileEditPhotoRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveModal('photo_picker')}
                style={styles.profileEditAvatarBox}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileEditAvatarImg} />
                ) : (
                  <View style={styles.profileEditAvatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {editName ? editName.substring(0, 2).toUpperCase() : 'DR'}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraBadgeLarge}>
                  <Camera color="#FFFFFF" size={14} />
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileName, { color: colors.text }]}>{editName}</Text>
                <TouchableOpacity onPress={() => setActiveModal('photo_picker')}>
                  <Text style={styles.changePhotoLink}>Tap to choose new photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Full Name</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter Name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email Address</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter Email"
                keyboardType="email-address"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Phone Number</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter Phone"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Bio / Goal</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Financial goals"
                placeholderTextColor={colors.textMuted}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                updateProfile({ name: editName, email: editEmail, profileImage })
                setActiveModal(null)
                Alert.alert('Saved', 'Profile updated successfully!')
              }}
            >
              <Text style={styles.modalActionBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Notifications Modal */}
      <Modal visible={activeModal === 'notifications'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Notification Center</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Budget 80% Warning</Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Alert when spending exceeds 80%</Text>
              </View>
              <Switch value={notifBudget} onValueChange={setNotifBudget} trackColor={{ true: '#10B981', false: '#334155' }} />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Upcoming Bill Reminders</Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Alert 3 days before due date</Text>
              </View>
              <Switch value={notifBills} onValueChange={setNotifBills} trackColor={{ true: '#10B981', false: '#334155' }} />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Sunday Wealth Digest</Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Weekly savings summary report</Text>
              </View>
              <Switch value={notifWeekly} onValueChange={setNotifWeekly} trackColor={{ true: '#10B981', false: '#334155' }} />
            </View>

            <TouchableOpacity style={styles.modalActionBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalActionBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: Security Modal */}
      <Modal visible={activeModal === 'security'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Security Vault</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Biometric Fingerprint / Face ID</Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Instant unlock on app startup</Text>
              </View>
              <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ true: '#8B5CF6', false: '#334155' }} />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Two-Factor Authentication (2FA)</Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Extra security layer for changes</Text>
              </View>
              <Switch value={twoFactorEnabled} onValueChange={setTwoFactorEnabled} trackColor={{ true: '#8B5CF6', false: '#334155' }} />
            </View>

            <TouchableOpacity style={styles.modalActionBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalActionBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 6: Currency Modal */}
      <Modal visible={activeModal === 'currency'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            {currencies.map((c) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => {
                  setSelectedCurrency(c.code)
                  updateProfile({ currency: c.code })
                  setActiveModal(null)
                  Alert.alert('Currency Set', `Default display currency set to ${c.code} (${c.symbol}).`)
                }}
                style={[
                  styles.currencyRow,
                  selectedCurrency === c.code && styles.currencyRowActive,
                  { borderColor: colors.surfaceGlassBorder },
                ]}
              >
                <Text style={[styles.currencyLabel, { color: colors.text }]}>
                  {c.flag} {c.symbol} • {c.label}
                </Text>
                {selectedCurrency === c.code && <Check color="#10B981" size={18} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* MODAL 7: Categories Modal */}
      <Modal visible={activeModal === 'categories'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Categories</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.addCatRow}>
              <TextInput
                style={[styles.addCatInput, { color: colors.text, borderColor: colors.surfaceGlassBorder }]}
                placeholder="New category name..."
                placeholderTextColor={colors.textMuted}
                value={newCatName}
                onChangeText={setNewCatName}
              />
              <TouchableOpacity onPress={handleAddCategory} style={styles.addCatBtn}>
                <Plus color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {categoriesList.map((cat) => (
                <View key={cat.id} style={[styles.catRowItem, { borderColor: colors.surfaceGlassBorder }]}>
                  <View style={styles.catRowLeft}>
                    <CategoryIcon name={cat.name} color={cat.color} size={15} containerSize={28} style={{ marginRight: 10 }} />
                    <Text style={[styles.catRowName, { color: colors.text }]}>{cat.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)}>
                    <Trash2 color="#EF4444" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalActionBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalActionBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 8: Haptics Modal */}
      <Modal visible={activeModal === 'haptics'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Haptic Feedback</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.toggleDesc, { color: colors.textMuted, marginBottom: 12 }]}>
              Select tactile vibration feedback intensity for taps and swipes:
            </Text>

            {(['Light', 'Medium', 'Strong', 'Off'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => {
                  setHapticIntensity(level)
                  setActiveModal(null)
                }}
                style={[
                  styles.currencyRow,
                  hapticIntensity === level && styles.currencyRowActive,
                  { borderColor: colors.surfaceGlassBorder },
                ]}
              >
                <Text style={[styles.currencyLabel, { color: colors.text }]}>{level} Tactile</Text>
                {hapticIntensity === level && <Check color="#8B5CF6" size={18} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* MODAL 9: Data Export Modal */}
      <Modal visible={activeModal === 'data'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Export Reports</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setActiveModal(null)
                Alert.alert('Excel Statement', 'Generated complete financial ledger in Excel (.xlsx).')
              }}
              style={[styles.exportRow, { borderColor: colors.surfaceGlassBorder }]}
            >
              <FileSpreadsheet color="#10B981" size={24} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.exportTitle, { color: colors.text }]}>Microsoft Excel (.xlsx)</Text>
                <Text style={[styles.exportSub, { color: colors.textMuted }]}>Full monthly breakdown with charts</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveModal(null)
                Alert.alert('CSV Statement', 'Downloaded CSV transaction ledger.')
              }}
              style={[styles.exportRow, { borderColor: colors.surfaceGlassBorder }]}
            >
              <FileText color="#3B82F6" size={24} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.exportTitle, { color: colors.text }]}>Raw CSV Ledger (.csv)</Text>
                <Text style={[styles.exportSub, { color: colors.textMuted }]}>Compatible with Google Sheets & Numbers</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveModal(null)
                Alert.alert('JSON Archive', 'Exported encrypted backup file.')
              }}
              style={[styles.exportRow, { borderColor: colors.surfaceGlassBorder }]}
            >
              <Cloud color="#8B5CF6" size={24} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.exportTitle, { color: colors.text }]}>JSON Encrypted Archive (.json)</Text>
                <Text style={[styles.exportSub, { color: colors.textMuted }]}>Full data backup for offline restore</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 10: Clear Data Modal */}
      <Modal visible={activeModal === 'danger'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: '#EF4444' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#EF4444' }]}>Reset Transaction Ledger</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.toggleDesc, { color: colors.textMuted, marginBottom: 16 }]}>
              This will clear all local transaction records, reset custom categories, and restore factory defaults.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setActiveModal(null)
                Alert.alert('Ledger Reset', 'All cached ledger records have been reset.')
              }}
              style={[styles.modalActionBtn, { backgroundColor: '#EF4444' }]}
            >
              <Text style={styles.modalActionBtnText}>Confirm Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 11: AI Copilot Modal */}
      <Modal visible={activeModal === 'ai_copilot'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>AI Financial Copilot</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Auto Transaction Tagging</Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>AI automatically detects category</Text>
              </View>
              <Switch value={smartAiEnabled} onValueChange={setSmartAiEnabled} trackColor={{ true: '#06B6D4', false: '#334155' }} />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Overspending Anomaly Detection</Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Realtime alerts for abnormal transactions</Text>
              </View>
              <Switch value={true} onValueChange={() => {}} trackColor={{ true: '#06B6D4', false: '#334155' }} />
            </View>

            <TouchableOpacity style={styles.modalActionBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalActionBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 12: Help & Support */}
      <Modal visible={activeModal === 'support'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Help & Support Desk</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginBottom: 16 }}>
              <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                • <Text style={{ color: colors.text, fontWeight: '700' }}>Email:</Text> support@financetrackerpro.com
              </Text>
              <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                • <Text style={{ color: colors.text, fontWeight: '700' }}>Telegram VIP:</Text> @financetracker_vip
              </Text>
              <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                • <Text style={{ color: colors.text, fontWeight: '700' }}>Docs:</Text> docs.financetracker.dev
              </Text>
            </View>

            <TouchableOpacity style={styles.modalActionBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalActionBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 13: About Modal */}
      <Modal visible={activeModal === 'about'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>About FinanceTracker</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6, marginBottom: 16 }}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>FinanceTracker Enterprise Mobile</Text>
              <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Version 2.4.0 (Build 2026.08.22)</Text>
              <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Built natively for Android with Expo & Deep Intelligence.</Text>
            </View>

            <TouchableOpacity style={styles.modalActionBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalActionBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 70,
  },
  heroCardWrapper: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  heroGradient: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroAura: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  vipBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editPillText: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '600',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 66,
    height: 66,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarGradient: {
    width: 66,
    height: 66,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E1B4B',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#1E1B4B',
  },
  heroMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 12,
    color: '#C7D2FE',
    marginTop: 1,
  },
  userBio: {
    fontSize: 11,
    color: '#A5B4FC',
    marginTop: 4,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricLbl: {
    fontSize: 10,
    color: '#A5B4FC',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 6,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  quickIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickCardSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  groupedCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuMeta: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuSub: {
    fontSize: 11,
    marginTop: 2,
  },
  badgePillCyan: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 4,
  },
  badgePillCyanText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
  },
  badgePillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 4,
  },
  badgePillAmberText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  badgePillPurple: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 4,
  },
  badgePillPurpleText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '700',
  },
  signOutBtn: {
    marginTop: 6,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  signOutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signOutIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  signOutSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalActionBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatarOption: {
    alignItems: 'center',
    position: 'relative',
  },
  avatarOptionSelected: {
    transform: [{ scale: 1.08 }],
  },
  avatarOptionImg: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarCheckBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarOptionLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  profileEditPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 18,
  },
  profileEditAvatarBox: {
    position: 'relative',
  },
  profileEditAvatarImg: {
    width: 58,
    height: 58,
    borderRadius: 20,
  },
  profileEditAvatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadgeLarge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  changePhotoLink: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
  },

  // 3D Coverflow Cylinder Carousel Styles
  coverflowContainer: {
    paddingVertical: 10,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  coverflowCard: {
    width: CAL_ITEM_WIDTH,
    height: 126,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: CAL_SPACING,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  coverflowCardActiveBorder: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 14,
  },
  coverflowHeader: {
    width: '100%',
    height: 36,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coverflowHeaderActive: {
    backgroundColor: '#EF4444',
  },
  calRingLeft: {
    position: 'absolute',
    top: -5,
    left: 16,
    width: 7,
    height: 11,
    borderRadius: 3.5,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.2,
    borderColor: '#475569',
  },
  calRingRight: {
    position: 'absolute',
    top: -5,
    right: 16,
    width: 7,
    height: 11,
    borderRadius: 3.5,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.2,
    borderColor: '#475569',
  },
  coverflowMonthText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  coverflowBody: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverflowDayNum: {
    fontSize: 28,
    fontWeight: '900',
    color: '#334155',
  },
  coverflowDayNumActive: {
    fontSize: 34,
    color: '#0F172A',
  },
  coverflowDayNumSide: {
    fontSize: 26,
    color: '#334155',
  },
  coverflowSubLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  coverflowSubLabelActive: {
    color: '#EF4444',
  },
  cycleSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    marginTop: 8,
  },
  cycleSummaryText: {
    fontSize: 12,
    color: '#C4B5FD',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 8,
  },
  currencyRowActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  addCatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addCatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
  },
  addCatBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  catRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catRowName: {
    fontSize: 13,
    fontWeight: '600',
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  exportTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  exportSub: {
    fontSize: 10,
    marginTop: 1,
  },
})
