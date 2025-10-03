-- ============= ICCI FREE TIKTOK DATABASE SCHEMA =============
-- Database completo per app TikTok-style con Supabase

-- ============= PROFILES TABLE =============
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    streams_count INTEGER DEFAULT 0,
    gems_balance INTEGER DEFAULT 100, -- Gems iniziali
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= STREAMS TABLE =============
CREATE TABLE IF NOT EXISTS streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[],
    thumbnail_url TEXT,
    stream_key TEXT UNIQUE NOT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    viewers_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    gifts_received INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= STREAM_VIEWERS TABLE =============
CREATE TABLE IF NOT EXISTS stream_viewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

-- ============= LIKES TABLE =============
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

-- ============= COMMENTS TABLE =============
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_gift BOOLEAN DEFAULT FALSE,
    gift_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= GIFTS TABLE =============
CREATE TABLE IF NOT EXISTS gifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gift_type TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    cost INTEGER NOT NULL,
    animation_type TEXT DEFAULT 'fly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= GIFT_TRANSACTIONS TABLE =============
CREATE TABLE IF NOT EXISTS gift_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    gift_id UUID REFERENCES gifts(id),
    quantity INTEGER DEFAULT 1,
    total_cost INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= GEM_TRANSACTIONS TABLE =============
CREATE TABLE IF NOT EXISTS gem_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positivo per acquisto, negativo per spesa
    transaction_type TEXT NOT NULL, -- 'purchase', 'gift_sent', 'gift_received'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= FOLLOWS TABLE =============
CREATE TABLE IF NOT EXISTS follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- ============= NOTIFICATIONS TABLE =============
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'like', 'comment', 'gift', 'follow', 'stream_start'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Dati aggiuntivi
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= CATEGORIES TABLE =============
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    color TEXT DEFAULT '#FFD700',
    streams_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= HASHTAGS TABLE =============
CREATE TABLE IF NOT EXISTS hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= STREAM_HASHTAGS TABLE =============
CREATE TABLE IF NOT EXISTS stream_hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, hashtag_id)
);

-- ============= INDEXES FOR PERFORMANCE =============
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_is_live ON streams(is_live);
CREATE INDEX IF NOT EXISTS idx_streams_category ON streams(category);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_likes_stream_id ON likes(stream_id);
CREATE INDEX IF NOT EXISTS idx_comments_stream_id ON comments(stream_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_stream_id ON gift_transactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============= ROW LEVEL SECURITY (RLS) =============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gem_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============= RLS POLICIES =============

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Streams: Public read, users can create/update own streams
CREATE POLICY "Streams are viewable by everyone" ON streams FOR SELECT USING (true);
CREATE POLICY "Users can create streams" ON streams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streams" ON streams FOR UPDATE USING (auth.uid() = user_id);

-- Stream viewers: Users can join/leave streams
CREATE POLICY "Users can view stream viewers" ON stream_viewers FOR SELECT USING (true);
CREATE POLICY "Users can join streams" ON stream_viewers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave streams" ON stream_viewers FOR DELETE USING (auth.uid() = user_id);

-- Likes: Users can like/unlike streams
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like streams" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike streams" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: Users can comment on streams
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can comment on streams" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gift transactions: Users can send gifts
CREATE POLICY "Gift transactions are viewable by everyone" ON gift_transactions FOR SELECT USING (true);
CREATE POLICY "Users can send gifts" ON gift_transactions FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Gem transactions: Users can view own transactions
CREATE POLICY "Users can view own gem transactions" ON gem_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create gem transactions" ON gem_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows: Users can follow/unfollow
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Notifications: Users can view own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============= FUNCTIONS =============

-- Function to update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update followers count
    UPDATE profiles 
    SET followers_count = (
        SELECT COUNT(*) FROM follows 
        WHERE following_id = NEW.following_id
    )
    WHERE id = NEW.following_id;
    
    -- Update following count
    UPDATE profiles 
    SET following_count = (
        SELECT COUNT(*) FROM follows 
        WHERE follower_id = NEW.follower_id
    )
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follows
CREATE TRIGGER update_follow_stats
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_stats();

-- Function to update stream stats
CREATE OR REPLACE FUNCTION update_stream_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update viewers count
    UPDATE streams 
    SET viewers_count = (
        SELECT COUNT(*) FROM stream_viewers 
        WHERE stream_id = NEW.stream_id
    )
    WHERE id = NEW.stream_id;
    
    -- Update likes count
    UPDATE streams 
    SET likes_count = (
        SELECT COUNT(*) FROM likes 
        WHERE stream_id = NEW.stream_id
    )
    WHERE id = NEW.stream_id;
    
    -- Update comments count
    UPDATE streams 
    SET comments_count = (
        SELECT COUNT(*) FROM comments 
        WHERE stream_id = NEW.stream_id
    )
    WHERE id = NEW.stream_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for stream stats
CREATE TRIGGER update_stream_viewers_count
    AFTER INSERT OR DELETE ON stream_viewers
    FOR EACH ROW
    EXECUTE FUNCTION update_stream_stats();

CREATE TRIGGER update_stream_likes_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_stream_stats();

CREATE TRIGGER update_stream_comments_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_stream_stats();

-- ============= INITIAL DATA =============

-- Insert default gifts
INSERT INTO gifts (gift_type, name, icon, cost, animation_type) VALUES
('rose', 'Rose', '🌹', 10, 'fly'),
('heart', 'Heart', '❤️', 20, 'fly'),
('fire', 'Fire', '🔥', 50, 'fly'),
('crown', 'Crown', '👑', 100, 'fly'),
('diamond', 'Diamond', '💎', 200, 'fly'),
('rocket', 'Rocket', '🚀', 500, 'fly')
ON CONFLICT DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, icon, color) VALUES
('Gaming', '🎮', '#FF6B6B'),
('Musica', '🎵', '#4ECDC4'),
('Talk', '💬', '#45B7D1'),
('Arte', '🎨', '#96CEB4'),
('Sport', '⚽', '#FFEAA7'),
('Cucina', '🍳', '#DDA0DD')
ON CONFLICT DO NOTHING;

-- Insert default hashtags
INSERT INTO hashtags (tag, usage_count, is_trending) VALUES
('gaming', 0, true),
('music', 0, true),
('justchatting', 0, true),
('art', 0, true),
('cooking', 0, true),
('live', 0, true)
ON CONFLICT DO NOTHING;