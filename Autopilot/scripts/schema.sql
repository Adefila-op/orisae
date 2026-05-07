-- Autopilot Database Schema
-- PostgreSQL 14+
-- Generated: May 7, 2026

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS / CREATORS
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Profile Info
  wallet_address VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  username VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  
  -- Metrics
  total_sales NUMERIC(15,2) DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  
  -- Agent Settings
  agent_enabled BOOLEAN DEFAULT true,
  agent_last_run_at TIMESTAMP,
  agent_last_run_stats JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  
  CONSTRAINT email_or_wallet CHECK (email IS NOT NULL OR wallet_address IS NOT NULL)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT,
  price NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  category VARCHAR(100),
  platform VARCHAR(100), -- gumroad, lemonsqueezy, etsy, etc
  platform_product_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_creator_id ON products(creator_id);
CREATE INDEX idx_products_platform ON products(platform);

-- ============================================================================
-- SMART LINKS / TRACKED LINKS
-- ============================================================================

CREATE TABLE smart_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Link Info
  code VARCHAR(50) UNIQUE NOT NULL,
  short_url VARCHAR(255),
  target_url TEXT NOT NULL,
  original_url TEXT,
  
  -- Platform & Offer
  platform VARCHAR(100),
  offer_type VARCHAR(50) DEFAULT 'recovery', -- recovery, discount, bundle, upsell
  offer_value NUMERIC(5,2), -- discount % or fixed amount
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  
  -- Metrics
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  total_value NUMERIC(15,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_smart_links_creator_id ON smart_links(creator_id);
CREATE INDEX idx_smart_links_code ON smart_links(code);
CREATE INDEX idx_smart_links_product_id ON smart_links(product_id);

-- ============================================================================
-- USER EVENTS
-- ============================================================================

CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES smart_links(id) ON DELETE CASCADE,
  
  user_address VARCHAR(255), -- email, wallet, or anon identifier
  event_type VARCHAR(50) NOT NULL, -- click, view, conversion, abandoned
  
  -- Event Context
  referrer TEXT,
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_medium VARCHAR(100),
  
  -- Device Info
  device_type VARCHAR(50), -- mobile, tablet, desktop
  browser_info JSONB,
  
  -- Intent Signals
  intent_signals JSONB, -- custom signals for scoring
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_events_link_id ON user_events(link_id);
CREATE INDEX idx_user_events_user_address ON user_events(user_address);
CREATE INDEX idx_user_events_created_at ON user_events(created_at);
CREATE INDEX idx_user_events_event_type ON user_events(event_type);

-- ============================================================================
-- INTENT SCORES
-- ============================================================================

CREATE TABLE intent_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES smart_links(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255) NOT NULL,
  
  -- Score Components
  engagement_score INTEGER,
  price_sensitivity_score INTEGER,
  urgency_score INTEGER,
  
  -- Final Score
  purchase_probability INTEGER,
  intent_band VARCHAR(20), -- high, medium, low
  
  -- Recommendation
  recommended_offer_type VARCHAR(50),
  recommended_offer_value NUMERIC(5,2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(link_id, user_identifier)
);

CREATE INDEX idx_intent_scores_link_id ON intent_scores(link_id);
CREATE INDEX idx_intent_scores_user_identifier ON intent_scores(user_identifier);
CREATE INDEX idx_intent_scores_purchase_probability ON intent_scores(purchase_probability);

-- ============================================================================
-- OFFERS
-- ============================================================================

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES smart_links(id) ON DELETE CASCADE,
  intent_score_id UUID REFERENCES intent_scores(id) ON DELETE SET NULL,
  
  -- Offer Details
  offer_type VARCHAR(50) NOT NULL,
  discount_percent NUMERIC(5,2),
  offer_text TEXT,
  
  -- Status
  is_accepted BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  
  -- Decision Info
  decision_rationale JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_offers_link_id ON offers(link_id);
CREATE INDEX idx_offers_expires_at ON offers(expires_at);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(100) NOT NULL, -- conversion, abandoned_cart, new_lead, offer_accepted
  title VARCHAR(255),
  message TEXT,
  data JSONB,
  
  -- Status
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================================================
-- EMAIL QUEUE
-- ============================================================================

CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  
  recipient_email VARCHAR(255) NOT NULL,
  template VARCHAR(100), -- conversion_notification, abandoned_cart, offer_alert, etc
  data JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, bounced
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at);

