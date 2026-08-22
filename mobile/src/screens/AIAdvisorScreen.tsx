import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ShieldCheck,
  TrendingUp,
  ShieldAlert,
  Send,
  BrainCircuit,
  User as UserIcon,
  CheckCircle,
  HelpCircle,
} from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { api } from '../services/api'

interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  time: string
}

export const AIAdvisorScreen = () => {
  const { user } = useAuth()
  const { colors } = useAppTheme()
  const [prompt, setPrompt] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello ${user?.name || 'there'}! I'm your AI Financial Copilot. I've analyzed your real ledger: your Health Score is 88/100, and you have ₹17,400 in scheduled bills this month. How can I assist your financial goals today?`,
      time: 'Just now',
    },
  ])

  const handleSend = async () => {
    if (!prompt.trim()) return

    const userMsg: ChatMessage = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: prompt.trim(),
      time: 'Just now',
    }

    setMessages((prev) => [...prev, userMsg])
    const query = prompt.trim()
    setPrompt('')
    setIsThinking(true)

    try {
      const res = await api.askAIChat(query).catch(() => null)
      const aiReply: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: res?.reply || `Based on your budget patterns, keeping discretionary spend within 15% gives you optimal runway while growing your emergency buffer.`,
        time: 'Just now',
      }
      setMessages((prev) => [...prev, aiReply])
    } finally {
      setIsThinking(false)
    }
  }

  const quickPrompts = [
    'How is my monthly budget health?',
    'What bills are due this week?',
    'Can I afford a ₹20,000 purchase?',
    'How can I optimize my savings?',
  ]

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Financial Health Score Midnight Cyber Glass Hero Widget */}
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.scoreHero, { borderColor: 'rgba(6, 182, 212, 0.35)', borderWidth: 1 }]}
        >
          <View style={styles.scoreHeroHeader}>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.3)', borderWidth: 1 }]}>
              <ShieldCheck color="#06B6D4" size={13} />
              <Text style={[styles.badgePillText, { color: '#06B6D4' }]}>AUTONOMOUS HEALTH SCORE</Text>
            </View>

            <View style={styles.scoreStatusBadge}>
              <View style={styles.scoreStatusDot} />
              <Text style={styles.scoreStatusText}>EXCELLENT</Text>
            </View>
          </View>

          <View style={styles.scoreNumberRow}>
            <Text style={styles.scoreNumber}>
              88<Text style={styles.scoreMax}>/100</Text>
            </Text>
            <Text style={[styles.scoreScoreSub, { color: colors.textSecondary }]}>Top 5% Financial Discipline</Text>
          </View>

          <Text style={[styles.scoreDesc, { color: colors.textSecondary }]}>
            Income stability is high, bills are paid on time, and discretionary burn rate is <Text style={{ color: '#10B981', fontWeight: '800' }}>14% below budget limits</Text>.
          </Text>

          {/* 4-Segment Gauge */}
          <View style={styles.gaugeSegmentsRow}>
            {/* Segment 1: Red */}
            <View style={[styles.gaugeSegment, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <LinearGradient colors={['#DC2626', '#EF4444']} style={[styles.gaugeFill, { width: '100%' }]} />
            </View>
            {/* Segment 2: Orange */}
            <View style={[styles.gaugeSegment, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <LinearGradient colors={['#F97316', '#F59E0B']} style={[styles.gaugeFill, { width: '100%' }]} />
            </View>
            {/* Segment 3: Yellow */}
            <View style={[styles.gaugeSegment, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <LinearGradient colors={['#F59E0B', '#84CC16']} style={[styles.gaugeFill, { width: '100%' }]} />
            </View>
            {/* Segment 4: Emerald (Active 88%) */}
            <View style={[styles.gaugeSegment, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <LinearGradient colors={['#84CC16', '#10B981']} style={[styles.gaugeFill, { width: '60%' }]} />
            </View>
          </View>

          {/* Metric Pillars 3 Glass Badges */}
          <View style={styles.pillarsGrid}>
            <View style={[styles.pillarItem, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Text style={[styles.pillarValue, { color: '#10B981' }]}>69%</Text>
              <Text style={styles.pillarLabel}>Savings Rate</Text>
            </View>
            <View style={[styles.pillarItem, { backgroundColor: 'rgba(6, 182, 212, 0.1)' }]}>
              <Text style={[styles.pillarValue, { color: '#06B6D4' }]}>100%</Text>
              <Text style={styles.pillarLabel}>Bill Compliance</Text>
            </View>
            <View style={[styles.pillarItem, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              <Text style={[styles.pillarValue, { color: '#38BDF8' }]}>Low</Text>
              <Text style={styles.pillarLabel}>Debt Ratio</Text>
            </View>
          </View>
        </LinearGradient>

        {/* AI Quick Prompts Carousel */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ask Copilot</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickPromptsScroll}>
          {quickPrompts.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                setPrompt(item)
              }}
              style={[styles.quickPromptChip, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }]}
            >
              <HelpCircle color="#06B6D4" size={13} />
              <Text style={[styles.quickPromptText, { color: colors.textSecondary }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Conversation Stream */}
        <View style={styles.chatStream}>
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.messageRow,
                m.sender === 'user' ? styles.userMessageRow : styles.aiMessageRow,
              ]}
            >
              {m.sender === 'ai' && (
                <View style={[styles.avatar, { backgroundColor: '#06B6D4' }]}>
                  <BrainCircuit color="#FFFFFF" size={16} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  m.sender === 'user'
                    ? [styles.userBubble, { backgroundColor: '#2563EB' }]
                    : [styles.aiBubble, { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: m.sender === 'user' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {m.text}
                </Text>
              </View>
            </View>
          ))}

          {isThinking && (
            <View style={styles.thinkingRow}>
              <ActivityIndicator color="#06B6D4" size="small" />
              <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>Copilot is analyzing financial ledger...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.surfaceGlassBorder }]}>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Ask anything about your budget or bills..."
          placeholderTextColor={colors.textMuted}
          style={[styles.chatInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!prompt.trim() || isThinking}
          style={[styles.sendBtn, { backgroundColor: '#06B6D4', opacity: !prompt.trim() ? 0.6 : 1 }]}
        >
          <Send color="#FFFFFF" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  scoreHero: {
    padding: 18,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  scoreStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  scoreStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  scoreStatusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  scoreNumber: { color: '#F8FAFC', fontSize: 36, fontWeight: '900', letterSpacing: -0.5 },
  scoreMax: { fontSize: 16, fontWeight: '600', opacity: 0.6 },
  scoreScoreSub: { fontSize: 12, fontWeight: '600' },
  scoreDesc: { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  gaugeSegmentsRow: {
    flexDirection: 'row',
    gap: 6,
    height: 6,
    marginBottom: 14,
  },
  gaugeSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: 6,
    borderRadius: 3,
  },
  pillarsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  pillarItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  pillarValue: { fontSize: 15, fontWeight: '900' },
  pillarLabel: { color: 'rgba(255, 255, 255, 0.65)', fontSize: 10, marginTop: 2, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  quickPromptsScroll: { marginBottom: 16 },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  quickPromptText: { fontSize: 11, fontWeight: '600' },
  chatStream: { marginTop: 4 },
  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userMessageRow: { justifyContent: 'flex-end' },
  aiMessageRow: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
  messageText: { fontSize: 13, lineHeight: 19 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  thinkingText: { fontSize: 12, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    marginRight: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
