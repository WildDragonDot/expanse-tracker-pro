import React, { useState } from 'react'
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
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Mail, Lock, Eye, EyeOff, Zap, TrendingUp, ShieldCheck } from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

export const LoginScreen = ({ navigation }: { navigation: any }) => {
  const { login, loginWithGoogle, loading } = useAuth()
  const { colors } = useAppTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in your email and password.')
      return
    }
    setError('')
    try {
      await login(email.trim(), password)
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.')
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    try {
      await loginWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.')
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

        {/* Frosted Glass Login Card */}
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
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>PASSWORD</Text>
              <TouchableOpacity onPress={() => setError('Password reset link sent if registered.')}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Lock color={colors.textMuted} size={18} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                style={[styles.input, { color: colors.text }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff color={colors.textMuted} size={18} /> : <Eye color={colors.textMuted} size={18} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Primary Button */}
          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85} style={styles.submitBtn}>
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Sign In →</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Google Sign In Official Button */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.8}
            style={[styles.googleBtn, { borderColor: colors.inputBorder }]}
          >
            <View style={styles.googleIconCircle}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={[styles.googleBtnText, { color: colors.text }]}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link to Register */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>Sign up free</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: 12,
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
})
