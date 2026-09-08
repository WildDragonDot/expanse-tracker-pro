import { Platform } from 'react-native'
import { TestIds } from 'react-native-google-mobile-ads'

/**
 * Google AdMob Configuration
 *
 * NOTE: Set USE_TEST_ADS to false and replace LIVE unit IDs with your actual AdMob Ad Unit IDs
 * when ready to publish to Google Play Store.
 */
export const ADMOB_CONFIG = {
  // Toggle between Google Test Ads and Live Production Ads
  USE_TEST_ADS: false,

  // App ID (for Android & iOS)
  APP_ID: {
    android: 'ca-app-pub-7544180796220594~5716479610', // Live AdMob Android App ID
    ios: 'ca-app-pub-3940256099942544~1458002511',
  },

  // Live Ad Unit IDs (Google AdMob console)
  LIVE_AD_UNITS: {
    BANNER: {
      android: 'ca-app-pub-7544180796220594/8668382915', // Live Banner Ad Unit ID
      ios: 'ca-app-pub-3940256099942544/2934735716',
    },
    INTERSTITIAL: {
      android: 'ca-app-pub-7544180796220594/2549697120', // Live Interstitial Ad Unit ID
      ios: 'ca-app-pub-3940256099942544/4411468910',
    },
    REWARDED: {
      android: 'ca-app-pub-7544180796220594/8773887793', // Live Rewarded Ad Unit ID
      ios: 'ca-app-pub-3940256099942544/1712485313',
    },
    APP_OPEN: {
      android: 'ca-app-pub-7544180796220594/8687247568', // Live App Open Ad Unit ID
      ios: 'ca-app-pub-3940256099942544/5575463023',
    },
  },

  // Helper getters to seamlessly return test vs live Ad Unit IDs
  get bannerUnitId(): string {
    if (this.USE_TEST_ADS) {
      return TestIds.BANNER
    }
    return Platform.OS === 'ios' ? this.LIVE_AD_UNITS.BANNER.ios : this.LIVE_AD_UNITS.BANNER.android
  },

  get interstitialUnitId(): string {
    if (this.USE_TEST_ADS) {
      return TestIds.INTERSTITIAL
    }
    return Platform.OS === 'ios' ? this.LIVE_AD_UNITS.INTERSTITIAL.ios : this.LIVE_AD_UNITS.INTERSTITIAL.android
  },

  get rewardedUnitId(): string {
    if (this.USE_TEST_ADS) {
      return TestIds.REWARDED
    }
    return Platform.OS === 'ios' ? this.LIVE_AD_UNITS.REWARDED.ios : this.LIVE_AD_UNITS.REWARDED.android
  },

  get appOpenUnitId(): string {
    if (this.USE_TEST_ADS) {
      return TestIds.APP_OPEN
    }
    return Platform.OS === 'ios' ? this.LIVE_AD_UNITS.APP_OPEN.ios : this.LIVE_AD_UNITS.APP_OPEN.android
  },
}
