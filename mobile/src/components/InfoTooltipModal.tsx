import React from 'react'
import { View, Text, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native'
import { Info, X, Check } from 'lucide-react-native'
import { useAppTheme } from '../context/ThemeContext'

export interface TooltipData {
  title: string
  description: string
  details?: string
  accentColor?: string
}

interface Props {
  visible: boolean
  tooltip: TooltipData | null
  onClose: () => void
}

export const InfoTooltipModal: React.FC<Props> = ({ visible, tooltip, onClose }) => {
  const { colors } = useAppTheme()

  if (!tooltip) return null

  const accent = tooltip.accentColor || colors.primary

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceGlassBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: `${accent}20` }]}>
              <Info color={accent} size={18} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{tooltip.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textSecondary} size={18} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {tooltip.description}
          </Text>

          {/* Optional Details or Formula Box */}
          {tooltip.details ? (
            <View style={[styles.detailsBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Text style={[styles.detailsText, { color: colors.text }]}>{tooltip.details}</Text>
            </View>
          ) : null}

          {/* Got it Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={[styles.gotItBtn, { backgroundColor: accent }]}
          >
            <Check color="#FFFFFF" size={16} strokeWidth={2.5} />
            <Text style={styles.gotItText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  detailsBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailsText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  gotItBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 12,
  },
  gotItText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
})
