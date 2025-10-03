-- ============= SUPABASE FUNCTIONS FOR TIKTOK APP =============
-- Funzioni complete per tutte le operazioni dell'app

-- ============= STREAM FUNCTIONS =============

-- Get live streams with user info
CREATE OR REPLACE FUNCTION get_live_streams(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    stream_id UUID,
    user_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    thumbnail_url TEXT,
    viewers_count INTEGER,
    likes_count INTEGER,
    comments_count INTEGER,
    gifts_received INTEGER,
    started_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as stream_id,
        s.user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        s.title,
        s.description,
        s.category,
        s.tags,
        s.thumbnail_url,
        s.viewers_count,
        s.likes_count,
        s.comments_count,
        s.gifts_received,
        s.started_at
    FROM streams s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.is_live = true
    ORDER BY s.viewers_count DESC, s.started_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get stream by ID with full info
CREATE OR REPLACE FUNCTION get_stream_by_id(stream_uuid UUID)
RETURNS TABLE (
    stream_id UUID,
    user_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    thumbnail_url TEXT,
    is_live BOOLEAN,
    viewers_count INTEGER,
    likes_count INTEGER,
    comments_count INTEGER,
    gifts_received INTEGER,
    started_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as stream_id,
        s.user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        s.title,
        s.description,
        s.category,
        s.tags,
        s.thumbnail_url,
        s.is_live,
        s.viewers_count,
        s.likes_count,
        s.comments_count,
        s.gifts_received,
        s.started_at
    FROM streams s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.id = stream_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Start a new stream
CREATE OR REPLACE FUNCTION start_stream(
    stream_title TEXT,
    stream_description TEXT DEFAULT NULL,
    stream_category TEXT DEFAULT NULL,
    stream_tags TEXT[] DEFAULT NULL,
    stream_thumbnail_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_stream_id UUID;
    user_profile profiles%ROWTYPE;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
    
    IF user_profile IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    -- Create stream
    INSERT INTO streams (
        user_id,
        title,
        description,
        category,
        tags,
        thumbnail_url,
        stream_key,
        is_live,
        started_at
    ) VALUES (
        auth.uid(),
        stream_title,
        stream_description,
        stream_category,
        stream_tags,
        stream_thumbnail_url,
        gen_random_uuid()::TEXT,
        true,
        NOW()
    ) RETURNING id INTO new_stream_id;
    
    -- Update user's streams count
    UPDATE profiles 
    SET streams_count = streams_count + 1 
    WHERE id = auth.uid();
    
    RETURN new_stream_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- End a stream
CREATE OR REPLACE FUNCTION end_stream(stream_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE streams 
    SET is_live = false, ended_at = NOW()
    WHERE id = stream_uuid AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= INTERACTION FUNCTIONS =============

-- Like/Unlike a stream
CREATE OR REPLACE FUNCTION toggle_like(stream_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    like_exists BOOLEAN;
BEGIN
    -- Check if like exists
    SELECT EXISTS(
        SELECT 1 FROM likes 
        WHERE stream_id = stream_uuid AND user_id = auth.uid()
    ) INTO like_exists;
    
    IF like_exists THEN
        -- Remove like
        DELETE FROM likes 
        WHERE stream_id = stream_uuid AND user_id = auth.uid();
        RETURN false;
    ELSE
        -- Add like
        INSERT INTO likes (stream_id, user_id) 
        VALUES (stream_uuid, auth.uid());
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to stream
CREATE OR REPLACE FUNCTION add_comment(
    stream_uuid UUID,
    comment_message TEXT,
    is_gift_comment BOOLEAN DEFAULT false,
    gift_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_comment_id UUID;
BEGIN
    INSERT INTO comments (
        stream_id,
        user_id,
        message,
        is_gift,
        gift_type
    ) VALUES (
        stream_uuid,
        auth.uid(),
        comment_message,
        is_gift_comment,
        gift_type
    ) RETURNING id INTO new_comment_id;
    
    RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get stream comments
CREATE OR REPLACE FUNCTION get_stream_comments(
    stream_uuid UUID,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    comment_id UUID,
    user_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    message TEXT,
    is_gift BOOLEAN,
    gift_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as comment_id,
        c.user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        c.message,
        c.is_gift,
        c.gift_type,
        c.created_at
    FROM comments c
    JOIN profiles p ON c.user_id = p.id
    WHERE c.stream_id = stream_uuid
    ORDER BY c.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= GIFT FUNCTIONS =============

-- Send gift to stream
CREATE OR REPLACE FUNCTION send_gift(
    stream_uuid UUID,
    gift_type_param TEXT,
    quantity_param INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    gift_info gifts%ROWTYPE;
    stream_owner_id UUID;
    total_cost INTEGER;
    user_gems INTEGER;
BEGIN
    -- Get gift info
    SELECT * INTO gift_info FROM gifts WHERE gift_type = gift_type_param;
    
    IF gift_info IS NULL THEN
        RAISE EXCEPTION 'Gift type not found';
    END IF;
    
    -- Get stream owner
    SELECT user_id INTO stream_owner_id FROM streams WHERE id = stream_uuid;
    
    IF stream_owner_id IS NULL THEN
        RAISE EXCEPTION 'Stream not found';
    END IF;
    
    -- Calculate total cost
    total_cost := gift_info.cost * quantity_param;
    
    -- Check user gems
    SELECT gems_balance INTO user_gems FROM profiles WHERE id = auth.uid();
    
    IF user_gems < total_cost THEN
        RAISE EXCEPTION 'Insufficient gems';
    END IF;
    
    -- Deduct gems from sender
    UPDATE profiles 
    SET gems_balance = gems_balance - total_cost 
    WHERE id = auth.uid();
    
    -- Add gems to receiver
    UPDATE profiles 
    SET gems_balance = gems_balance + total_cost 
    WHERE id = stream_owner_id;
    
    -- Record gift transaction
    INSERT INTO gift_transactions (
        sender_id,
        receiver_id,
        stream_id,
        gift_id,
        quantity,
        total_cost
    ) VALUES (
        auth.uid(),
        stream_owner_id,
        stream_uuid,
        gift_info.id,
        quantity_param,
        total_cost
    );
    
    -- Add comment about gift
    INSERT INTO comments (
        stream_id,
        user_id,
        message,
        is_gift,
        gift_type
    ) VALUES (
        stream_uuid,
        auth.uid(),
        'Sent ' || quantity_param || 'x ' || gift_info.name || '!',
        true,
        gift_type_param
    );
    
    -- Update stream gifts received
    UPDATE streams 
    SET gifts_received = gifts_received + total_cost 
    WHERE id = stream_uuid;
    
    -- Record gem transactions
    INSERT INTO gem_transactions (user_id, amount, transaction_type, description) 
    VALUES (auth.uid(), -total_cost, 'gift_sent', 'Sent ' || gift_info.name);
    
    INSERT INTO gem_transactions (user_id, amount, transaction_type, description) 
    VALUES (stream_owner_id, total_cost, 'gift_received', 'Received ' || gift_info.name);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get available gifts
CREATE OR REPLACE FUNCTION get_available_gifts()
RETURNS TABLE (
    gift_id UUID,
    gift_type TEXT,
    name TEXT,
    icon TEXT,
    cost INTEGER,
    animation_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as gift_id,
        g.gift_type,
        g.name,
        g.icon,
        g.cost,
        g.animation_type
    FROM gifts g
    ORDER BY g.cost ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= PROFILE FUNCTIONS =============

-- Get user profile
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    followers_count INTEGER,
    following_count INTEGER,
    streams_count INTEGER,
    gems_balance INTEGER,
    is_verified BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(user_uuid, auth.uid());
    
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        p.bio,
        p.followers_count,
        p.following_count,
        p.streams_count,
        p.gems_balance,
        p.is_verified,
        p.created_at
    FROM profiles p
    WHERE p.id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    new_username TEXT DEFAULT NULL,
    new_display_name TEXT DEFAULT NULL,
    new_bio TEXT DEFAULT NULL,
    new_avatar_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET 
        username = COALESCE(new_username, username),
        display_name = COALESCE(new_display_name, display_name),
        bio = COALESCE(new_bio, bio),
        avatar_url = COALESCE(new_avatar_url, avatar_url),
        updated_at = NOW()
    WHERE id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Follow/Unfollow user
CREATE OR REPLACE FUNCTION toggle_follow(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    follow_exists BOOLEAN;
BEGIN
    -- Check if follow exists
    SELECT EXISTS(
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() AND following_id = target_user_id
    ) INTO follow_exists;
    
    IF follow_exists THEN
        -- Unfollow
        DELETE FROM follows 
        WHERE follower_id = auth.uid() AND following_id = target_user_id;
        RETURN false;
    ELSE
        -- Follow
        INSERT INTO follows (follower_id, following_id) 
        VALUES (auth.uid(), target_user_id);
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= DISCOVERY FUNCTIONS =============

-- Get trending categories
CREATE OR REPLACE FUNCTION get_trending_categories(limit_count INTEGER DEFAULT 6)
RETURNS TABLE (
    category_id UUID,
    name TEXT,
    icon TEXT,
    color TEXT,
    streams_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name,
        c.icon,
        c.color,
        c.streams_count
    FROM categories c
    WHERE c.is_active = true
    ORDER BY c.streams_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search streams
CREATE OR REPLACE FUNCTION search_streams(
    search_query TEXT,
    category_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    stream_id UUID,
    user_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    tags TEXT[],
    thumbnail_url TEXT,
    viewers_count INTEGER,
    likes_count INTEGER,
    is_live BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as stream_id,
        s.user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        s.title,
        s.description,
        s.category,
        s.tags,
        s.thumbnail_url,
        s.viewers_count,
        s.likes_count,
        s.is_live
    FROM streams s
    JOIN profiles p ON s.user_id = p.id
    WHERE (
        s.title ILIKE '%' || search_query || '%' OR
        s.description ILIKE '%' || search_query || '%' OR
        s.tags && ARRAY[search_query]
    )
    AND (category_filter IS NULL OR s.category = category_filter)
    ORDER BY s.viewers_count DESC, s.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    hashtag_id UUID,
    tag TEXT,
    usage_count INTEGER,
    is_trending BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id as hashtag_id,
        h.tag,
        h.usage_count,
        h.is_trending
    FROM hashtags h
    ORDER BY h.usage_count DESC, h.is_trending DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= NOTIFICATION FUNCTIONS =============

-- Get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    limit_count INTEGER DEFAULT 20,
    unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
    notification_id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    data JSONB,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id as notification_id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.is_read,
        n.created_at
    FROM notifications n
    WHERE n.user_id = auth.uid()
    AND (NOT unread_only OR n.is_read = false)
    ORDER BY n.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true 
    WHERE id = notification_uuid AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= ANALYTICS FUNCTIONS =============

-- Get stream analytics
CREATE OR REPLACE FUNCTION get_stream_analytics(stream_uuid UUID)
RETURNS TABLE (
    total_viewers INTEGER,
    total_likes INTEGER,
    total_comments INTEGER,
    total_gifts INTEGER,
    peak_viewers INTEGER,
    duration_minutes INTEGER
) AS $$
DECLARE
    stream_info streams%ROWTYPE;
BEGIN
    SELECT * INTO stream_info FROM streams WHERE id = stream_uuid;
    
    RETURN QUERY
    SELECT 
        stream_info.viewers_count as total_viewers,
        stream_info.likes_count as total_likes,
        stream_info.comments_count as total_comments,
        stream_info.gifts_received as total_gifts,
        stream_info.viewers_count as peak_viewers, -- Simplified for now
        EXTRACT(EPOCH FROM (COALESCE(stream_info.ended_at, NOW()) - stream_info.started_at)) / 60 as duration_minutes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_streams INTEGER,
    total_followers INTEGER,
    total_following INTEGER,
    total_gems INTEGER,
    total_gifts_sent INTEGER,
    total_gifts_received INTEGER
) AS $$
DECLARE
    target_user_id UUID;
BEGIN
    target_user_id := COALESCE(user_uuid, auth.uid());
    
    RETURN QUERY
    SELECT 
        p.streams_count as total_streams,
        p.followers_count as total_followers,
        p.following_count as total_following,
        p.gems_balance as total_gems,
        COALESCE(SUM(gt.total_cost), 0) as total_gifts_sent,
        COALESCE(SUM(gt2.total_cost), 0) as total_gifts_received
    FROM profiles p
    LEFT JOIN gift_transactions gt ON p.id = gt.sender_id
    LEFT JOIN gift_transactions gt2 ON p.id = gt2.receiver_id
    WHERE p.id = target_user_id
    GROUP BY p.id, p.streams_count, p.followers_count, p.following_count, p.gems_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;