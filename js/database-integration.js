// ============= DATABASE INTEGRATION FOR TIKTOK APP =============
// Integrazione completa database Supabase con UI TikTok

console.log('🗄️ Database Integration loading...');

const DatabaseIntegration = {
    
    // ============= STREAM OPERATIONS =============
    
    // Get live streams for TikTok feed
    async getLiveStreams(limit = 20) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_live_streams', { limit_count: limit });
            
            if (error) throw error;
            
            console.log('📺 Live streams loaded:', data.length);
            return data;
        } catch (error) {
            console.error('Error loading live streams:', error);
            return [];
        }
    },
    
    // Get specific stream details
    async getStreamById(streamId) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_stream_by_id', { stream_uuid: streamId });
            
            if (error) throw error;
            
            return data[0] || null;
        } catch (error) {
            console.error('Error loading stream:', error);
            return null;
        }
    },
    
    // Start new stream
    async startStream(title, description = null, category = null, tags = null, thumbnail = null) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('start_stream', {
                    stream_title: title,
                    stream_description: description,
                    stream_category: category,
                    stream_tags: tags,
                    stream_thumbnail_url: thumbnail
                });
            
            if (error) throw error;
            
            console.log('🔴 Stream started:', data);
            return data;
        } catch (error) {
            console.error('Error starting stream:', error);
            throw error;
        }
    },
    
    // End stream
    async endStream(streamId) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('end_stream', { stream_uuid: streamId });
            
            if (error) throw error;
            
            console.log('⏹️ Stream ended');
            return data;
        } catch (error) {
            console.error('Error ending stream:', error);
            throw error;
        }
    },
    
    // ============= INTERACTION OPERATIONS =============
    
    // Toggle like on stream
    async toggleLike(streamId) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('toggle_like', { stream_uuid: streamId });
            
            if (error) throw error;
            
            console.log('❤️ Like toggled:', data);
            return data;
        } catch (error) {
            console.error('Error toggling like:', error);
            return false;
        }
    },
    
    // Add comment to stream
    async addComment(streamId, message, isGift = false, giftType = null) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('add_comment', {
                    stream_uuid: streamId,
                    comment_message: message,
                    is_gift_comment: isGift,
                    gift_type: giftType
                });
            
            if (error) throw error;
            
            console.log('💬 Comment added:', data);
            return data;
        } catch (error) {
            console.error('Error adding comment:', error);
            return null;
        }
    },
    
    // Get stream comments
    async getStreamComments(streamId, limit = 50) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_stream_comments', {
                    stream_uuid: streamId,
                    limit_count: limit
                });
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error loading comments:', error);
            return [];
        }
    },
    
    // ============= GIFT OPERATIONS =============
    
    // Send gift to stream
    async sendGift(streamId, giftType, quantity = 1) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('send_gift', {
                    stream_uuid: streamId,
                    gift_type_param: giftType,
                    quantity_param: quantity
                });
            
            if (error) throw error;
            
            console.log('🎁 Gift sent:', data);
            return data;
        } catch (error) {
            console.error('Error sending gift:', error);
            throw error;
        }
    },
    
    // Get available gifts
    async getAvailableGifts() {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_available_gifts');
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error loading gifts:', error);
            return [];
        }
    },
    
    // ============= PROFILE OPERATIONS =============
    
    // Get user profile
    async getUserProfile(userId = null) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_user_profile', { user_uuid: userId });
            
            if (error) throw error;
            
            return data[0] || null;
        } catch (error) {
            console.error('Error loading profile:', error);
            return null;
        }
    },
    
    // Update user profile
    async updateUserProfile(username = null, displayName = null, bio = null, avatarUrl = null) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('update_user_profile', {
                    new_username: username,
                    new_display_name: displayName,
                    new_bio: bio,
                    new_avatar_url: avatarUrl
                });
            
            if (error) throw error;
            
            console.log('👤 Profile updated:', data);
            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    },
    
    // Toggle follow user
    async toggleFollow(userId) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('toggle_follow', { target_user_id: userId });
            
            if (error) throw error;
            
            console.log('👥 Follow toggled:', data);
            return data;
        } catch (error) {
            console.error('Error toggling follow:', error);
            return false;
        }
    },
    
    // ============= DISCOVERY OPERATIONS =============
    
    // Get trending categories
    async getTrendingCategories(limit = 6) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_trending_categories', { limit_count: limit });
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error loading categories:', error);
            return [];
        }
    },
    
    // Search streams
    async searchStreams(query, category = null, limit = 20) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('search_streams', {
                    search_query: query,
                    category_filter: category,
                    limit_count: limit
                });
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error searching streams:', error);
            return [];
        }
    },
    
    // Get trending hashtags
    async getTrendingHashtags(limit = 10) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_trending_hashtags', { limit_count: limit });
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error loading hashtags:', error);
            return [];
        }
    },
    
    // ============= NOTIFICATION OPERATIONS =============
    
    // Get user notifications
    async getUserNotifications(limit = 20, unreadOnly = false) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_user_notifications', {
                    limit_count: limit,
                    unread_only: unreadOnly
                });
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error loading notifications:', error);
            return [];
        }
    },
    
    // Mark notification as read
    async markNotificationRead(notificationId) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('mark_notification_read', { notification_uuid: notificationId });
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Error marking notification read:', error);
            return false;
        }
    },
    
    // ============= ANALYTICS OPERATIONS =============
    
    // Get stream analytics
    async getStreamAnalytics(streamId) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_stream_analytics', { stream_uuid: streamId });
            
            if (error) throw error;
            
            return data[0] || null;
        } catch (error) {
            console.error('Error loading stream analytics:', error);
            return null;
        }
    },
    
    // Get user analytics
    async getUserAnalytics(userId = null) {
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_user_analytics', { user_uuid: userId });
            
            if (error) throw error;
            
            return data[0] || null;
        } catch (error) {
            console.error('Error loading user analytics:', error);
            return null;
        }
    },
    
    // ============= REALTIME SUBSCRIPTIONS =============
    
    // Subscribe to stream updates
    subscribeToStream(streamId, callback) {
        const subscription = window.supabaseClient
            .channel(`stream-${streamId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'streams',
                filter: `id=eq.${streamId}`
            }, callback)
            .subscribe();
        
        return subscription;
    },
    
    // Subscribe to stream comments
    subscribeToStreamComments(streamId, callback) {
        const subscription = window.supabaseClient
            .channel(`comments-${streamId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `stream_id=eq.${streamId}`
            }, callback)
            .subscribe();
        
        return subscription;
    },
    
    // Subscribe to user notifications
    subscribeToNotifications(callback) {
        const subscription = window.supabaseClient
            .channel('user-notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${window.supabaseClient.auth.getUser().then(u => u.data.user?.id)}`
            }, callback)
            .subscribe();
        
        return subscription;
    },
    
    // ============= UTILITY FUNCTIONS =============
    
    // Format numbers (1.2K, 1.5M)
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },
    
    // Format time ago
    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    },
    
    // Validate stream data
    validateStreamData(streamData) {
        const required = ['title'];
        const missing = required.filter(field => !streamData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
        
        return true;
    },
    
    // Handle database errors
    handleError(error, context = 'Database operation') {
        console.error(`${context} error:`, error);
        
        // Show user-friendly error message
        if (window.TikTokApp && window.TikTokApp.showNotification) {
            let message = 'Database error occurred';
            
            if (error.message.includes('insufficient')) {
                message = 'Insufficient gems for this action';
            } else if (error.message.includes('not found')) {
                message = 'Resource not found';
            } else if (error.message.includes('permission')) {
                message = 'Permission denied';
            }
            
            window.TikTokApp.showNotification(`❌ ${message}`);
        }
        
        return false;
    }
};

// Export globally
window.DatabaseIntegration = DatabaseIntegration;

console.log('✅ Database Integration loaded');