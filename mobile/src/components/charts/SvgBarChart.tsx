import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Svg, { Rect, Defs, LinearGradient, Stop, Line as SvgLine, G } from 'react-native-svg'

interface GroupedBarItem {
  label: string
  values: {
    key: string
    value: number
    color: string
  }[]
}

interface SvgBarChartProps {
  data: GroupedBarItem[]
  height?: number
  width?: number
  barWidth?: number
  gap?: number
  gridColor?: string
  textColor?: string
  currencySymbol?: string
  showYAxis?: boolean
}

export const SvgBarChart = ({
  data,
  height = 180,
  width = 340,
  barWidth = 10,
  gap = 4,
  gridColor = 'rgba(255, 255, 255, 0.08)',
  textColor = '#94A3B8',
  currencySymbol = '₹',
  showYAxis = true,
}: SvgBarChartProps) => {
  const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null)

  const paddingLeft = showYAxis ? 38 : 20
  const paddingRight = 15
  const paddingTop = 28
  const paddingBottom = 28

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const allValues = data.flatMap((d) => d.values.map((v) => v.value))
  const rawMax = Math.max(...allValues, 1000)
  const maxVal = Math.ceil(rawMax / 1000) * 1000 || 1000

  const groupWidth = chartWidth / data.length
  const gridSteps = [0, 0.33, 0.66, 1]

  const formatYLabel = (ratio: number) => {
    const val = maxVal * (1 - ratio)
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
    return `${Math.round(val)}`
  }

  const handleGroupClick = (idx: number) => {
    if (activeGroupIdx === idx) {
      setActiveGroupIdx(null)
    } else {
      setActiveGroupIdx(idx)
    }
  }

  const activeItem = activeGroupIdx !== null ? data[activeGroupIdx] : null

  return (
    <View style={styles.chartWrapper}>
      {/* Absolute Floating Tooltip (No layout jumping) */}
      {activeItem && (
        <View style={styles.tooltipAbsolute}>
          <Text style={styles.tooltipTitle}>{activeItem.label}</Text>
          <View style={styles.tooltipRowContainer}>
            {activeItem.values.map((v) => (
              <View key={v.key} style={styles.tooltipItem}>
                <View style={[styles.tooltipDot, { backgroundColor: v.color }]} />
                <Text style={[styles.tooltipVal, { color: v.color }]}>
                  {currencySymbol}{(v.value ?? 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Svg width={width} height={height}>
        {/* Horizontal Grid lines */}
        {gridSteps.map((ratio, idx) => {
          const y = paddingTop + chartHeight * ratio
          return (
            <SvgLine
              key={`grid-${idx}`}
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke={gridColor}
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          )
        })}

        {/* Grouped Bars */}
        {data.map((item, groupIdx) => {
          const totalBarsInGroup = item.values.length
          const clusterWidth = totalBarsInGroup * barWidth + (totalBarsInGroup - 1) * gap
          const groupCenterX = paddingLeft + groupIdx * groupWidth + groupWidth / 2
          const startX = groupCenterX - clusterWidth / 2
          const isSelected = activeGroupIdx === groupIdx

          return (
            <G key={`group-${groupIdx}`}>
              {/* Tap area */}
              <Rect
                x={groupCenterX - groupWidth / 2}
                y={paddingTop}
                width={groupWidth}
                height={chartHeight}
                fill="transparent"
                onPress={() => handleGroupClick(groupIdx)}
              />

              {item.values.map((v, barIdx) => {
                const barH = (v.value / maxVal) * chartHeight
                const x = startX + barIdx * (barWidth + gap)
                const y = paddingTop + chartHeight - barH

                return (
                  <Rect
                    key={`bar-${groupIdx}-${barIdx}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barH, 2)}
                    rx={4}
                    fill={v.color}
                    opacity={activeGroupIdx !== null && !isSelected ? 0.4 : 1}
                    stroke={isSelected ? '#FFFFFF' : 'none'}
                    strokeWidth={isSelected ? 1.5 : 0}
                    onPress={() => handleGroupClick(groupIdx)}
                  />
                )
              })}
            </G>
          )
        })}
      </Svg>

      {/* Y Axis Labels */}
      {showYAxis && (
        <View style={[styles.yAxisContainer, { left: 4, top: paddingTop - 8, height: chartHeight + 16 }]}>
          {gridSteps.map((ratio, idx) => (
            <Text key={`y-lbl-${idx}`} style={[styles.yAxisText, { color: textColor }]}>
              {formatYLabel(ratio)}
            </Text>
          ))}
        </View>
      )}

      {/* X-axis labels */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: chartWidth,
          marginLeft: paddingLeft - (showYAxis ? 14 : 10),
          marginTop: -20,
        }}
      >
        {data.map((item, idx) => {
          const isSelected = activeGroupIdx === idx
          return (
            <TouchableOpacity key={item.label} onPress={() => handleGroupClick(idx)} activeOpacity={0.7}>
              <Text
                style={[
                  styles.axisText,
                  { color: isSelected ? '#8B5CF6' : textColor, fontWeight: isSelected ? '800' : '600' },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  chartWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  axisText: {
    fontSize: 10,
    textAlign: 'center',
  },
  yAxisContainer: {
    position: 'absolute',
    justifyContent: 'space-between',
    width: 30,
    alignItems: 'flex-end',
  },
  yAxisText: {
    fontSize: 9,
    fontWeight: '600',
  },
  tooltipAbsolute: {
    position: 'absolute',
    top: -2,
    zIndex: 999,
    backgroundColor: '#1E293B',
    borderColor: '#8B5CF6',
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
  },
  tooltipTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  tooltipRowContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tooltipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tooltipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tooltipVal: {
    fontSize: 10,
    fontWeight: '700',
  },
})
