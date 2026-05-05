import { json } from '@/server/http'

export const runtime = 'nodejs'

export async function GET() {
  return json({
    platforms: [
      { value: 'gumroad', label: 'Gumroad', icon: '📦' },
      { value: 'stripe', label: 'Stripe', icon: '💳' },
      { value: 'shopify', label: 'Shopify', icon: '🛍️' },
      { value: 'paypal', label: 'PayPal', icon: '💰' },
      { value: 'etsy', label: 'Etsy', icon: '🎨' },
      { value: 'lemonsqueezy', label: 'Lemon Squeezy', icon: '🍋' },
      { value: 'sellfy', label: 'Sellfy', icon: '🏪' },
      { value: 'wix', label: 'Wix', icon: '🌐' },
      { value: 'kajabi', label: 'Kajabi', icon: '📚' },
      { value: 'teachable', label: 'Teachable', icon: '🎓' },
      { value: 'udemy', label: 'Udemy', icon: '📖' },
      { value: 'custom', label: 'Custom URL', icon: '🔗' },
    ],
  })
}
