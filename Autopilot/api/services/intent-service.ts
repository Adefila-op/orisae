import { db, redis } from '../server'
import { v4 as uuidv4 } from 'uuid'

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
}

export class IntentService {
  private readonly CACHE_TTL = 3600 // 1 hour

  async scoreUserIntent(
    link_id: string,
    user_identifier: string,
    events: any[] = []
  ): Promise<IntentScore> {
    // Check cache first
    const cacheKey = `intent:${link_id}:${user_identifier}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // Get user events for this link
    const result = await db.query(
      `SELECT * FROM user_events 
       WHERE link_id = $1 AND user_identifier = $2 
       ORDER BY created_at DESC LIMIT 100`,
      [link_id, user_identifier]
    )

    const userEvents = result.rows

    // Calculate intent signals
    const engagementScore = this.calculateEngagement(userEvents)
    const priceSensitivity = this.calculatePriceSensitivity(userEvents)
    const urgencyScore = this.calculateUrgency(userEvents)
    const purchaseProbability = this.calculatePurchaseProbability(
      engagementScore,
      priceSensitivity,
      urgencyScore
    )

    // Determine recommended offer
    const { offer_type, offer_value } = this.recommendOffer(
      purchaseProbability,
      priceSensitivity,
      urgencyScore
    )

    // Store or update intent score
    const scoreId = uuidv4()
    await db.query(
      `INSERT INTO intent_scores (
        id, link_id, user_identifier, engagement_score, price_sensitivity,
        urgency_score, purchase_probability, recommended_offer_type,
        recommended_offer_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (link_id, user_identifier) 
      DO UPDATE SET engagement_score = $4, price_sensitivity = $5,
      urgency_score = $6, purchase_probability = $7,
      recommended_offer_type = $8, recommended_offer_value = $9,
      last_evaluated_at = NOW()`,
      [
        scoreId,
        link_id,
        user_identifier,
        engagementScore,
        priceSensitivity,
        urgencyScore,
        purchaseProbability,
        offer_type,
        offer_value,
      ]
    )

    const score: IntentScore = {
      id: scoreId,
      link_id,
      user_identifier,
      engagement_score: engagementScore,
      price_sensitivity: priceSensitivity,
      urgency_score: urgencyScore,
      purchase_probability: purchaseProbability,
      recommended_offer_type: offer_type,
      recommended_offer_value: offer_value,
    }

    // Cache result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(score))

    return score
  }

  private calculateEngagement(events: any[]): number {
    if (events.length === 0) return 0

    let score = 0
    
    // Multiple visits = higher engagement
    const uniqueDays = new Set(
      events.map(e => new Date(e.created_at).toDateString())
    ).size
    score += Math.min(uniqueDays * 10, 40)

    // Repeat clicks = intent signal
    const clickCount = events.filter(e => e.event_type === 'click').length
    score += Math.min(clickCount * 5, 30)

    // Deep interactions (e.g., viewed product details)
    const deepEvents = events.filter(e => 
      e.event_type === 'view' || e.intent_signals?.detail_viewed
    ).length
    score += Math.min(deepEvents * 8, 30)

    return Math.min(score, 100)
  }

  private calculatePriceSensitivity(events: any[]): number {
    if (events.length === 0) return 50 // Neutral

    let score = 50
    
    // Check for price comparison signals
    const priceChecks = events.filter(e => 
      e.intent_signals?.price_checked || e.intent_signals?.comparison_viewed
    ).length
    
    if (priceChecks > 0) {
      score += priceChecks * 10 // Higher price sensitivity
    }

    // Quick abandonment without purchase = price sensitive
    const abandonedQuickly = events.some(e => 
      e.event_type === 'abandoned' && 
      (new Date(e.created_at).getTime() - new Date(events[events.length - 1].created_at).getTime()) < 60000
    )
    if (abandonedQuickly) {
      score += 20
    }

    return Math.min(score, 100)
  }

  private calculateUrgency(events: any[]): number {
    if (events.length === 0) return 0

    let score = 0
    const now = Date.now()
    
    // Recent activity = urgency
    const recentEvent = events[0]
    const timeSinceRecent = (now - new Date(recentEvent.created_at).getTime()) / 1000 / 60
    
    if (timeSinceRecent < 5) score += 40 // Very recent = high urgency
    else if (timeSinceRecent < 30) score += 25
    else if (timeSinceRecent < 60) score += 10

    // Multiple visits in short timeframe
    const recentVisits = events.filter(e => {
      const time = (now - new Date(e.created_at).getTime()) / 1000 / 60
      return time < 60
    }).length

    score += Math.min(recentVisits * 5, 40)

    return Math.min(score, 100)
  }

  private calculatePurchaseProbability(
    engagement: number,
    priceSensitivity: number,
    urgency: number
  ): number {
    // Weighted calculation
    const weights = {
      engagement: 0.4,
      urgency: 0.35,
      priceSensitivity: -0.25, // Negative correlation
    }

    const normalized = priceSensitivity / 100
    return Math.min(
      (engagement * weights.engagement +
        urgency * weights.urgency +
        (100 - priceSensitivity) * Math.abs(weights.priceSensitivity)) /
        Object.values(weights).reduce((a, b) => a + Math.abs(b), 0) *
        100,
      100
    )
  }

  private recommendOffer(
    purchaseProbability: number,
    priceSensitivity: number,
    urgencyScore: number
  ): { offer_type: string; offer_value: number } {
    // Agent decision logic
    if (purchaseProbability > 70) {
      // High intent - minimal discount
      return { offer_type: 'upsell', offer_value: 0 }
    } else if (purchaseProbability > 50) {
      // Medium intent - small discount or bundle
      if (priceSensitivity > 60) {
        return { offer_type: 'discount', offer_value: 10 }
      }
      return { offer_type: 'bundle', offer_value: 15 }
    } else if (urgencyScore > 60) {
      // High urgency, low probability - urgent discount
      return { offer_type: 'recovery', offer_value: 20 }
    } else if (priceSensitivity > 70) {
      // Price-sensitive - bigger discount
      return { offer_type: 'recovery', offer_value: 25 }
    } else {
      // Low probability - aggressive recovery
      return { offer_type: 'recovery', offer_value: 30 }
    }
  }

  async getUserIntentHistory(link_id: string, user_identifier: string): Promise<IntentScore[]> {
    const result = await db.query(
      `SELECT * FROM intent_scores 
       WHERE link_id = $1 AND user_identifier = $2 
       ORDER BY created_at DESC LIMIT 10`,
      [link_id, user_identifier]
    )
    return result.rows
  }
}

export default new IntentService()
