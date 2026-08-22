import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ShieldCheck, TrendingUp, Sparkles, Crown } from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'

interface SplashScreenProps {
  onFinish?: () => void
}

const { width, height } = Dimensions.get('window')

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { colors } = useAppTheme()
  const [statusText, setStatusText] = useState('Initializing secure offline ledger...')

  // Animation values
  const pulseAnim = useRef(new Animated.Value(0.85)).current
  const glowAnim = useRef(new Animated.Value(0.3)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleOutAnim = useRef(new Animated.Value(1)).current
  const textFadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // 1. Entrance Spring / Scale
    Animated.spring(pulseAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start()

    // 2. Continuous Ambient Aura Oscillation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.85,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // 3. Status text sequence
    Animated.timing(textFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()

    const t1 = setTimeout(() => {
      setStatusText('Syncing real-time cashflow analytics...')
    }, 650)

    const t2 = setTimeout(() => {
      setStatusText('Connecting AI Financial Copilot...')
    }, 1250)

    const t3 = setTimeout(() => {
      setStatusText('Welcome to FinanceTracker Pro!')
    }, 1800)

    // 4. Progress bar fill
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(() => {
      // 5. Cinematic fade-out & scale zoom
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleOutAnim, {
          toValue: 1.06,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish?.()
      })
    })

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.7],
  })

  return (
    <Animated.View
      onTouchStart={() => onFinish?.()}
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleOutAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#070A13', '#0F172A', '#060911']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient Aurora Orbs */}
      <Animated.View
        style={[
          styles.auroraOrbCyan,
          {
            opacity: glowAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.auroraOrbEmerald,
          {
            opacity: glowAnim,
          },
        ]}
      />

      {/* Main Logo Emblem */}
      <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['#2563EB', '#06B6D4', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoGradientBox}
        >
          <TrendingUp color="#FFFFFF" size={46} strokeWidth={2.5} />
          
          <View style={styles.badgeShield}>
            <ShieldCheck color="#10B981" size={18} strokeWidth={2.5} />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* App Branding & Badges */}
      <Animated.View style={[styles.brandContainer, { opacity: textFadeAnim }]}>
        <Text style={styles.brandTitle}>
          Finance<Text style={{ color: '#06B6D4' }}>Tracker</Text> <Text style={{ color: '#10B981' }}>Pro</Text>
        </Text>

        <View style={styles.vipPillRow}>
          <Crown color="#F59E0B" size={12} fill="#F59E0B" style={{ marginRight: 4 }} />
          <Text style={styles.vipPillText}>AUTONOMOUS AI FINTECH</Text>
          <Sparkles color="#06B6D4" size={11} style={{ marginLeft: 4 }} />
        </View>

        <Text style={styles.tagline}>
          Live Wealth Tracking • Smart Budgets • Instant Offline Sync
        </Text>
      </Animated.View>

      {/* Dynamic Shimmer Progress Gauge */}
      <View style={styles.bottomLoaderArea}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: progressWidth }]}>
            <LinearGradient
              colors={['#DC2626', '#F59E0B', '#06B6D4', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.versionText}>v2.4.0 • Enterprise Cloud & Offline Edition</Text>
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
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070A13',
  },
  auroraOrbCyan: {
    position: 'absolute',
    top: height * 0.22,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(6, 182, 212, 0.22)',
  },
  auroraOrbEmerald: {
    position: 'absolute',
    bottom: height * 0.28,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  logoWrapper: {
    marginBottom: 24,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
  logoGradientBox: {
    width: 104,
    height: 104,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  badgeShield: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#070A13',
    borderRadius: 14,
    padding: 4,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.8,
  },
  vipPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  vipPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
  },
  bottomLoaderArea: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: '100%',
  },
  track: {
    height: 5,
    width: width * 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#06B6D4',
    marginTop: 12,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 6,
  },
})
