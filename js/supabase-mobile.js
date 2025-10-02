// ============= SUPABASE MOBILE WRAPPER - COMPLETE IMPLEMENTATION =============
// Wrapper Supabase specifico per mobile app con gestione completa

console.log('🗄️ Supabase Mobile loading...');

const SupabaseMobile = {
    // ============= STATE =============
    client: null,
    currentUser: null,
    subscriptions: [],
    
    // ============= INIT =============
    init: async function() {
        console.log('🗄️ Supabase Mobile initializing...');
        
        try {
            // Get Supabase client from global
            this.client = window.supabaseClient;
            
            if (!this.client) {
                throw new Error('Supabase client not found');
            }
            
            // Load current user
            await this.loadCurrentUser();
            
            // Setup auth state listener
            this.setupAuthListener();
            
            console.log('✅ Supabase Mobile ready');
            
        } catch (error) {
            console.error('❌ Supabase Mobile init error:', error);
            throw error;
        }
    },
    
    // ============= AUTH FUNCTIONS =============
    loadCurrentUser: async function() {
        try {
            const { data: { user }, error } = await this.client.auth.getUser();
            
            if (error && error.message !== 'Invalid JWT') {
                throw error;
            }
            
            this.currentUser = user;
            console.log('👤 Current user:', user ? user.email : 'Not logged in');
            
            return { success: true, data: user };
            
        } catch (error) {
            console.error('❌ Error loading current user:', error);
            return { success: false, error: error.message };
        }
    },
    
    setupAuthListener: function() {
        this.client.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event);
            
            this.currentUser = session?.user || null;
            
            // Notify mobile app of auth changes
            if (window.MobileApp) {
                window.MobileApp.currentUser = this.currentUser;
                
                if (event === 'SIGNED_OUT') {
                    window.MobileApp.userGems = 0;
                    window.MobileApp.renderView('home');
                }
            }
        });
    },
    
    signOut: async function() {
        try {
            const { error } = await this.client.auth.signOut();
            
            if (error) throw error;
            
            // Clear subscriptions
            this.unsubscribeAll();
            
            // Clear local state
            this.currentUser = null;
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error signing out:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============= STREAMS FUNCTIONS =============
    getActiveStreams: async function() {
        try {
            const { data, error } = await this.client
                .from('streams')
                .select(`
                    id,
                    title,
                    description,
                    category,
                    viewer_count,
                    started_at,
                    user_id,
                    is_live
                `)
                .eq('is_live', true)
                .order('viewer_count', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
            
        } catch (error) {
            console.error('❌ Error getting active streams:', error);
            return { success: false, error: error.message };
        }
    },
    
    createStream: async function(streamData) {
        try {
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const { data, error } = await this.client
                .from('streams')
                .insert({
                    ...streamData,
                    user_id: this.currentUser.id,
                    viewer_count: 0,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error creating stream:', error);
            return { success: false, error: error.message };
        }
    },
    
    updateStream: async function(streamId, updateData) {
        try {
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const { data, error } = await this.client
                .from('streams')
                .update(updateData)
                .eq('id', streamId)
                .eq('user_id', this.currentUser.id)
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error updating stream:', error);
            return { success: false, error: error.message };
        }
    },
    
    endStream: async function(streamId) {
        try {
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const { data, error } = await this.client
                .from('streams')
                .update({
                    is_live: false,
                    ended_at: new Date().toISOString()
                })
                .eq('id', streamId)
                .eq('user_id', this.currentUser.id)
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error ending stream:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============= GEMS FUNCTIONS =============
    getUserGems: async function(userId) {
        try {
            // First try to get from user_gems table
            let { data, error } = await this.client
                .from('user_gems')
                .select('balance')
                .eq('user_id', userId)
                .single();
            
            if (error && error.code === 'PGRST116') {
                // No record found, create one with 0 gems
                const { data: newRecord, error: insertError } = await this.client
                    .from('user_gems')
                    .insert({
                        user_id: userId,
                        balance: 0
                    })
                    .select('balance')
                    .single();
                
                if (insertError) throw insertError;
                
                return { success: true, data: newRecord.balance };
            }
            
            if (error) throw error;
            
            return { success: true, data: data.balance };
            
        } catch (error) {
            console.error('❌ Error getting user gems:', error);
            return { success: false, error: error.message };
        }
    },
    
    addGems: async function(userId, amount) {
        try {
            const { data, error } = await this.client
                .rpc('add_gems', {
                    user_id: userId,
                    amount: amount
                });
            
            if (error) throw error;
            
            // Log transaction
            await this.logGemTransaction(userId, amount, 'purchased', 'Gems purchased');
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error adding gems:', error);
            return { success: false, error: error.message };
        }
    },
    
    subtractGems: async function(userId, amount) {
        try {
            const { data, error } = await this.client
                .rpc('subtract_gems', {
                    user_id: userId,
                    amount: amount
                });
            
            if (error) throw error;
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error subtracting gems:', error);
            return { success: false, error: error.message };
        }
    },
    
    logGemTransaction: async function(userId, amount, type, description) {
        try {
            const { error } = await this.client
                .from('gem_transactions')
                .insert({
                    user_id: userId,
                    amount: amount,
                    type: type,
                    description: description,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error logging gem transaction:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============= GIFTS FUNCTIONS =============
    sendGift: async function(giftData) {
        try {
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // Start transaction
            const { data, error } = await this.client
                .from('gifts_sent')
                .insert({
                    ...giftData,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) throw error;
            
            // Subtract gems from sender
            await this.subtractGems(giftData.from_user_id, giftData.gems_cost);
            
            // Add gems to receiver (80% of cost, 20% platform fee)
            const receiverGems = Math.floor(giftData.gems_cost * 0.8);
            await this.addGems(giftData.to_user_id, receiverGems);
            
            // Log transactions
            await this.logGemTransaction(
                giftData.from_user_id, 
                -giftData.gems_cost, 
                'sent', 
                `Gift sent: ${giftData.gift_name}`
            );
            
            await this.logGemTransaction(
                giftData.to_user_id, 
                receiverGems, 
                'received', 
                `Gift received: ${giftData.gift_name}`
            );
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error sending gift:', error);
            return { success: false, error: error.message };
        }
    },
    
    getGiftHistory: async function(userId, limit = 50) {
        try {
            const { data, error } = await this.client
                .from('gem_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
            
        } catch (error) {
            console.error('❌ Error getting gift history:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============= PROFILE FUNCTIONS =============
    getUserProfile: async function(userId) {
        try {
            const { data, error } = await this.client
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (error && error.code === 'PGRST116') {
                // No profile found, create default one
                const { data: newProfile, error: insertError } = await this.client
                    .from('user_profiles')
                    .insert({
                        user_id: userId,
                        display_name: 'User',
                        bio: '',
                        avatar_url: null,
                        followers_count: 0,
                        following_count: 0,
                        streams_count: 0
                    })
                    .select()
                    .single();
                
                if (insertError) throw insertError;
                
                return { success: true, data: newProfile };
            }
            
            if (error) throw error;
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            return { success: false, error: error.message };
        }
    },
    
    updateProfile: async function(userId, profileData) {
        try {
            const { data, error } = await this.client
                .from('user_profiles')
                .upsert({
                    user_id: userId,
                    ...profileData,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============= REALTIME SUBSCRIPTIONS =============
    subscribeToStreams: function(callback) {
        try {
            const subscription = this.client
                .channel('streams_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'streams'
                }, (payload) => {
                    console.log('📡 Streams update:', payload);
                    
                    // Fetch updated streams and call callback
                    this.getActiveStreams().then(result => {
                        if (result.success && callback) {
                            callback(result.data);
                        }
                    });
                })
                .subscribe();
            
            this.subscriptions.push(subscription);
            
            return { success: true, subscription };
            
        } catch (error) {
            console.error('❌ Error subscribing to streams:', error);
            return { success: false, error: error.message };
        }
    },
    
    subscribeToGems: function(userId, callback) {
        try {
            const subscription = this.client
                .channel('gems_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'user_gems',
                    filter: `user_id=eq.${userId}`
                }, (payload) => {
                    console.log('📡 Gems update:', payload);
                    
                    if (payload.new && callback) {
                        callback(payload.new.balance);
                    }
                })
                .subscribe();
            
            this.subscriptions.push(subscription);
            
            return { success: true, subscription };
            
        } catch (error) {
            console.error('❌ Error subscribing to gems:', error);
            return { success: false, error: error.message };
        }
    },
    
    subscribeToGifts: function(streamId, callback) {
        try {
            const subscription = this.client
                .channel('gifts_changes')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'gifts_sent',
                    filter: `stream_id=eq.${streamId}`
                }, (payload) => {
                    console.log('📡 New gift:', payload);
                    
                    if (payload.new && callback) {
                        callback(payload.new);
                    }
                })
                .subscribe();
            
            this.subscriptions.push(subscription);
            
            return { success: true, subscription };
            
        } catch (error) {
            console.error('❌ Error subscribing to gifts:', error);
            return { success: false, error: error.message };
        }
    },
    
    unsubscribeAll: function() {
        console.log('🔌 Unsubscribing from all realtime channels...');
        
        this.subscriptions.forEach(subscription => {
            try {
                this.client.removeChannel(subscription);
            } catch (error) {
                console.error('❌ Error unsubscribing:', error);
            }
        });
        
        this.subscriptions = [];
    },
    
    // ============= SEARCH FUNCTIONS =============
    searchStreams: async function(query, category = null) {
        try {
            let queryBuilder = this.client
                .from('streams')
                .select(`
                    id,
                    title,
                    description,
                    category,
                    viewer_count,
                    started_at,
                    user_id,
                    is_live
                `)
                .eq('is_live', true);
            
            if (query) {
                queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
            }
            
            if (category && category !== 'all') {
                queryBuilder = queryBuilder.eq('category', category);
            }
            
            const { data, error } = await queryBuilder
                .order('viewer_count', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
            
        } catch (error) {
            console.error('❌ Error searching streams:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============= ANALYTICS FUNCTIONS =============
    trackEvent: async function(eventName, eventData) {
        try {
            if (!this.currentUser) return { success: false, error: 'Not authenticated' };
            
            const { error } = await this.client
                .from('analytics_events')
                .insert({
                    user_id: this.currentUser.id,
                    event_name: eventName,
                    event_data: eventData,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error tracking event:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============= UTILITY FUNCTIONS =============
    handleError: function(error) {
        console.error('❌ Supabase error:', error);
        
        // Handle specific error types
        if (error.message?.includes('JWT')) {
            // Token expired, redirect to login
            if (window.MobileApp) {
                window.MobileApp.showNotification('Sessione scaduta, effettua nuovamente il login', 'error');
                setTimeout(() => {
                    window.location.href = '/auth.html';
                }, 2000);
            }
        }
        
        return { success: false, error: error.message };
    },
    
    // ============= BATCH OPERATIONS =============
    batchUpdateViewerCount: async function(streamUpdates) {
        try {
            const updates = streamUpdates.map(update => ({
                id: update.streamId,
                viewer_count: update.viewerCount
            }));
            
            const { data, error } = await this.client
                .from('streams')
                .upsert(updates);
            
            if (error) throw error;
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Error batch updating viewer counts:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============= CACHE MANAGEMENT =============
    clearCache: function() {
        // Clear any cached data
        console.log('🗑️ Clearing Supabase cache...');
    },
    
    // ============= CONNECTION STATUS =============
    getConnectionStatus: function() {
        return {
            connected: !!this.client,
            authenticated: !!this.currentUser,
            subscriptions: this.subscriptions.length
        };
    }
};

// ============= RPC FUNCTIONS SETUP =============
// These functions should be created in Supabase SQL Editor

const RPC_FUNCTIONS = {
    // Function to add gems to user
    add_gems: `
        CREATE OR REPLACE FUNCTION add_gems(user_id UUID, amount INTEGER)
        RETURNS void AS $$
        BEGIN
            INSERT INTO user_gems (user_id, balance)
            VALUES (user_id, amount)
            ON CONFLICT (user_id)
            DO UPDATE SET 
                balance = user_gems.balance + amount,
                updated_at = NOW();
        END;
        $$ LANGUAGE plpgsql;
    `,
    
    // Function to subtract gems from user
    subtract_gems: `
        CREATE OR REPLACE FUNCTION subtract_gems(user_id UUID, amount INTEGER)
        RETURNS void AS $$
        BEGIN
            UPDATE user_gems 
            SET 
                balance = GREATEST(0, balance - amount),
                updated_at = NOW()
            WHERE user_id = user_id;
            
            -- Insert record if doesn't exist
            INSERT INTO user_gems (user_id, balance)
            VALUES (user_id, 0)
            ON CONFLICT (user_id) DO NOTHING;
        END;
        $$ LANGUAGE plpgsql;
    `,
    
    // Function to get user stats
    get_user_stats: `
        CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
        RETURNS JSON AS $$
        DECLARE
            result JSON;
        BEGIN
            SELECT json_build_object(
                'gems', COALESCE(ug.balance, 0),
                'streams_count', COALESCE(up.streams_count, 0),
                'followers_count', COALESCE(up.followers_count, 0),
                'following_count', COALESCE(up.following_count, 0)
            ) INTO result
            FROM user_gems ug
            FULL OUTER JOIN user_profiles up ON ug.user_id = up.user_id
            WHERE COALESCE(ug.user_id, up.user_id) = user_id;
            
            RETURN COALESCE(result, '{"gems":0,"streams_count":0,"followers_count":0,"following_count":0}'::json);
        END;
        $$ LANGUAGE plpgsql;
    `
};

// ============= AUTO INIT =============
// Note: This will be called by MobileApp.init()

// Export globally
window.SupabaseMobile = SupabaseMobile;

console.log('✅ Supabase Mobile script loaded');
console.log('📋 RPC Functions to create in Supabase:', Object.keys(RPC_FUNCTIONS));