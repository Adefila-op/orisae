export interface User {
  id: string
  wallet_address: string
  email?: string
  username?: string
  display_name?: string
  avatar_url?: string
  bio?: string
  is_creator: boolean
  total_sales: number
  total_conversions: number
  intent_score: number
  subscribed_to_notifications: boolean
  created_at: Date
  updated_at: Date
}

export interface SmartLink {
  id: string
  creator_id: string
  product_id?: string
  code: string
  short_url?: string
  target_url: string
  offer_type: 'recovery' | 'discount' | 'upsell' | 'bundle'
  offer_value: number
  enabled: boolean
  click_count: number
  conversion_count: number
  total_value: number
  created_at: Date
  updated_at: Date
}

export interface UserEvent {
  id: string
  link_id: string
  user_address?: string
  event_type: 'click' | 'view' | 'conversion' | 'abandoned'
  browser_info?: Record<string, any>
  device_type?: string
  ip_address?: string
  referrer?: string
  utm_source?: string
  utm_campaign?: string
  utm_medium?: string
  intent_signals?: Record<string, any>
  created_at: Date
}

export interface IntentScore {
  id: string
  link_id: string
  user_identifier: string
  engagement_score: number
  price_sensitivity: number
  urgency_score: number
  purchase_probability: number
  recommended_offer_type: string
  recommended_offer_value: number
  last_evaluated_at: Date
  created_at: Date
}

export interface Notification {
  id: string
  user_id: string
  type: 'conversion' | 'abandoned_cart' | 'new_lead' | 'offer_accepted'
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  sent_at: Date
  read_at?: Date
}

export interface DashboardStats {
  totalLinks: number
  activeLinks: number
  totalClicks: number
  totalConversions: number
  totalValue: number
  conversionRate: string
}
