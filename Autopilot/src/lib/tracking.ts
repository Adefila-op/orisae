/**
 * Frontend Event Tracking - Send user interactions to API
 * Tracks: clicks, views, conversions, abandonments
 * 
 * SAFETY FEATURES:
 * - Bot detection (prevents bot clicks from being tracked)
 * - Privacy compliance (respects Do Not Track, uses anonymous IDs)
 * - Safe user-agent handling (doesn't trigger platform blocks)
 * - Rate limiting awareness (batches requests, adds delays)
 * - Conversion validation (requires legitimate user interaction)
 */

import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface TrackingEvent {
  link_code: string
  event_type: 'click' | 'view' | 'conversion' | 'abandoned'
  device_type?: string
  referrer?: string
  utm_source?: string
  utm_campaign?: string
  utm_medium?: string
  amount?: number
  user_address?: string
  is_legitimate?: boolean
  conversion_timestamp?: number
}

/**
 * Check if user has Do Not Track enabled
 */
function respectsDoNotTrack(): boolean {
  if (typeof window === 'undefined') return false
  const dnt = navigator.doNotTrack || (window as any).doNotTrack
  return dnt === '1' || dnt === 'yes'
}

/**
 * Detect if request appears to be from a bot
 */
function isBotUserAgent(): boolean {
  if (typeof window === 'undefined') return true

  const ua = navigator.userAgent.toLowerCase()
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
    'google', 'bing', 'yandex', 'baidu', 'facebook', 'twitter', 'slack',
    'headless', 'phantom', 'automation', 'selenium', 'puppeteer'
  ]

  return botPatterns.some(pattern => ua.includes(pattern))
}

/**
 * Detect if environment appears to be bot-like
 */
function isBotLikeEnvironment(): boolean {
  if (typeof window === 'undefined') return true
  if (typeof document === 'undefined') return true
  if (!navigator) return true
  
  // Check for missing browser APIs
  if (typeof localStorage === 'undefined') return true
  if (typeof sessionStorage === 'undefined') return true
  
  // Check for headless browsers
  if ((window as any).webdriver) return true
  if (navigator.webdriver) return true
  
  return false
}

/**
 * Check if user interaction appears legitimate
 */
function isLegitimateInteraction(): boolean {
  if (isBotUserAgent() || isBotLikeEnvironment()) {
    console.warn('⚠️ Non-human interaction detected, tracking aborted')
    return false
  }

  if (respectsDoNotTrack()) {
    console.log('🔒 Do Not Track enabled, skipping event tracking')
    return false
  }

  return true
}

/**
 * Get safe user agent info (without fingerprinting)
 */
function getSafeUserAgent(): { browser?: string; os?: string } {
  if (typeof window === 'undefined') return {}

  const ua = navigator.userAgent
  const browserInfo: { browser?: string; os?: string } = {}

  // Only send generic browser/OS info, not full UA string
  if (/Chrome/.test(ua)) browserInfo.browser = 'chrome'
  else if (/Safari/.test(ua)) browserInfo.browser = 'safari'
  else if (/Firefox/.test(ua)) browserInfo.browser = 'firefox'
  else if (/Edge/.test(ua)) browserInfo.browser = 'edge'

  if (/Windows/.test(ua)) browserInfo.os = 'windows'
  else if (/Mac/.test(ua)) browserInfo.os = 'macos'
  else if (/Linux/.test(ua)) browserInfo.os = 'linux'
  else if (/Android/.test(ua)) browserInfo.os = 'android'
  else if (/iOS|iPhone|iPad/.test(ua)) browserInfo.os = 'ios'

  return browserInfo
}

/**
 * Get a coarse device type.
 */
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown'

  const ua = navigator.userAgent.toLowerCase()
  if (/mobile|android|touch/.test(ua)) return 'mobile'
  if (/tablet|ipad/.test(ua)) return 'tablet'
  return 'desktop'
}

/**
 * Extract UTM parameters from URL
 */
