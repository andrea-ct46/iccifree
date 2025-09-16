// =====================================================
// SISTEMA FOLLOWING/FOLLOWERS - ICCI FREE
// =====================================================

/**
 * Mostra notifiche toast nell'UI
 * @param {string} message - Messaggio da mostrare
 * @param {string} type - success/error/warning/info
 */
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${
                type === 'success' ? '✅' :
                type === 'error' ? '❌' :
                type === 'warning' ? '⚠️' : 'ℹ️'
            }</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--surface-dark);
        border: 1px solid ${
            type === 'success' ? '#00ff00' :
            type === 'error' ? '#ff4444' :
            type === 'warning' ? '#ffaa00' : 'var(--primary-yellow)'
        };
        border-radius: 12px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =====================================================
// FUNZIONI PRINCIPALI FOLLOWING
// =====================================================

async function followUser(userIdToFollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) { window.location.href = '/auth.html'; return false; }
        if (currentUser.id === userIdToFollow) { showNotification('Non puoi seguire te stesso! 😅','warning'); return false; }

        const { data: existing, error: selectError } = await supabaseClient
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToFollow);

        if (selectError) throw selectError;
        if (existing && existing.length > 0) { showNotification('Già segui questo utente!', 'info'); return false; }

        const { error: insertError } = await supabaseClient
            .from('follows')
            .insert({ follower_id: currentUser.id, following_id: userIdToFollow });

        if (insertError) throw insertError;

        showNotification('Ora segui questo utente! 🎉', 'success');
        updateFollowButton(userIdToFollow, true);
        incrementFollowersCount(userIdToFollow, 1);
        await createNotification(userIdToFollow, 'new_follower', currentUser.id);

        return true;
    } catch (err) {
        console.error('Errore nel follow:', err);
        showNotification('Errore nel seguire l\'utente', 'error');
        return false;
    }
}

async function unfollowUser(userIdToUnfollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) { window.location.href = '/auth.html'; return false; }

        const { error } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToUnfollow);

        if (error) throw error;

        showNotification('Hai smesso di seguire questo utente', 'info');
        updateFollowButton(userIdToUnfollow, false);
        incrementFollowersCount(userIdToUnfollow, -1);

        return true;
    } catch (err) {
        console.error('Errore nell\'unfollow:', err);
        showNotification('Errore nel smettere di seguire', 'error');
        return false;
    }
}

async function toggleFollow(userId) {
    const currentUser = await checkUser();
    if (!currentUser) { window.location.href = '/auth.html'; return; }

    const { data, error } = await supabaseClient
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId);

    if (error) { console.error(error); return; }

    if (data && data.length > 0) {
        await unfollowUser(userId);
    } else {
        await followUser(userId);
    }
}

// =====================================================
// AGGIORNAMENTO UI
// =====================================================

function updateFollowButton(userId, isFollowing) {
    const buttons = document.querySelectorAll(`[data-follow-user="${userId}"]`);
    buttons.forEach(btn => {
        if (isFollowing) {
            btn.classList.remove('follow');
            btn.classList.add('following');
            btn.innerHTML = '✓ Following';
            btn.style.background = 'var(--surface-medium)';
            btn.style.borderColor = 'var(--primary-yellow)';
        } else {
            btn.classList.remove('following');
            btn.classList.add('follow');
            btn.innerHTML = '+ Follow';
            btn.style.background = 'var(--primary-yellow)';
            btn.style.borderColor = 'var(--primary-yellow)';
        }
    });
}

function incrementFollowersCount(userId, delta) {
    const countElem = document.getElementById('followersCount');
    if (countElem) {
        let current = parseInt(countElem.textContent) || 0;
        current += delta;
        if (current < 0) current = 0;
        countElem.textContent = current;
    }
}

// =====================================================
// FUNZIONI ACCESSORIE
// =====================================================

async function checkIfFollowing(userId) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return false;

        const { data, error } = await supabaseClient
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId);

        if (error) throw error;
        return data && data.length > 0;
    } catch (err) {
        console.error('Errore nel check following:', err);
        return false;
    }
}

async function getFollowers(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('followers_view')
            .select('*')
            .eq('user_id', userId)
            .order('followed_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) { console.error(err); return []; }
}

async function getFollowing(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('following_view')
            .select('*')
            .eq('user_id', userId)
            .order('followed_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) { console.error(err); return []; }
}

async function createNotification(userId, type, fromUserId) {
    try {
        const messages = { 'new_follower':'ha iniziato a seguirti!','stream_live':'è andato live!' };
        const { error } = await supabaseClient
            .from('notifications')
            .insert({ user_id: userId, type, from_user_id: fromUserId, message: messages[type] || 'Nuova notifica' });
        if (error) console.error(error);
    } catch (err) { console.error(err); }
}

// =====================================================
// EXPORT
// =====================================================

window.followingSystem = {
    followUser,
    unfollowUser,
    toggleFollow,
    checkIfFollowing,
    getFollowers,
    getFollowing,
    showNotification
};
