import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Mail, Lock, Eye, EyeOff, TrendingUp, CheckCircle, X } from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

export const LoginScreen = ({ navigation }: { navigation: any }) => {
  const { login, loginWithGoogle, loading: authLoading } = useAuth()
  const { colors } = useAppTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [customGoogleEmail, setCustomGoogleEmail] = useState('')

  const isFormValid = email.trim().length > 0 && password.length >= 6
  const passwordInputRef = useRef<TextInput>(null)

  const googleAccounts = [
    { email: 'vishwakarmachandan336@gmail.com', name: 'Chandan Vishwakarma' },
    { email: 'chandanvishwakarma.tech@gmail.com', name: 'Chandan Vishwakarma' },
    { email: 'chandan.mca.2019@gmail.com', name: 'Chandan Vishwakarma' },
  ]

  const handleLogin = async () => {
    if (isSubmitting || isGoogleSubmitting) return
    if (!email || !password) {
      setError('Please fill in your email and password.')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectGoogleAccount = async (accountEmail: string) => {
    setShowGoogleModal(false)
    setError('')
    setIsGoogleSubmitting(true)
    try {
      await loginWithGoogle(accountEmail)
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.')
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header & Logo */}
        <View style={styles.header}>
          <LinearGradient
            colors={colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <TrendingUp color="#FFFFFF" size={32} strokeWidth={2.5} />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to manage automated bills, cash flow & budget
          </Text>
        </View>

        {/* Error Notification */}
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: colors.accentRose }]}>
            <Text style={[styles.errorText, { color: colors.accentRose }]}>{error}</Text>
          </View>
        ) : null}

        {/* Login Card */}
        <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Mail color={colors.textMuted} size={18} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>PASSWORD</Text>
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setError('Password reset instructions sent to your email if registered.')}
              >
                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Lock color={colors.textMuted} size={18} />
              <TextInput
                ref={passwordInputRef}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                style={[styles.input, { color: colors.text }]}
              />
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff color={colors.textMuted} size={18} /> : <Eye color={colors.textMuted} size={18} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Primary Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={!isFormValid || isSubmitting || isGoogleSubmitting}
            activeOpacity={0.8}
            style={[styles.submitBtn, !isFormValid && { opacity: 0.45 }]}
          >
            <LinearGradient
              colors={isFormValid ? colors.primaryGradient : ['#374151', '#1F2937']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.submitBtnText, !isFormValid && { color: colors.textMuted }]}>
                  Sign In →
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Clean Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.surfaceGlassBorder }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.surfaceGlassBorder }]} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            onPress={() => setShowGoogleModal(true)}
            disabled={isSubmitting || isGoogleSubmitting}
            activeOpacity={0.75}
            style={[styles.googleBtn, { borderColor: colors.surfaceGlassBorder, backgroundColor: colors.inputBg }]}
          >
            {isGoogleSubmitting ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={[styles.googleBtnText, { color: colors.text }]}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link to Register */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[styles.registerLink, { color: colors.primary }]}>Sign up free</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Google Account Selector Modal */}
      <Modal visible={showGoogleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.surfaceGlassBorder }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.googleHeaderRow}>
                <View style={styles.googleModalIconCircle}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Sign in with Google</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGoogleModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X color={colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Choose an account to continue to FinanceTracker Pro
            </Text>

            {/* Account List */}
            <View style={styles.accountList}>
              {googleAccounts.map((acc, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => handleSelectGoogleAccount(acc.email)}
                  style={[styles.accountItem, { borderColor: colors.surfaceGlassBorder, backgroundColor: colors.inputBg }]}
                >
                  <View style={[styles.accountAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.accountAvatarText}>{acc.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountName, { color: colors.text }]}>{acc.name}</Text>
                    <Text style={[styles.accountEmail, { color: colors.textMuted }]}>{acc.email}</Text>
                  </View>
                  <CheckCircle color={colors.primary} size={18} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Google Email Input */}
            <View style={styles.customEmailRow}>
              <TextInput
                value={customGoogleEmail}
                onChangeText={setCustomGoogleEmail}
                placeholder="Or enter other @gmail.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.customEmailInput, { color: colors.text, borderColor: colors.surfaceGlassBorder, backgroundColor: colors.inputBg }]}
              />
              {customGoogleEmail.includes('@') ? (
                <TouchableOpacity
                  onPress={() => handleSelectGoogleAccount(customGoogleEmail.trim())}
                  style={[styles.customEmailBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.customEmailBtnText}>Sign In</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  googleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleG: {
    color: '#4285F4',
    fontSize: 13,
    fontWeight: '900',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  googleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleModalIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 16,
  },
  accountList: {
    gap: 10,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  customEmailRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  customEmailInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  customEmailBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customEmailBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
})