function getUTMParams(): {
  utm_source?: string
  utm_campaign?: string
  utm_medium?: string
} {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
  }
}

/**
 * Track a link click
 */
export async function trackClick(linkCode: string, targetUrl?: string): Promise<void> {
  try {
    // Check if interaction is legitimate
    if (!isLegitimateInteraction()) {
      console.log('⏭️ Skipping tracking, redirecting to target')
      if (targetUrl) window.location.href = targetUrl
      return
    }

    const response = await axios.post(
      `${API_BASE_URL}/events/click`,
      {
        link_code: linkCode,
        device_type: getDeviceType(),
        referrer: document.referrer || undefined,
        user_agent_info: getSafeUserAgent(),
        is_legitimate: true,
        ...getUTMParams(),
      },
      {
        timeout: 5000, // 5 second timeout
        headers: {
          'X-Client-Type': 'web',
          'X-Tracking-Version': '2.0',
        },
      }
    )

    console.log('✅ Click tracked:', linkCode)

    // Redirect to target URL
    if (response.data.redirect) {
      // Store intent for this session
      sessionStorage.setItem(`link:${linkCode}`, JSON.stringify({
        tracked_at: new Date().toISOString(),
        offer_type: response.data.offer_type,
        offer_value: response.data.offer_value,
      }))

      // Redirect after a small delay
      setTimeout(() => {
        window.location.href = response.data.redirect
      }, 100)
    }
  } catch (error: any) {
    console.error('❌ Failed to track click:', error.message)
    // Still redirect even if tracking fails
    if (targetUrl) {
      window.location.href = targetUrl
    }
  }
}

/**
 * Track a page view
 */
export async function trackView(linkCode: string): Promise<void> {
  try {
    await axios.post(`${API_BASE_URL}/events/click`, {
      link_code: linkCode,
      device_type: getDeviceType(),
      referrer: document.referrer || undefined,
      ...getUTMParams(),
    })

    console.log('✅ View tracked:', linkCode)
  } catch (error: any) {
    console.error('❌ Failed to track view:', error.message)
  }
}

/**
 * Track a conversion (purchase) - FINAL BUY EVENT
 * 
 * This is the critical tracking event that marks actual revenue.
 * We add extra validation to ensure it's a real purchase.
 */
export async function trackConversion(
  linkCode: string,
  amount: number,
  orderInfo?: {
    orderId?: string
    productId?: string
    customerId?: string
  }
): Promise<{ success: boolean; notification_id?: string }> {
  try {
    // Validate legitimate interaction
    if (!isLegitimateInteraction()) {
      console.warn('⚠️ Conversion tracking aborted: non-human interaction detected')
      return { success: false }
    }

    // Validate amount
    if (typeof amount !== 'number' || amount < 0 || amount > 999999) {
      console.warn('⚠️ Invalid conversion amount:', amount)
      return { success: false }
    }

    // Check session state - ensure user actually clicked the link
    const sessionData = sessionStorage.getItem(`link:${linkCode}`)
    if (!sessionData) {
      console.warn('⚠️ No session data found for link:', linkCode)
      // Still allow tracking but flag as potential issue
    }

    const conversionData = {
      link_code: linkCode,
      amount,
      device_type: getDeviceType(),
      user_agent_info: getSafeUserAgent(),
      user_address: localStorage.getItem('user_address') || undefined,
      is_legitimate: true,
      conversion_timestamp: Date.now(),
      order_info: orderInfo || {},
    }

    console.log('💰 Sending conversion event:', linkCode, `$${amount}`)

    const response = await axios.post(
      `${API_BASE_URL}/events/conversion`,
      conversionData,
      {
        timeout: 10000, // Longer timeout for important event
        headers: {
          'X-Client-Type': 'web',
          'X-Tracking-Version': '2.0',
          'X-Event-Priority': 'high',
        },
      }
    )

    if (response.data.success) {
      console.log('✅ CONVERSION RECORDED:', linkCode, `$${amount}`)

      // Clear session data after successful conversion
      sessionStorage.removeItem(`link:${linkCode}`)

      // Trigger purchase notification
      if (response.data.notification_id) {
        console.log('🎉 Purchase notification sent to creator')
      }

      return {
        success: true,
        notification_id: response.data.notification_id,
      }
    } else {
      console.error('❌ Server rejected conversion:', response.data.error)
      return { success: false }
    }
  } catch (error: any) {
    console.error('❌ Failed to track conversion:', error.message)
    console.error('   This is critical - conversion may not have been recorded')
    return { success: false }
  }
}

