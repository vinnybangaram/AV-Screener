-- AV Screener V4 Commercial Fintech Schema
-- Database: Supabase PostgreSQL

-- 1. SUBSCRIPTIONS & MONETIZATION
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- FREE, PRO, ELITE
    price_id VARCHAR(255), -- Razorpay Price ID
    amount_paISE INTEGER NOT NULL,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    plan_id INTEGER REFERENCES plans(id),
    status VARCHAR(50) NOT NULL, -- active, past_due, cancelled
    razorpay_sub_id VARCHAR(255),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent INTEGER,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. REFERRAL SYSTEM
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id VARCHAR(255) NOT NULL,
    referred_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, REWARDED
    reward_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PORTFOLIO & ASSETS
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(255) NOT NULL,
    quantity DECIMAL NOT NULL,
    avg_price DECIMAL NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI INSIGHTS & SIGNALS
CREATE TABLE IF NOT EXISTS ai_stock_insights (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(255) NOT NULL,
    insight_type VARCHAR(100), -- SENTIMENT, FUNDAMENTAL, TECHNICAL
    score INTEGER,
    explanation TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ANALYTICS & ENGAGEMENT
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL, -- PAGE_VIEW, SCREENER_RUN, TRADE_SIGNAL
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. MARKET OPERATIONS
CREATE TABLE IF NOT EXISTS market_holidays (
    id SERIAL PRIMARY KEY,
    holiday_date DATE UNIQUE NOT NULL,
    description VARCHAR(255),
    exchange VARCHAR(50) DEFAULT 'NSE'
);

-- 7. QUALITY & ANOMALIES
CREATE TABLE IF NOT EXISTS data_anomalies (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(255) NOT NULL,
    anomaly_type VARCHAR(100), -- OHLC_GAP, VOL_SPIKE_SUSPICIOUS
    severity VARCHAR(50), -- LOW, HIGH, CRITICAL
    details JSONB,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for V4 Performance
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_symbol ON ai_stock_insights(symbol);
CREATE INDEX IF NOT EXISTS idx_activity_event ON user_activity_logs(event_type);
