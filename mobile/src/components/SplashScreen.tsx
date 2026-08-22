import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ShieldCheck, TrendingUp, Sparkles } from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'

interface SplashScreenProps {
  onFinish?: () => void
}

const { width } = Dimensions.get('window')

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { colors } = useAppTheme()
  const pulseAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0.4)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // 1. Pulsing logo animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // 2. Glowing halo oscillation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // 3. Shimmer progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start(() => {
      // 4. Smooth fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onFinish?.()
      })
    })

    const fallbackTimer = setTimeout(() => {
      onFinish?.()
    }, 2200)

    return () => clearTimeout(fallbackTimer)
  }, [])

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.65],
  })

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}>
      {/* Background Ambient Aura */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            opacity: glowAnim,
            backgroundColor: colors.primary,
          },
        ]}
      />

      {/* Main Logo Container */}
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoGradient}
        >
          <TrendingUp color="#FFFFFF" size={42} strokeWidth={2.5} />
          <View style={styles.shieldBadge}>
            <ShieldCheck color="#10B981" size={16} strokeWidth={2.5} />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* App Branding Titles */}
      <View style={styles.titleContainer}>
        <Text style={[styles.brandTitle, { color: colors.text }]}>
          Finance<Text style={{ color: colors.primary }}>Tracker</Text>
        </Text>
        <View style={styles.badgeRow}>
          <Sparkles color={colors.secondary} size={12} />
          <Text style={[styles.badgeText, { color: colors.secondary }]}>PRO AI INTELLIGENCE</Text>
        </View>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Automated Wealth, Cashflow & Bill Reminders
        </Text>
      </View>

      {/* Shimmer Progress Track */}
      <View style={styles.loaderWrapper}>
        <View style={[styles.track, { backgroundColor: colors.inputBorder }]}>
          <Animated.View style={[styles.fill, { width: progressWidth }]}>
            <LinearGradient
              colors={['#8B5CF6', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={[styles.loaderText, { color: colors.textMuted }]}>Hydrating session & financial metrics...</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glowCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  logoContainer: {
    marginBottom: 28,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shieldBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
  },
  loaderWrapper: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 60,
  },
  track: {
    height: 4,
    width: width * 0.65,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  loaderText: {
    fontSize: 11,
    marginTop: 12,
    fontWeight: '500',
  },
})
