-- ============================================
-- ICCI FREE - GIFT SYSTEM DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER GEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_gems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance BIGINT DEFAULT 0 CHECK (balance >= 0),
    lifetime_earned BIGINT DEFAULT 0,
    lifetime_spent BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_gems_user_id ON user_gems(user_id);

-- ============================================
-- GIFT TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS gift_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_id TEXT NOT NULL,
    stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gems_amount BIGINT NOT NULL CHECK (gems_amount > 0),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Indexes for queries
CREATE INDEX idx_gift_transactions_from_user ON gift_transactions(from_user_id);
CREATE INDEX idx_gift_transactions_to_user ON gift_transactions(to_user_id);
CREATE INDEX idx_gift_transactions_stream ON gift_transactions(stream_id);
CREATE INDEX idx_gift_transactions_created_at ON gift_transactions(created_at DESC);

-- ============================================
-- GEM PURCHASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS gem_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id TEXT NOT NULL,
    gems_amount BIGINT NOT NULL,
    price_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'stripe', 'apple_pay', 'google_pay')),
    payment_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Indexes
CREATE INDEX idx_gem_purchases_user_id ON gem_purchases(user_id);
CREATE INDEX idx_gem_purchases_status ON gem_purchases(status);
CREATE INDEX idx_gem_purchases_created_at ON gem_purchases(created_at DESC);

-- ============================================
-- GEM WITHDRAWALS TABLE (for streamers)
-- ============================================

CREATE TABLE IF NOT EXISTS gem_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gems_amount BIGINT NOT NULL CHECK (gems_amount > 0),
    money_amount DECIMAL(10, 2) NOT NULL CHECK (money_amount > 0),
    currency TEXT DEFAULT 'EUR',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'bank_transfer', 'stripe')),
    payment_details JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB
);

