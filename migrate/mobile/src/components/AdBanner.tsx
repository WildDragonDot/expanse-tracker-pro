import React, { useState } from 'react'
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads'
import { ADMOB_CONFIG } from '../config/admob'
import { useAppTheme } from '../context/ThemeContext'

interface AdBannerProps {
  size?: BannerAdSize
  style?: any
}

export const AdBanner: React.FC<AdBannerProps> = ({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  style,
}) => {
  const { colors } = useAppTheme()
  const [adLoaded, setAdLoaded] = useState(false)
  const [adFailed, setAdFailed] = useState(false)

  if (adFailed) {
    return null // Gracefully collapse container if no ad available
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <BannerAd
        unitId={ADMOB_CONFIG.bannerUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setAdLoaded(true)
          setAdFailed(false)
        }}
        onAdFailedToLoad={(error) => {
          setAdFailed(true)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    minHeight: 52,
    marginVertical: 8,
  },
})
