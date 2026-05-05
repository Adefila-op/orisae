/**
 * Client-side Platform Detection Utility
 * Mirrors backend detection for real-time UI feedback
 */

export type SupportedPlatform = 
  | 'gumroad'
  | 'stripe'
  | 'shopify'
  | 'paypal'
  | 'etsy'
  | 'lemonsqueezy'
  | 'sellfy'
  | 'wix'
  | 'kajabi'
  | 'teachable'
  | 'udemy'
  | 'custom'

interface PlatformDetectionResult {
  platform: SupportedPlatform
  productId?: string
  productName?: string
  confidence: 'high' | 'medium' | 'low'
}

const PLATFORM_PATTERNS: Record<string, { pattern: RegExp; platform: SupportedPlatform }> = {
  gumroad: {
    pattern: /^https?:\/\/(www\.)?gumroad\.com\/[a-z0-9_@]+(\/|#|\/.*)?/i,
    platform: 'gumroad',
  },
  stripe: {
    pattern: /^https?:\/\/(www\.)?buy\.stripe\.com\/[a-zA-Z0-9]+/i,
    platform: 'stripe',
  },
  shopify: {
    pattern: /^https?:\/\/[a-z0-9\-]+\.myshopify\.com\/|^https?:\/\/(www\.)?[a-z0-9\-]+\.shopify\.com\//i,
    platform: 'shopify',
  },
  paypal: {
    pattern: /^https?:\/\/(www\.)?paypal\.com\/(pay|webapps)/i,
    platform: 'paypal',
  },
  etsy: {
    pattern: /^https?:\/\/(www\.)?etsy\.com\/listing\/\d+/i,
    platform: 'etsy',
  },
  lemonsqueezy: {
    pattern: /^https?:\/\/(www\.)?lemon\.io|lemonsqueezy\.com/i,
    platform: 'lemonsqueezy',
  },
  sellfy: {
    pattern: /^https?:\/\/(www\.)?sellfy\.com|[a-z0-9\-]+\.myshopify\.com/i,
    platform: 'sellfy',
  },
  wix: {
    pattern: /^https?:\/\/[a-z0-9\-]+\.wixsite\.com\/|^https?:\/\/(www\.)?[a-z0-9\-]+\.wix\.com\//i,
    platform: 'wix',
  },
  kajabi: {
    pattern: /^https?:\/\/(www\.)?kajabi\.com|[a-z0-9\-]+\.kajabibuild\.com/i,
    platform: 'kajabi',
  },
  teachable: {
    pattern: /^https?:\/\/(www\.)?teachable\.com|[a-z0-9\-]+\.teachable\.school/i,
    platform: 'teachable',
  },
  udemy: {
    pattern: /^https?:\/\/(www\.)?udemy\.com\/(courses|course)\//i,
    platform: 'udemy',
  },
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): PlatformDetectionResult {
  const trimmedUrl = url.trim().toLowerCase()

  for (const [key, { pattern, platform }] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(trimmedUrl)) {
      const productId = extractProductId(trimmedUrl, platform)
      const productName = extractProductName(trimmedUrl, platform)

      return {
        platform,
        productId,
        productName,
        confidence: 'high',
      }
    }
  }

  return {
    platform: 'custom',
    confidence: 'low',
  }
}

function extractProductId(url: string, platform: SupportedPlatform): string | undefined {
  try {
    switch (platform) {
      case 'gumroad': {
        const match = url.match(/gumroad\.com\/([a-z0-9_@]+)/i)
        return match?.[1]
      }
      case 'stripe': {
        const match = url.match(/buy\.stripe\.com\/([a-zA-Z0-9]+)/i)
        return match?.[1]
      }
      case 'shopify': {
        const match = url.match(/\/products\/([a-z0-9\-]+)/i)
        return match?.[1]
      }
      case 'etsy': {
        const match = url.match(/listing\/(\d+)/i)
        return match?.[1]
      }
      case 'udemy': {
        const match = url.match(/course\/([a-z0-9\-]+)/i)
        return match?.[1]
      }
      default:
        return undefined
    }
  } catch {
    return undefined
  }
}

function extractProductName(url: string, platform: SupportedPlatform): string | undefined {
  try {
    switch (platform) {
      case 'gumroad': {
        const match = url.match(/gumroad\.com\/[a-z0-9_@]+\/([a-z0-9\-]+)/i)
        return match?.[1]?.replace(/[-]/g, ' ')
      }
      case 'shopify': {
        const match = url.match(/\/products\/([a-z0-9\-]+)/i)
        return match?.[1]?.replace(/[-]/g, ' ')
      }
      case 'udemy': {
        const match = url.match(/course\/([a-z0-9\-]+)/i)
        return match?.[1]?.replace(/[-]/g, ' ')
      }
      default:
        return undefined
    }
  } catch {
    return undefined
  }
}

/**
 * Get platform display info
 */
export function getPlatformInfo(platform: SupportedPlatform): {
  name: string
  icon: string
  color: string
} {
  const platformInfo: Record<SupportedPlatform, { name: string; icon: string; color: string }> = {
    gumroad: { name: 'Gumroad', icon: '📦', color: 'text-orange-500' },
    stripe: { name: 'Stripe', icon: '💳', color: 'text-blue-600' },
    shopify: { name: 'Shopify', icon: '🛍️', color: 'text-green-600' },
    paypal: { name: 'PayPal', icon: '💰', color: 'text-blue-500' },
    etsy: { name: 'Etsy', icon: '🎨', color: 'text-yellow-600' },
    lemonsqueezy: { name: 'Lemon Squeezy', icon: '🍋', color: 'text-yellow-500' },
    sellfy: { name: 'Sellfy', icon: '🏪', color: 'text-purple-600' },
    wix: { name: 'Wix', icon: '🌐', color: 'text-purple-500' },
    kajabi: { name: 'Kajabi', icon: '📚', color: 'text-blue-500' },
    teachable: { name: 'Teachable', icon: '🎓', color: 'text-indigo-600' },
    udemy: { name: 'Udemy', icon: '📖', color: 'text-purple-700' },
    custom: { name: 'Custom', icon: '🔗', color: 'text-slate-600' },
  }

  return platformInfo[platform] || { name: 'Unknown', icon: '❓', color: 'text-gray-600' }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
