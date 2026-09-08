import mobileAds, {
  InterstitialAd,
  RewardedAd,
  AppOpenAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads'
import { ADMOB_CONFIG } from '../config/admob'

class AdMobManager {
  private initialized = false
  private interstitial: InterstitialAd | null = null
  private interstitialLoaded = false
  private rewarded: RewardedAd | null = null
  private rewardedLoaded = false
  private appOpen: AppOpenAd | null = null
  private appOpenLoaded = false
  private actionCounter = 0
  private readonly INTERSTITIAL_FREQUENCY = 4 // Show interstitial every 4 major actions

  /**
   * Initialize Google Mobile Ads SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const adapterStatuses = await mobileAds().initialize()
      this.initialized = true
      console.log('✅ Google Mobile Ads SDK Initialized:', adapterStatuses)

      // Preload ads in background
      this.preloadInterstitial()
      this.preloadRewarded()
      this.preloadAppOpen()
    } catch (error) {
      console.warn('⚠️ Google Mobile Ads initialization skipped/failed:', error)
    }
  }

  /**
   * Preload Interstitial Ad
   */
  preloadInterstitial(): void {
    try {
      if (this.interstitialLoaded && this.interstitial) return

      const adUnitId = ADMOB_CONFIG.interstitialUnitId
      this.interstitial = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      })

      this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
        this.interstitialLoaded = true
        console.log('✅ Interstitial Ad loaded and ready')
      })

      this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        this.interstitialLoaded = false
        console.log('⚠️ Interstitial Ad load error:', error)
      })

      this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        this.interstitialLoaded = false
        // Automatically preload the next one
        this.preloadInterstitial()
      })

      this.interstitial.load()
    } catch (e) {
      console.warn('Could not load interstitial ad:', e)
    }
  }

  /**
   * Show Interstitial Ad (with frequency capping)
   * @param force - if true, bypasses the frequency counter
   */
  async showInterstitial(force = false): Promise<boolean> {
    this.actionCounter++

    if (!force && this.actionCounter % this.INTERSTITIAL_FREQUENCY !== 0) {
      return false
    }

    if (this.interstitial && this.interstitialLoaded) {
      try {
        await this.interstitial.show()
        return true
      } catch (err) {
        console.warn('Error displaying interstitial ad:', err)
        this.preloadInterstitial()
        return false
      }
    } else {
      this.preloadInterstitial()
      return false
    }
  }

  /**
   * Preload Rewarded Ad
   */
  preloadRewarded(): void {
    try {
      if (this.rewardedLoaded && this.rewarded) return

      const adUnitId = ADMOB_CONFIG.rewardedUnitId
      this.rewarded = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      })

      this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this.rewardedLoaded = true
        console.log('✅ Rewarded Ad loaded and ready')
      })

      this.rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        this.rewardedLoaded = false
        console.log('⚠️ Rewarded Ad load error:', error)
      })

      this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        this.rewardedLoaded = false
        this.preloadRewarded()
      })

      this.rewarded.load()
    } catch (e) {
      console.warn('Could not load rewarded ad:', e)
    }
  }

  /**
   * Show Rewarded Ad and execute onReward callback on success
   */
  async showRewarded(onReward: () => void): Promise<boolean> {
    if (this.rewarded && this.rewardedLoaded) {
      try {
        const unsubscribe = this.rewarded.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            console.log('🏆 User earned reward!')
            onReward()
          }
        )

        await this.rewarded.show()
        return true
      } catch (err) {
        console.warn('Error displaying rewarded ad:', err)
        this.preloadRewarded()
        return false
      }
    } else {
      console.log('Rewarded ad not loaded yet, trying reload')
      this.preloadRewarded()
      return false
    }
  }

  /**
   * Preload App Open Ad
   */
  preloadAppOpen(): void {
    try {
      if (this.appOpenLoaded && this.appOpen) return

      const adUnitId = ADMOB_CONFIG.appOpenUnitId
      this.appOpen = AppOpenAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      })

      this.appOpen.addAdEventListener(AdEventType.LOADED, () => {
        this.appOpenLoaded = true
        console.log('✅ App Open Ad loaded and ready')
      })

      this.appOpen.addAdEventListener(AdEventType.ERROR, (error) => {
        this.appOpenLoaded = false
        console.log('⚠️ App Open Ad load error:', error)
      })

      this.appOpen.addAdEventListener(AdEventType.CLOSED, () => {
        this.appOpenLoaded = false
        this.preloadAppOpen()
      })

      this.appOpen.load()
    } catch (e) {
      console.warn('Could not load app open ad:', e)
    }
  }

  /**
   * Show App Open Ad
   */
  async showAppOpen(): Promise<boolean> {
    if (this.appOpen && this.appOpenLoaded) {
      try {
        await this.appOpen.show()
        return true
      } catch (err) {
        console.warn('Error displaying app open ad:', err)
        this.preloadAppOpen()
        return false
      }
    } else {
      this.preloadAppOpen()
      return false
    }
  }
}

export const AdMobService = new AdMobManager()
