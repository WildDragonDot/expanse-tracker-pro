import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Svg, { Path, G } from 'react-native-svg'

interface DonutSlice {
  name: string
  value: number
  color: string
}

interface SvgDonutChartProps {
  data: DonutSlice[]
  size?: number
  innerRadiusRatio?: number
  onSlicePress?: (slice: DonutSlice) => void
  centerText?: string
  centerSubText?: string
  textColor?: string
  currencySymbol?: string
}

export const SvgDonutChart = ({
  data,
  size = 190,
  innerRadiusRatio = 0.55,
  onSlicePress,
  centerText,
  centerSubText,
  textColor = '#FFFFFF',
  currencySymbol = '₹',
}: SvgDonutChartProps) => {
  const [selectedSlice, setSelectedSlice] = useState<DonutSlice | null>(null)

  const center = size / 2
  const outerRadius = size / 2 - 8
  const innerRadius = outerRadius * innerRadiusRatio

  const total = data.reduce((sum, item) => sum + item.value, 0) || 1

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  const describeArc = (
    centerX: number,
    centerY: number,
    innerR: number,
    outerR: number,
    startAngle: number,
    endAngle: number
  ) => {
    const clampedEnd = endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle
    const startOuter = polarToCartesian(centerX, centerY, outerR, clampedEnd)
    const endOuter = polarToCartesian(centerX, centerY, outerR, startAngle)
    const startInner = polarToCartesian(centerX, centerY, innerR, startAngle)
    const endInner = polarToCartesian(centerX, centerY, innerR, clampedEnd)

    const arcSweep = clampedEnd - startAngle <= 180 ? '0' : '1'

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerR} ${outerR} 0 ${arcSweep} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR} ${innerR} 0 ${arcSweep} 1 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ')
  }

  const handleSliceClick = (item: DonutSlice) => {
    if (selectedSlice?.name === item.name) {
      setSelectedSlice(null)
    } else {
      setSelectedSlice(item)
    }
    if (onSlicePress) {
      onSlicePress(item)
    }
  }

  let currentAngle = 0

  const activePercent = selectedSlice ? Math.round((selectedSlice.value / total) * 100) : null

  return (
    <View style={styles.container}>
      {/* Absolute Floating Tooltip (Does not increase card height) */}
      {selectedSlice && (
        <View style={[styles.tooltipAbsolute, { borderColor: selectedSlice.color }]}>
          <View style={[styles.tooltipDot, { backgroundColor: selectedSlice.color }]} />
          <Text style={styles.tooltipTitle}>{selectedSlice.name}:</Text>
          <Text style={[styles.tooltipVal, { color: selectedSlice.color }]}>
            {currencySymbol}{(selectedSlice.value ?? 0).toLocaleString()} ({activePercent}%)
          </Text>
        </View>
      )}

      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G>
            {data.map((item, idx) => {
              const sliceAngle = (item.value / total) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + sliceAngle
              currentAngle = endAngle

              const isSelected = selectedSlice?.name === item.name
              const rOut = isSelected ? outerRadius + 4 : outerRadius
              const pathData = describeArc(center, center, innerRadius, rOut, startAngle + 1, endAngle - 1)

              return (
                <Path
                  key={`slice-${item.name}-${idx}`}
                  d={pathData}
                  fill={item.color}
                  opacity={selectedSlice && !isSelected ? 0.45 : 1}
                  onPress={() => handleSliceClick(item)}
                />
              )
            })}
          </G>
        </Svg>

        {/* Center Text inside Donut Hole */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedSlice(null)}
          style={[styles.centerContainer, { width: innerRadius * 2, height: innerRadius * 2 }]}
        >
          {selectedSlice ? (
            <>
              <Text style={[styles.centerText, { color: selectedSlice.color }]}>
                {currencySymbol}{(selectedSlice.value ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.centerSubText}>{activePercent}% Share</Text>
            </>
          ) : (
            <>
              {centerText && <Text style={[styles.centerText, { color: textColor }]}>{centerText}</Text>}
              {centerSubText && <Text style={styles.centerSubText}>{centerSubText}</Text>}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  centerText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerSubText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'center',
  },
  tooltipAbsolute: {
    position: 'absolute',
    top: -12,
    zIndex: 999,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  tooltipVal: {
    fontSize: 11,
    fontWeight: '800',
  },
})