-- ============================================================================
-- INTEGRATIONS
-- ============================================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  provider VARCHAR(100) NOT NULL, -- gmail, notion, airtable, gumroad, etc
  provider_account_id VARCHAR(255),
  
  -- Connection
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP,
  sync_status VARCHAR(50), -- synced, pending, error
  
  -- Config
  settings JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);

-- ============================================================================
-- AGENT RUN LOGS
-- ============================================================================

CREATE TABLE agent_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Run Details
  run_number INTEGER,
  duration_ms INTEGER,
  
  -- Stats
  creators_processed INTEGER DEFAULT 0,
  links_processed INTEGER DEFAULT 0,
  users_scored INTEGER DEFAULT 0,
  offers_created INTEGER DEFAULT 0,
  emails_queued INTEGER DEFAULT 0,
  
  -- Results
  result JSONB, -- detailed results
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_run_logs_creator_id ON agent_run_logs(creator_id);
CREATE INDEX idx_agent_run_logs_created_at ON agent_run_logs(created_at);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  
  old_value JSONB,
  new_value JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_links_updated_at BEFORE UPDATE ON smart_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intent_scores_updated_at BEFORE UPDATE ON intent_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS (Optional, for easier querying)
-- ============================================================================

-- Creator Dashboard Summary
CREATE VIEW creator_dashboard AS
SELECT 
  u.id,
  u.display_name,
  u.email,
  COUNT(DISTINCT sl.id) as total_links,
  SUM(sl.click_count) as total_clicks,
  SUM(sl.conversion_count) as total_conversions,
  SUM(sl.total_value) as total_revenue,
  u.total_sales,
  u.agent_enabled,
  u.agent_last_run_at
FROM users u
LEFT JOIN smart_links sl ON sl.creator_id = u.id
GROUP BY u.id;

-- Link Performance
CREATE VIEW link_performance AS
SELECT 
  sl.id,
  sl.code,
  sl.creator_id,
  sl.platform,
  sl.click_count,
  sl.conversion_count,
  CASE 
    WHEN sl.click_count = 0 THEN 0
    ELSE ROUND((sl.conversion_count::NUMERIC / sl.click_count) * 100, 2)
  END as conversion_rate,
  sl.total_value,
  CASE
    WHEN sl.conversion_count = 0 THEN 0
    ELSE ROUND(sl.total_value / sl.conversion_count, 2)
  END as average_order_value
FROM smart_links sl;

-- Recent Events Summary
CREATE VIEW recent_events_summary AS
SELECT 
  sl.id as link_id,
  sl.code,
  ue.event_type,
  COUNT(*) as count,
  MAX(ue.created_at) as last_event
FROM smart_links sl
LEFT JOIN user_events ue ON ue.link_id = sl.id
WHERE ue.created_at > NOW() - INTERVAL '24 hours'
GROUP BY sl.id, sl.code, ue.event_type;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data

/*
INSERT INTO users (wallet_address, display_name, username, email) VALUES
  ('0x1234567890abcdef', 'John Creator', 'johncreator', 'john@example.com'),
  ('0xabcdefg1234567890', 'Jane Designer', 'janedesigner', 'jane@example.com');

INSERT INTO products (creator_id, title, description, url, price, platform) VALUES
  ((SELECT id FROM users WHERE username = 'johncreator'), 'Design Masterclass', 'Learn professional design', 'https://gumroad.com/l/design', 49.99, 'gumroad'),
  ((SELECT id FROM users WHERE username = 'johncreator'), 'Template Pack', 'Ready-to-use templates', 'https://gumroad.com/l/templates', 29.99, 'gumroad');

INSERT INTO smart_links (creator_id, product_id, code, target_url, platform, offer_type, offer_value, enabled) VALUES
  ((SELECT id FROM users WHERE username = 'johncreator'), (SELECT id FROM products WHERE title = 'Design Masterclass'), 'dsn-abc123', 'https://gumroad.com/l/design', 'gumroad', 'recovery', 10, true),
  ((SELECT id FROM users WHERE username = 'johncreator'), (SELECT id FROM products WHERE title = 'Template Pack'), 'tpl-xyz789', 'https://gumroad.com/l/templates', 'gumroad', 'discount', 15, true);
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
