import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line as SvgLine, G, Rect } from 'react-native-svg'

interface LineDataSeries {
  key: string
  color: string
  values: number[]
}

interface SvgLineChartProps {
  labels: string[]
  series: LineDataSeries[]
  height?: number
  width?: number
  showGrid?: boolean
  gridColor?: string
  textColor?: string
  currencySymbol?: string
  showYAxis?: boolean
  yAxisSuffix?: string
}

export const SvgLineChart = ({
  labels,
  series,
  height = 200,
  width = 340,
  showGrid = true,
  gridColor = 'rgba(255, 255, 255, 0.08)',
  textColor = '#94A3B8',
  currencySymbol = '₹',
  showYAxis = true,
  yAxisSuffix = '',
}: SvgLineChartProps) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const paddingLeft = showYAxis ? 42 : 25
  const paddingRight = 20
  const paddingTop = 32
  const paddingBottom = 28

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const allValues = series.flatMap((s) => s.values)
  const rawMax = Math.max(...allValues, 10)
  // Round max for clean Y-axis ticks
  const maxVal = yAxisSuffix === '%' ? Math.ceil(rawMax / 10) * 10 || 50 : Math.ceil(rawMax / 1000) * 1000 || 1000
  const minVal = 0

  const getX = (index: number) => {
    if (labels.length <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index / (labels.length - 1)) * chartWidth
  }

  const getY = (value: number) => {
    const ratio = (value - minVal) / (maxVal - minVal || 1)
    return paddingTop + chartHeight - ratio * chartHeight
  }

  const generateBezierPath = (values: number[]) => {
    if (values.length === 0) return ''
    const points = values.map((val, idx) => ({ x: getX(idx), y: getY(val) }))

    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cpX = (p0.x + p1.x) / 2
      path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`
    }
    return path
  }

  const gridSteps = [0, 0.25, 0.5, 0.75, 1]

  const formatYLabel = (ratio: number) => {
    const val = maxVal * (1 - ratio)
    if (yAxisSuffix === '%') return `${Math.round(val)}%`
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
    return `${Math.round(val)}`
  }

  const handlePointPress = (idx: number) => {
    if (activeIdx === idx) {
      setActiveIdx(null)
    } else {
      setActiveIdx(idx)
    }
  }

  return (
    <View style={styles.chartWrapper}>
      {/* Absolute Floating Tooltip (No card layout shift) */}
      {activeIdx !== null && (
        <View style={styles.tooltipAbsolute}>
          <Text style={styles.tooltipTitle}>{labels[activeIdx]}</Text>
          <View style={styles.tooltipRowContainer}>
            {series.map((s) => (
              <View key={s.key} style={styles.tooltipItem}>
                <View style={[styles.tooltipDot, { backgroundColor: s.color }]} />
                <Text style={styles.tooltipLabel}>{s.key}:</Text>
                <Text style={[styles.tooltipVal, { color: s.color }]}>
                  {yAxisSuffix === '%' ? '' : currencySymbol}
                  {s.values[activeIdx].toLocaleString()}
                  {yAxisSuffix}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Svg width={width} height={height}>
        <Defs>
          {series.map((s) => (
            <LinearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
            </LinearGradient>
          ))}
        </Defs>

        {/* Horizontal Grid lines & Y-Axis values */}
        {showGrid &&
          gridSteps.map((ratio, idx) => {
            const y = paddingTop + chartHeight * ratio
            return (
              <G key={`grid-${idx}`}>
                <SvgLine
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={gridColor}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              </G>
            )
          })}

        {/* Vertical cursor indicator line when active */}
        {activeIdx !== null && (
          <SvgLine
            x1={getX(activeIdx)}
            y1={paddingTop - 5}
            x2={getX(activeIdx)}
            y2={paddingTop + chartHeight + 5}
            stroke="#8B5CF6"
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />
        )}

        {/* Series Paths */}
        {series.map((s) => {
          const linePath = generateBezierPath(s.values)
          return <Path key={s.key} d={linePath} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" />
        })}

        {/* Interactive Tap Nodes */}
        {labels.map((_, idx) => {
          const isSelected = activeIdx === idx
          return (
            <G key={`tap-col-${idx}`}>
              <Rect
                x={getX(idx) - 18}
                y={paddingTop}
                width={36}
                height={chartHeight}
                fill="transparent"
                onPress={() => handlePointPress(idx)}
              />

              {series.map((s) => (
                <Circle
                  key={`dot-${s.key}-${idx}`}
                  cx={getX(idx)}
                  cy={getY(s.values[idx])}
                  r={isSelected ? 6 : 4}
                  fill={s.color}
                  stroke={isSelected ? '#FFFFFF' : '#0F1523'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  onPress={() => handlePointPress(idx)}
                />
              ))}
            </G>
          )
        })}
      </Svg>

      {/* Y Axis Labels (Left Column) */}
      {showYAxis && (
        <View style={[styles.yAxisContainer, { left: 4, top: paddingTop - 8, height: chartHeight + 16 }]}>
          {gridSteps.map((ratio, idx) => (
            <Text key={`y-lbl-${idx}`} style={[styles.yAxisText, { color: textColor }]}>
              {formatYLabel(ratio)}
            </Text>
          ))}
        </View>
      )}

      {/* X Axis Labels */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: chartWidth,
          marginLeft: paddingLeft - (showYAxis ? 14 : 10),
          marginTop: -20,
        }}
      >
        {labels.map((l, idx) => {
          const isSelected = activeIdx === idx
          return (
            <TouchableOpacity key={l} onPress={() => handlePointPress(idx)} activeOpacity={0.7}>
              <Text
                style={[
                  styles.axisText,
                  { color: isSelected ? '#8B5CF6' : textColor, fontWeight: isSelected ? '800' : '600' },
                ]}
              >
                {l}
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
    width: 32,
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
  tooltipLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  tooltipVal: {
    fontSize: 10,
    fontWeight: '700',
  },
})
