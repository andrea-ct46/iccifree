// ======================================================
// ICCI FREE - SISTEMA FOLLOWING/FOLLOWERS COMPLETO
// ======================================================

// Toast notification system
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const colors = {
        success: '#00ff00',
        error: '#ff4444',
        warning: '#FFD700',
        info: '#00aaff'
    };
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1a1a1a;
        border-radius: 12px;
        padding: 12px 16px;
        z-index: 9999;
        box-shadow: 0 6px 18px rgba(0,0,0,0.5);
        border-left: 4px solid ${colors[type]};
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Follow a user
async function followUser(userIdToFollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) {
            window.location.href = '/auth.html';
            return false;
        }
        
        if (currentUser.id === userIdToFollow) {
            showNotification("Non puoi seguire te stesso", 'warning');
            return false;
        }
        
        // Check if already following
        const { data: existing } = await supabaseClient
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToFollow);
        
        if (existing && existing.length > 0) {
            showNotification('Già segui questo utente', 'info');
            return true;
        }
        
        // Insert follow
        const { data, error } = await supabaseClient
            .from('follows')
            .insert({
                follower_id: currentUser.id,
                following_id: userIdToFollow
            })
            .select('*');
        
        if (error) throw error;
        
        showNotification('Ora segui questo utente! 🎉', 'success');
        
        // Update UI
        updateFollowButton(userIdToFollow, true);
        await updateFollowCounts(userIdToFollow);
        
        // Create notification
        await createNotification(userIdToFollow, 'new_follower', currentUser.id);
        
        return true;
        
    } catch (err) {
        console.error('Errore follow:', err);
        showNotification('Errore nel seguire l\'utente', 'error');
        return false;
    }
}

// Unfollow a user
async function unfollowUser(userIdToUnfollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) {
            window.location.href = '/auth.html';
            return false;
        }
        
        const { data, error } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToUnfollow)
            .select('*');
        
        if (error) throw error;
        
        showNotification('Hai smesso di seguire questo utente', 'info');
        
        updateFollowButton(userIdToUnfollow, false);
        await updateFollowCounts(userIdToUnfollow);
        
        return true;
        
    } catch (err) {
        console.error('Errore unfollow:', err);
        showNotification('Errore nell\'unfollow', 'error');
        return false;
    }
}

// Check if following
async function checkIfFollowing(targetUserId) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return false;
        
        const { data, error } = await supabaseClient
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', targetUserId);
        
        if (error) throw error;
        return data && data.length > 0;
        
    } catch (err) {
        console.error('Errore checkIfFollowing:', err);
        return false;
    }
}

// Get followers list
async function getFollowers(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('follows')
            .select(`
                follower_id,
                created_at,
                profiles!follower_id (
                    id,
                    username,
                    avatar_url,
                    bio,
                    followers_count
                )
            `)
            .eq('following_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data?.map(f => ({
            ...f.profiles,
            followed_at: f.created_at
        })) || [];
        
    } catch (err) {
        console.error('Errore getFollowers:', err);
        return [];
    }
}

// Get following list
async function getFollowing(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('follows')
            .select(`
                following_id,
                created_at,
                profiles!following_id (
                    id,
                    username,
                    avatar_url,
                    bio,
                    followers_count
                )
            `)
            .eq('follower_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data?.map(f => ({
            ...f.profiles,
            followed_at: f.created_at
        })) || [];
        
    } catch (err) {
        console.error('Errore getFollowing:', err);
        return [];
    }
}

// Update follow counts
async function updateFollowCounts(userId) {
    try {
        // Get followers count
        const { count: followersCount } = await supabaseClient
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', userId);
        
        // Get following count
        const { count: followingCount } = await supabaseClient
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', userId);
        
        // Update profile
        await supabaseClient
            .from('profiles')
            .update({
                followers_count: followersCount || 0,
                following_count: followingCount || 0
            })
            .eq('id', userId);
        
        // Update UI if on profile page
        const followersEl = document.getElementById('followersCount');
        if (followersEl) followersEl.textContent = followersCount || 0;
        
        const followingEl = document.getElementById('followingCount');
        if (followingEl) followingEl.textContent = followingCount || 0;
        
    } catch (err) {
        console.error('Errore update counts:', err);
    }
}

