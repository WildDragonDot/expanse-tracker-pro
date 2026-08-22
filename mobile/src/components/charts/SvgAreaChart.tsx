import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line as SvgLine, Rect, G } from 'react-native-svg'

interface SvgAreaChartProps {
  labels: string[]
  values: number[]
  color?: string
  height?: number
  width?: number
  gridColor?: string
  textColor?: string
  currencySymbol?: string
  showYAxis?: boolean
}

export const SvgAreaChart = ({
  labels,
  values,
  color = '#EC4899',
  height = 180,
  width = 340,
  gridColor = 'rgba(255, 255, 255, 0.08)',
  textColor = '#94A3B8',
  currencySymbol = '₹',
  showYAxis = true,
}: SvgAreaChartProps) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const paddingLeft = showYAxis ? 38 : 25
  const paddingRight = 20
  const paddingTop = 28
  const paddingBottom = 28

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const rawMax = Math.max(...values, 100)
  const maxVal = Math.ceil(rawMax / 500) * 500 || 500
  const minVal = 0

  const getX = (index: number) => {
    if (labels.length <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index / (labels.length - 1)) * chartWidth
  }

  const getY = (value: number) => {
    const ratio = (value - minVal) / (maxVal - minVal || 1)
    return paddingTop + chartHeight - ratio * chartHeight
  }

  const points = values.map((val, idx) => ({ x: getX(idx), y: getY(val) }))

  let curvePath = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const cpX = (p0.x + p1.x) / 2
    curvePath += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`
  }

  const areaPath = `${curvePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
  const gridSteps = [0, 0.33, 0.66, 1]

  const formatYLabel = (ratio: number) => {
    const val = maxVal * (1 - ratio)
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`
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
      {/* Absolute Floating Tooltip */}
      {activeIdx !== null && (
        <View style={[styles.tooltipAbsolute, { borderColor: color }]}>
          <Text style={styles.tooltipTitle}>{labels[activeIdx]}:</Text>
          <Text style={[styles.tooltipVal, { color }]}>
            {currencySymbol}{(values[activeIdx] ?? 0).toLocaleString()}
          </Text>
        </View>
      )}

      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
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

        {/* Vertical cursor indicator */}
        {activeIdx !== null && (
          <SvgLine
            x1={getX(activeIdx)}
            y1={paddingTop - 5}
            x2={getX(activeIdx)}
            y2={paddingTop + chartHeight + 5}
            stroke={color}
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />
        )}

        {/* Gradient Area Fill */}
        <Path d={areaPath} fill="url(#areaGrad)" />

        {/* Line Stroke */}
        <Path d={curvePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />

        {/* Interactive Tap Nodes */}
        {values.map((val, idx) => {
          const isSelected = activeIdx === idx
          return (
            <G key={`dot-group-${idx}`}>
              <Rect
                x={getX(idx) - 18}
                y={paddingTop}
                width={36}
                height={chartHeight}
                fill="transparent"
                onPress={() => handlePointPress(idx)}
              />
              <Circle
                cx={getX(idx)}
                cy={getY(val)}
                r={isSelected ? 6.5 : 4.5}
                fill={color}
                stroke={isSelected ? '#FFFFFF' : '#0F1523'}
                strokeWidth={isSelected ? 2 : 1.5}
                onPress={() => handlePointPress(idx)}
              />
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
                  { color: isSelected ? color : textColor, fontWeight: isSelected ? '800' : '600' },
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
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
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
