-- Autopilot Database Schema
-- PostgreSQL migration for link tracking, intent scoring, and notification system

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  username VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  is_creator BOOLEAN DEFAULT false,
  total_sales DECIMAL(18, 8) DEFAULT 0,
  total_conversions INT DEFAULT 0,
  intent_score DECIMAL(5, 2) DEFAULT 0,
  subscribed_to_notifications BOOLEAN DEFAULT true,
  agent_enabled BOOLEAN DEFAULT true,
  agent_last_run_at TIMESTAMP,
  agent_last_run_stats JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(18, 8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  category VARCHAR(100),
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Smart Links Table (Core Link Tracking)
CREATE TABLE IF NOT EXISTS smart_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  short_url TEXT,
  target_url TEXT,
  original_url TEXT, -- Original product URL from platform
  platform VARCHAR(100), -- gumroad, stripe, shopify, paypal, custom, etc.
  offer_type VARCHAR(50) DEFAULT 'recovery', -- recovery, discount, upsell, bundle
  offer_value DECIMAL(5, 2) DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  click_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  total_value DECIMAL(18, 8) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Behaviors & Click Events
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES smart_links(id) ON DELETE CASCADE,
  user_address VARCHAR(255),
  event_type VARCHAR(50) DEFAULT 'click', -- click, view, conversion, abandoned
  browser_info JSONB,
  device_type VARCHAR(50),
  ip_address INET,
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_medium VARCHAR(100),
  intent_signals JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Intent Scoring System
CREATE TABLE IF NOT EXISTS intent_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES smart_links(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255), -- wallet, IP, or anonymous ID
  engagement_score DECIMAL(5, 2) DEFAULT 0, -- 0-100: page time, scroll depth
  price_sensitivity DECIMAL(5, 2) DEFAULT 0, -- 0-100: price check frequency
  urgency_score DECIMAL(5, 2) DEFAULT 0, -- 0-100: repeat visits, time decay
  purchase_probability DECIMAL(5, 2) DEFAULT 0, -- 0-100: overall conversion likelihood
  recommended_offer_type VARCHAR(50),
  recommended_offer_value DECIMAL(5, 2),
  last_evaluated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Offers & Agent Decisions Table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES smart_links(id) ON DELETE CASCADE,
  intent_score_id UUID REFERENCES intent_scores(id) ON DELETE SET NULL,
  offer_type VARCHAR(50) NOT NULL, -- discount, upsell, bundle, waitlist
  discount_percent DECIMAL(5, 2),
  offer_text VARCHAR(500),
  expires_at TIMESTAMP,
  is_accepted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(18, 8),
  decision_rationale JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- conversion, abandoned_cart, new_lead, offer_accepted
  title VARCHAR(255),
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP
);

-- Email Queue for BullMQ
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  template VARCHAR(50), -- conversion_notification, offer_alert, daily_digest
  data JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, bounced
  retry_count INT DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Creator Integrations
CREATE TABLE IF NOT EXISTS creator_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  sync_mode VARCHAR(50) NOT NULL DEFAULT 'api',
  status VARCHAR(50) NOT NULL DEFAULT 'planned', -- planned, connected, attention
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  last_synced_at TIMESTAMP,
  last_sync_summary JSONB DEFAULT '{}',
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (creator_id, provider)
);

-- Analytics & Aggregates
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_clicks INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  total_value DECIMAL(18, 8) DEFAULT 0,
  avg_intent_score DECIMAL(5, 2) DEFAULT 0,
  top_offer_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_creator ON users(is_creator);
CREATE INDEX IF NOT EXISTS idx_products_creator ON products(creator_id);
CREATE INDEX IF NOT EXISTS idx_smart_links_creator ON smart_links(creator_id);
CREATE INDEX IF NOT EXISTS idx_smart_links_code ON smart_links(code);
CREATE INDEX IF NOT EXISTS idx_smart_links_platform ON smart_links(platform);
CREATE INDEX IF NOT EXISTS idx_smart_links_enabled ON smart_links(enabled);
CREATE INDEX IF NOT EXISTS idx_user_events_link ON user_events(link_id);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at);
CREATE INDEX IF NOT EXISTS idx_intent_scores_link ON intent_scores(link_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_intent_scores_link_user ON intent_scores(link_id, user_identifier);
CREATE INDEX IF NOT EXISTS idx_offers_link ON offers(link_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_creator_integrations_creator ON creator_integrations(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_integrations_provider ON creator_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_creator ON daily_analytics(creator_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_analytics_creator_date ON daily_analytics(creator_id, date);