// Update follow button UI
function updateFollowButton(userId, isFollowing) {
    const buttons = document.querySelectorAll(`[data-follow-user="${userId}"]`);
    
    buttons.forEach(btn => {
        if (isFollowing) {
            btn.classList.remove('follow');
            btn.classList.add('following');
            btn.innerHTML = '✓ Following';
            btn.style.background = '#2a2a2a';
            btn.style.borderColor = '#FFD700';
            btn.style.color = '#FFD700';
        } else {
            btn.classList.remove('following');
            btn.classList.add('follow');
            btn.innerHTML = '+ Follow';
            btn.style.background = '#FFD700';
            btn.style.borderColor = '#FFD700';
            btn.style.color = '#000';
        }
    });
}

// Create notification
async function createNotification(userId, type, fromUserId) {
    try {
        const messages = {
            new_follower: 'ha iniziato a seguirti!',
            stream_live: 'è andato live!',
            new_message: 'ti ha inviato un messaggio'
        };
        
        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: userId,
                type: type,
                from_user_id: fromUserId,
                message: messages[type] || 'Nuova notifica',
                read: false,
                created_at: new Date().toISOString()
            })
            .select('*');
        
        if (error) throw error;
        
    } catch (err) {
        console.error('Errore creazione notifica:', err);
    }
}

// Toggle follow
async function toggleFollow(userId) {
    const isFollowing = await checkIfFollowing(userId);
    if (isFollowing) {
        return await unfollowUser(userId);
    } else {
        return await followUser(userId);
    }
}

// Get mutual followers
async function getMutualFollowers(userId) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return [];
        
        // Get user's followers
        const { data: userFollowers } = await supabaseClient
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);
        
        // Get current user's followers
        const { data: myFollowers } = await supabaseClient
            .from('follows')
            .select('follower_id')
            .eq('following_id', currentUser.id);
        
        if (!userFollowers || !myFollowers) return [];
        
        // Find mutual
        const userFollowerIds = new Set(userFollowers.map(f => f.follower_id));
        const mutualIds = myFollowers
            .filter(f => userFollowerIds.has(f.follower_id))
            .map(f => f.follower_id);
        
        if (mutualIds.length === 0) return [];
        
        // Get profiles
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('*')
            .in('id', mutualIds);
        
        return profiles || [];
        
    } catch (err) {
        console.error('Errore mutual followers:', err);
        return [];
    }
}

// Get suggested users to follow
async function getSuggestedUsers(limit = 5) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return [];
        
        // Get users I'm already following
        const { data: following } = await supabaseClient
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id);
        
        const followingIds = following?.map(f => f.following_id) || [];
        followingIds.push(currentUser.id); // Add self
        
        // Get popular users I'm not following
        const { data: suggested } = await supabaseClient
            .from('profiles')
            .select('*')
            .not('id', 'in', `(${followingIds.join(',')})`)
            .order('followers_count', { ascending: false })
            .limit(limit);
        
        return suggested || [];
        
    } catch (err) {
        console.error('Errore suggested users:', err);
        return [];
    }
}

// Initialize follow buttons on page
async function initializeFollowButtons() {
    const buttons = document.querySelectorAll('[data-follow-user]');
    
    for (const btn of buttons) {
        const userId = btn.getAttribute('data-follow-user');
        if (!userId) continue;
        
        const isFollowing = await checkIfFollowing(userId);
        updateFollowButton(userId, isFollowing);
        
        btn.onclick = async (e) => {
            e.preventDefault();
            await toggleFollow(userId);
        };
    }
}

