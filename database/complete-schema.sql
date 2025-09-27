-- ============================================
-- ICCI FREE - COMPLETE DATABASE SCHEMA
-- ============================================
-- This file contains ALL tables needed for the ICCI FREE platform
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MAIN APPLICATION TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    location TEXT,
    website TEXT,
    twitter TEXT,
    instagram TEXT,
    youtube TEXT,
    twitch TEXT,
    is_streamer BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    follower_count BIGINT DEFAULT 0,
    following_count BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[],
    thumbnail_url TEXT,
    is_live BOOLEAN DEFAULT false,
    viewer_count INT DEFAULT 0,
    max_viewers INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    offer TEXT,
    answer TEXT,
    ice_candidates TEXT[],
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (chat)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'gift', 'system')),
    gift_id TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Stream views table (for analytics)
CREATE TABLE IF NOT EXISTS stream_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GIFT SYSTEM TABLES
-- ============================================

-- User gems table
CREATE TABLE IF NOT EXISTS user_gems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    balance BIGINT DEFAULT 0 CHECK (balance >= 0),
    lifetime_earned BIGINT DEFAULT 0,
    lifetime_spent BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Gift transactions table
CREATE TABLE IF NOT EXISTS gift_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_id TEXT NOT NULL,
    stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
    from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    gems_amount BIGINT NOT NULL CHECK (gems_amount > 0),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Gem purchases table
CREATE TABLE IF NOT EXISTS gem_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Gem withdrawals table (for streamers)
CREATE TABLE IF NOT EXISTS gem_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_streamer ON profiles(is_streamer);

-- Streams indexes
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_is_live ON streams(is_live);
CREATE INDEX IF NOT EXISTS idx_streams_created_at ON streams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streams_category ON streams(category);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_stream_id ON messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Stream views indexes
CREATE INDEX IF NOT EXISTS idx_stream_views_stream_id ON stream_views(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_views_user_id ON stream_views(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_views_created_at ON stream_views(created_at DESC);

-- Gift system indexes
CREATE INDEX IF NOT EXISTS idx_user_gems_user_id ON user_gems(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_from_user ON gift_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_to_user ON gift_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_stream ON gift_transactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_created_at ON gift_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gem_purchases_user_id ON gem_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_gem_purchases_status ON gem_purchases(status);
CREATE INDEX IF NOT EXISTS idx_gem_withdrawals_user_id ON gem_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_gem_withdrawals_status ON gem_withdrawals(status);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function to add ICE candidate to stream
CREATE OR REPLACE FUNCTION add_ice_candidate(
    stream_id_param UUID,
    candidate_param TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE streams
    SET ice_candidates = array_append(ice_candidates, candidate_param)
    WHERE id = stream_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stream viewer count
CREATE OR REPLACE FUNCTION update_stream_viewer_count(
    stream_id_param UUID,
    viewer_count_param INT
)
RETURNS VOID AS $$
BEGIN
    UPDATE streams
    SET 
        viewer_count = viewer_count_param,
        max_viewers = GREATEST(max_viewers, viewer_count_param),
        updated_at = NOW()
    WHERE id = stream_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gems ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gem_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE gem_withdrawals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Streams policies
CREATE POLICY "Streams are viewable by everyone" ON streams
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own streams" ON streams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streams" ON streams
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own streams" ON streams
    FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Messages are viewable by everyone" ON messages
    FOR SELECT USING (true);

CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own follows" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Stream views policies
CREATE POLICY "Stream views are insertable by everyone" ON stream_views
    FOR INSERT WITH CHECK (true);

-- Gift system policies
CREATE POLICY "Users can view own gems" ON user_gems
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their gift transactions" ON gift_transactions
    FOR SELECT USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id
    );

CREATE POLICY "Users can insert gift transactions" ON gift_transactions
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view own purchases" ON gem_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON gem_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own withdrawals" ON gem_withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON gem_withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp on profiles update
CREATE OR REPLACE FUNCTION update_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_timestamp();

-- Update timestamp on streams update
CREATE OR REPLACE FUNCTION update_streams_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER streams_updated
    BEFORE UPDATE ON streams
    FOR EACH ROW
    EXECUTE FUNCTION update_streams_timestamp();

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

-- Live streams view
CREATE OR REPLACE VIEW live_streams AS
SELECT 
    s.*,
    p.username,
    p.display_name,
    p.avatar_url
FROM streams s
JOIN profiles p ON s.user_id = p.id
WHERE s.is_live = true
ORDER BY s.viewer_count DESC, s.started_at DESC;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION add_ice_candidate TO authenticated;
GRANT EXECUTE ON FUNCTION update_stream_viewer_count TO authenticated;
GRANT EXECUTE ON FUNCTION add_gems_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_gems_from_user TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_gems TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_gift_stats TO authenticated;

-- ============================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- ============================================

-- Create storage buckets (run these in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies (run these after creating buckets)
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Thumbnail images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
-- CREATE POLICY "Users can upload own thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update own thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ ICCI FREE Complete Database Schema Created Successfully!';
    RAISE NOTICE '👥 Main Tables: profiles, streams, messages, follows, stream_views';
    RAISE NOTICE '💎 Gift Tables: user_gems, gift_transactions, gem_purchases, gem_withdrawals';
    RAISE NOTICE '⚡ Functions: 6 RPC functions created';
    RAISE NOTICE '🔒 RLS Policies: Enabled and configured for all tables';
    RAISE NOTICE '📊 Views: top_gifters, top_receivers, live_streams';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '   1. Create storage buckets (avatars, thumbnails)';
    RAISE NOTICE '   2. Configure OAuth providers in Authentication';
    RAISE NOTICE '   3. Update your app with correct Supabase credentials';
    RAISE NOTICE '   4. Test the application!';
END $$;