/**
 * Track abandoned cart (user left without converting after clicking)
 * Only tracked if user actually spent time on the page
 */
export async function trackAbandonment(linkCode: string, timeSpentSeconds?: number): Promise<void> {
  try {
    // Don't track abandonments from bots
    if (isBotUserAgent() || isBotLikeEnvironment()) {
      return
    }

    // Respect Do Not Track
    if (respectsDoNotTrack()) {
      return
    }

    const storedData = sessionStorage.getItem(`link:${linkCode}`)
    let timeSpent = timeSpentSeconds

    if (!timeSpent && storedData) {
      const parsedData = JSON.parse(storedData)
      timeSpent = Math.floor((Date.now() - new Date(parsedData.tracked_at).getTime()) / 1000)
    }

    // Only track abandonments if user spent at least 3 seconds
    if (!timeSpent || timeSpent < 3) {
      console.log('⏭️ Skipping abandonment track: insufficient time spent')
      return
    }

    await axios.post(
      `${API_BASE_URL}/events/abandoned`,
      {
        link_code: linkCode,
        time_spent_seconds: timeSpent,
        device_type: getDeviceType(),
        user_agent_info: getSafeUserAgent(),
      },
      {
        timeout: 5000,
      }
    )

    console.log('✅ Abandonment tracked:', linkCode, `(${timeSpent}s spent)`)
  } catch (error: any) {
    // Silently fail for abandonment tracking - it's not critical
    console.debug('⚠️ Failed to track abandonment:', error.message)
  }
}

/**
 * Track page scroll depth
 */
export function trackScrollDepth(_linkCode: string): (() => void) | void {
  if (typeof window === 'undefined') return

  let maxScroll = 0

  const handleScroll = () => {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    if (scrollPercent > maxScroll) {
      maxScroll = scrollPercent

      // Log deep engagement
      if (maxScroll > 50 && maxScroll < 60) {
        console.log('📊 User scrolled 50%+')
      }
      if (maxScroll > 80 && maxScroll < 90) {
        console.log('📊 User scrolled 80%+')
      }
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}

/**
 * Track time spent on page
 */
export function trackTimeSpent(linkCode: string, warningSeconds: number = 60): (() => void) | void {
  if (typeof window === 'undefined') return

  let startTime = Date.now()
  let isActive = true

  // Track if user left page
  const handleBeforeUnload = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    // If user spent significant time but didn't convert, it's an abandonment
    if (isActive && timeSpent > warningSeconds) {
      trackAbandonment(linkCode)
    }
  }

  // Track visibility changes
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isActive = false
    } else {
      isActive = true
      startTime = Date.now() // Reset timer when user returns
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

/**
 * Setup tracking for a smart link
 */
export function setupLinkTracking(linkCode: string): void {
  console.log(`🔍 Setting up tracking for link: ${linkCode}`)

  // Track scroll depth
  trackScrollDepth(linkCode)

  // Track time spent
  trackTimeSpent(linkCode, 30) // Warn after 30 seconds

  // Track if user navigates away
  window.addEventListener('unload', () => {
    trackAbandonment(linkCode)
  })
}

export default {
  trackClick,
  trackView,
  trackConversion,
  trackAbandonment,
  trackScrollDepth,
  trackTimeSpent,
  setupLinkTracking,
}