// Get notifications for current user
async function getNotifications(limit = 20) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return [];
        
        const { data, error } = await supabaseClient
            .from('notifications')
            .select(`
                *,
                profiles!from_user_id (
                    username,
                    avatar_url
                )
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
        
    } catch (err) {
        console.error('Errore get notifications:', err);
        return [];
    }
}

// Mark notification as read
async function markNotificationRead(notificationId) {
    try {
        await supabaseClient
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
    } catch (err) {
        console.error('Errore mark notification:', err);
    }
}

// Mark all notifications as read
async function markAllNotificationsRead() {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return;
        
        await supabaseClient
            .from('notifications')
            .update({ read: true })
            .eq('user_id', currentUser.id)
            .eq('read', false);
            
    } catch (err) {
        console.error('Errore mark all notifications:', err);
    }
}

// Get unread notification count
async function getUnreadNotificationCount() {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return 0;
        
        const { count } = await supabaseClient
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .eq('read', false);
        
        return count || 0;
        
    } catch (err) {
        console.error('Errore unread count:', err);
        return 0;
    }
}

// Display followers in UI
function displayFollowers(followers, container) {
    if (!container) return;
    
    if (!followers || followers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Nessun follower ancora</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="display: grid; gap: 16px; padding: 20px;">
            ${followers.map(follower => `
                <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: #1a1a1a; border-radius: 12px;">
                    <a href="/profile.html?user=${follower.username}">
                        <img src="${follower.avatar_url || getDefaultAvatar(follower.username)}" 
                             alt="${follower.username}" 
                             style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #333;">
                    </a>
                    <div style="flex: 1;">
                        <a href="/profile.html?user=${follower.username}" 
                           style="color: white; text-decoration: none; font-weight: 600;">
                            ${follower.username}
                        </a>
                        <p style="color: #888; font-size: 14px; margin: 4px 0;">
                            ${follower.bio || 'Nessuna bio'}
                        </p>
                    </div>
                    <button class="follow-btn" 
                            data-follow-user="${follower.id}"
                            style="padding: 8px 16px; background: #FFD700; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Follow
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    
    // Initialize follow buttons
    initializeFollowButtons();
}

// Display following in UI
function displayFollowing(following, container) {
    if (!container) return;
    
    if (!following || following.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Non segui ancora nessuno</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="display: grid; gap: 16px; padding: 20px;">
            ${following.map(user => `
                <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: #1a1a1a; border-radius: 12px;">
                    <a href="/profile.html?user=${user.username}">
                        <img src="${user.avatar_url || getDefaultAvatar(user.username)}" 
                             alt="${user.username}" 
                             style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #333;">
                    </a>
                    <div style="flex: 1;">
                        <a href="/profile.html?user=${user.username}" 
                           style="color: white; text-decoration: none; font-weight: 600;">
                            ${user.username}
                        </a>
                        <p style="color: #888; font-size: 14px; margin: 4px 0;">
                            ${user.bio || 'Nessuna bio'}
                        </p>
                    </div>
                    <button class="following-btn" 
                            data-follow-user="${user.id}"
                            style="padding: 8px 16px; background: #2a2a2a; color: #FFD700; border: 1px solid #FFD700; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ✓ Following
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    
    // Initialize follow buttons
    initializeFollowButtons();
}

// Helper: Get default avatar
function getDefaultAvatar(username) {
    const colors = ['FF5733', '33FF57', '3357FF', 'FF33F5', 'F5FF33', '33FFF5'];
    const colorIndex = username.charCodeAt(0) % colors.length;
    const initials = username.substring(0, 2).toUpperCase();
    return `https://placehold.co/50x50/${colors[colorIndex]}/FFFFFF?text=${initials}`;
}

// Export to window
window.followingSystem = {
    followUser,
    unfollowUser,
    toggleFollow,
    checkIfFollowing,
    getFollowers,
    getFollowing,
    getMutualFollowers,
    getSuggestedUsers,
    updateFollowButton,
    updateFollowCounts,
    createNotification,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadNotificationCount,
    displayFollowers,
    displayFollowing,
    initializeFollowButtons,
    showNotification
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeFollowButtons();
});

// CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .follow-btn, .following-btn {
        transition: all 0.3s ease;
    }
    
    .follow-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
    }
    
    .following-btn:hover {
        background: #ff4444 !important;
        border-color: #ff4444 !important;
        color: white !important;
    }
    
    .following-btn:hover::before {
        content: "Unfollow";
        position: absolute;
        left: 0;
        right: 0;
        text-align: center;
    }
    
    .following-btn:hover span {
        visibility: hidden;
    }
`;
document.head.appendChild(style);

console.log('✅ Following System loaded successfully');