-- Indexes
CREATE INDEX idx_gem_withdrawals_user_id ON gem_withdrawals(user_id);
CREATE INDEX idx_gem_withdrawals_status ON gem_withdrawals(status);
CREATE INDEX idx_gem_withdrawals_requested_at ON gem_withdrawals(requested_at DESC);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function to add gems to user
CREATE OR REPLACE FUNCTION add_gems_to_user(
    user_id_param UUID,
    gems_amount_param BIGINT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_gems (user_id, balance, lifetime_earned)
    VALUES (user_id_param, gems_amount_param, gems_amount_param)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = user_gems.balance + gems_amount_param,
        lifetime_earned = user_gems.lifetime_earned + gems_amount_param,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct gems from user
CREATE OR REPLACE FUNCTION deduct_gems_from_user(
    user_id_param UUID,
    gems_amount_param BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance BIGINT;
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance
    FROM user_gems
    WHERE user_id = user_id_param;
    
    -- Check if user has enough gems
    IF current_balance IS NULL OR current_balance < gems_amount_param THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct gems
    UPDATE user_gems
    SET 
        balance = balance - gems_amount_param,
        lifetime_spent = lifetime_spent + gems_amount_param,
        updated_at = NOW()
    WHERE user_id = user_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer gems (send gift)
CREATE OR REPLACE FUNCTION transfer_gems(
    from_user_id_param UUID,
    to_user_id_param UUID,
    gems_amount_param BIGINT,
    gift_id_param TEXT,
    stream_id_param UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    deduction_success BOOLEAN;
    transaction_id UUID;
BEGIN
    -- Deduct from sender
    deduction_success := deduct_gems_from_user(from_user_id_param, gems_amount_param);
    
    IF NOT deduction_success THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient gems'
        );
    END IF;
    
    -- Add to receiver
    PERFORM add_gems_to_user(to_user_id_param, gems_amount_param);
    
    -- Record transaction
    INSERT INTO gift_transactions (
        gift_id,
        stream_id,
        from_user_id,
        to_user_id,
        gems_amount,
        status
    ) VALUES (
        gift_id_param,
        stream_id_param,
        from_user_id_param,
        to_user_id_param,
        gems_amount_param,
        'completed'
    ) RETURNING id INTO transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', transaction_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete gem purchase
CREATE OR REPLACE FUNCTION complete_gem_purchase(
    purchase_id_param UUID,
    payment_id_param TEXT
)
RETURNS VOID AS $$
DECLARE
    purchase_record RECORD;
BEGIN
    -- Get purchase details
    SELECT * INTO purchase_record
    FROM gem_purchases
    WHERE id = purchase_id_param;
    
    -- Update purchase status
    UPDATE gem_purchases
    SET 
        status = 'completed',
        payment_id = payment_id_param,
        completed_at = NOW()
    WHERE id = purchase_id_param;
    
    -- Add gems to user
    PERFORM add_gems_to_user(purchase_record.user_id, purchase_record.gems_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create PayPal order
CREATE OR REPLACE FUNCTION create_paypal_order(
    user_id_param UUID,
    gems_amount BIGINT,
    price_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
    purchase_id UUID;
BEGIN
    INSERT INTO gem_purchases (
        user_id,
        package_id,
        gems_amount,
        price_amount,
        payment_method,
        status
    ) VALUES (
        user_id_param,
        'custom',
        gems_amount,
        price_amount,
        'paypal',
        'pending'
    ) RETURNING id INTO purchase_id;
    
    RETURN purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create Stripe session
CREATE OR REPLACE FUNCTION create_stripe_session(
    user_id_param UUID,
    gems_amount BIGINT,
    price_amount DECIMAL
)
RETURNS JSONB AS $$
DECLARE
    purchase_id UUID;
BEGIN
    INSERT INTO gem_purchases (
        user_id,
        package_id,
        gems_amount,
        price_amount,
        payment_method,
        status
    ) VALUES (
        user_id_param,
        'custom',
        gems_amount,
        price_amount,
        'stripe',
        'pending'
    ) RETURNING id INTO purchase_id;
    
    RETURN jsonb_build_object(
        'purchase_id', purchase_id,
        'session_id', 'stripe_session_' || purchase_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user gift stats
CREATE OR REPLACE FUNCTION get_user_gift_stats(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_received', COALESCE(SUM(CASE WHEN to_user_id = user_id_param THEN gems_amount ELSE 0 END), 0),
        'total_sent', COALESCE(SUM(CASE WHEN from_user_id = user_id_param THEN gems_amount ELSE 0 END), 0),
        'gift_count_received', COUNT(CASE WHEN to_user_id = user_id_param THEN 1 END),
        'gift_count_sent', COUNT(CASE WHEN from_user_id = user_id_param THEN 1 END),
        'top_gift_received', (
            SELECT gift_id 
            FROM gift_transactions 
            WHERE to_user_id = user_id_param 
            GROUP BY gift_id 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        )
    ) INTO stats
    FROM gift_transactions
    WHERE from_user_id = user_id_param OR to_user_id = user_id_param;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_gems ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gem_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE gem_withdrawals ENABLE ROW LEVEL SECURITY;

-- user_gems policies
CREATE POLICY "Users can view own gems" ON user_gems
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gems" ON user_gems
    FOR UPDATE USING (auth.uid() = user_id);

-- gift_transactions policies
CREATE POLICY "Users can view their gift transactions" ON gift_transactions
    FOR SELECT USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id
    );

CREATE POLICY "Users can insert gift transactions" ON gift_transactions
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- gem_purchases policies
CREATE POLICY "Users can view own purchases" ON gem_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON gem_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- gem_withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON gem_withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON gem_withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp on user_gems update
CREATE OR REPLACE FUNCTION update_user_gems_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_gems_updated
    BEFORE UPDATE ON user_gems
    FOR EACH ROW
    EXECUTE FUNCTION update_user_gems_timestamp();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_gift_trans_stream_created ON gift_transactions(stream_id, created_at DESC);
CREATE INDEX idx_gift_trans_user_created ON gift_transactions(to_user_id, created_at DESC);

-- ============================================
-- VIEWS
-- ============================================

-- Top gifters view
CREATE OR REPLACE VIEW top_gifters AS
SELECT 
    from_user_id as user_id,
    COUNT(*) as gift_count,
    SUM(gems_amount) as total_gems_sent,
    MAX(created_at) as last_gift_at
FROM gift_transactions
WHERE status = 'completed'
GROUP BY from_user_id
ORDER BY total_gems_sent DESC;

-- Top receivers view
CREATE OR REPLACE VIEW top_receivers AS
SELECT 
    to_user_id as user_id,
    COUNT(*) as gift_count,
    SUM(gems_amount) as total_gems_received,
    MAX(created_at) as last_gift_at
FROM gift_transactions
WHERE status = 'completed'
GROUP BY to_user_id
ORDER BY total_gems_received DESC;

-- Daily gem stats view
CREATE OR REPLACE VIEW daily_gem_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as transaction_count,
    SUM(gems_amount) as total_gems,
    COUNT(DISTINCT from_user_id) as unique_senders,
    COUNT(DISTINCT to_user_id) as unique_receivers
FROM gift_transactions
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION add_gems_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_gems_from_user TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_gems TO authenticated;
GRANT EXECUTE ON FUNCTION complete_gem_purchase TO authenticated;
GRANT EXECUTE ON FUNCTION create_paypal_order TO authenticated;
GRANT EXECUTE ON FUNCTION create_stripe_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_gift_stats TO authenticated;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Gift System Database Schema Created Successfully!';
    RAISE NOTICE '💎 Tables: user_gems, gift_transactions, gem_purchases, gem_withdrawals';
    RAISE NOTICE '⚡ Functions: 7 RPC functions created';
    RAISE NOTICE '🔒 RLS Policies: Enabled and configured';
    RAISE NOTICE '📊 Views: top_gifters, top_receivers, daily_gem_stats';
END $$;
