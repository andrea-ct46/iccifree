// =====================================================
// SISTEMA FOLLOWING/FOLLOWERS - ICCI FREE
// =====================================================

async function followUser(userIdToFollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) {
            window.location.href = '/auth.html';
            return false;
        }

        if (currentUser.id === userIdToFollow) {
            showNotification('Non puoi seguire te stesso! 😅', 'warning');
            return false;
        }

        // Inserimento con select('*') per evitare 406
        const { data, error } = await supabaseClient
            .from('follows')
            .insert({
                follower_id: currentUser.id,
                following_id: userIdToFollow
            })
            .select('*');

        if (error) {
            if (error.code === '23505') {
                showNotification('Già segui questo utente!', 'info');
            } else {
                throw error;
            }
            return false;
        }

        showNotification('Ora segui questo utente! 🎉', 'success');

        // Aggiorna UI
        updateFollowButton(userIdToFollow, true);
        incrementFollowerCounter(userIdToFollow, 1);

        // Notifica opzionale
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
        if (!currentUser) {
            window.location.href = '/auth.html';
            return false;
        }

        const { data, error } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToUnfollow)
            .select('*'); // <- select per evitare problemi

        if (error) throw error;

        showNotification('Hai smesso di seguire questo utente', 'info');

        // Aggiorna UI
        updateFollowButton(userIdToUnfollow, false);
        incrementFollowerCounter(userIdToUnfollow, -1);

        return true;
    } catch (err) {
        console.error('Errore nell\'unfollow:', err);
        showNotification('Errore nel smettere di seguire', 'error');
        return false;
    }
}

async function checkIfFollowing(targetUserId) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return false;

        const { data, error } = await supabaseClient
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', targetUserId)
            .single();

        return !error && data !== null;
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
    } catch (err) {
        console.error('Errore nel recupero follower:', err);
        return [];
    }
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
    } catch (err) {
        console.error('Errore nel recupero following:', err);
        return [];
    }
}

async function toggleFollow(userId) {
    const isFollowing = await checkIfFollowing(userId);
    if (isFollowing) {
        await unfollowUser(userId);
    } else {
        await followUser(userId);
    }
}

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

function incrementFollowerCounter(userId, delta) {
    const counter = document.getElementById('followersCount');
    if (!counter) return;
    const current = parseInt(counter.textContent) || 0;
    counter.textContent = Math.max(0, current + delta);
}

// Notifiche
async function createNotification(userId, type, fromUserId) {
    try {
        const messages = {
            'new_follower': 'ha iniziato a seguirti!',
            'stream_live': 'è andato live!',
        };
        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                from_user_id: fromUserId,
                message: messages[type] || 'Nuova notifica'
            })
            .select('*');

        if (error) console.error('Errore creazione notifica:', error);
    } catch (err) {
        console.error('Errore notifica:', err);
    }
}

function showNotification(message, type='info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `<div class="toast-content">
        <span class="toast-icon">${
            type==='success'?'✅':type==='error'?'❌':type==='warning'?'⚠️':'ℹ️'
        }</span>
        <span class="toast-message">${message}</span>
    </div>`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--surface-dark);
        border: 1px solid ${
            type==='success'?'#00ff00':type==='error'?'#ff4444':type==='warning'?'#ffaa00':'var(--primary-yellow)'
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

// Export
window.followingSystem = {
    followUser,
    unfollowUser,
    toggleFollow,
    checkIfFollowing,
    getFollowers,
    getFollowing,
    updateFollowButton,
    incrementFollowerCounter,
    showNotification
};
