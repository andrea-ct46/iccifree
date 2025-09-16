// =====================================================
// SISTEMA FOLLOWING/FOLLOWERS - ICCI FREE
// =====================================================

/**
 * Segui un utente
 * @param {string} userIdToFollow - UUID dell'utente da seguire
 * @returns {Promise<boolean>}
 */
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

        const { error } = await supabaseClient
            .from('follows')
            .insert({
                follower_id: currentUser.id,
                following_id: userIdToFollow
            });

        if (error) {
            if (error.code === '23505') {
                showNotification('Già segui questo utente!', 'info');
            } else {
                throw error;
            }
            return false;
        }

        showNotification('Ora segui questo utente! 🎉', 'success');
        updateFollowButton(userIdToFollow, true);
        await createNotification(userIdToFollow, 'new_follower', currentUser.id);
        return true;
    } catch (error) {
        console.error('Errore nel follow:', error);
        showNotification('Errore nel seguire l\'utente', 'error');
        return false;
    }
}

/**
 * Smetti di seguire un utente
 * @param {string} userIdToUnfollow - UUID dell'utente da unfollow
 * @returns {Promise<boolean>}
 */
async function unfollowUser(userIdToUnfollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) {
            window.location.href = '/auth.html';
            return false;
        }

        const { error } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToUnfollow);

        if (error) throw error;

        showNotification('Hai smesso di seguire questo utente', 'info');
        updateFollowButton(userIdToUnfollow, false);
        return true;
    } catch (error) {
        console.error('Errore nell\'unfollow:', error);
        showNotification('Errore nel smettere di seguire', 'error');
        return false;
    }
}

/**
 * Verifica se l'utente corrente segue un altro utente
 */
async function checkIfFollowing(targetUserId) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return false;

        const { data, error } = await supabaseClient
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', targetUserId)
            .single();

        return !error && data !== null;
    } catch (error) {
        console.error('Errore nel check following:', error);
        return false;
    }
}

/**
 * Toggle follow/unfollow
 */
async function toggleFollow(userId) {
    const isFollowing = await checkIfFollowing(userId);
    if (isFollowing) {
        await unfollowUser(userId);
    } else {
        await followUser(userId);
    }
}

/**
 * Aggiorna il bottone follow nell'UI
 */
function updateFollowButton(userId, isFollowing) {
    const buttons = document.querySelectorAll(`[data-follow-user="${userId}"]`);
    const followersCountElem = document.getElementById('followersCount');
    let currentCount = parseInt(followersCountElem?.textContent || '0');

    buttons.forEach(btn => {
        if (isFollowing) {
            btn.classList.remove('follow');
            btn.classList.add('following');
            btn.innerHTML = '✓ Following';
            btn.style.background = 'var(--surface-medium)';
            btn.style.borderColor = 'var(--primary-yellow)';
            if (followersCountElem) followersCountElem.textContent = currentCount + 1;
        } else {
            btn.classList.remove('following');
            btn.classList.add('follow');
            btn.innerHTML = '+ Follow';
            btn.style.background = 'var(--primary-yellow)';
            btn.style.borderColor = 'var(--primary-yellow)';
            if (followersCountElem) followersCountElem.textContent = Math.max(0, currentCount - 1);
        }
    });
}

/**
 * Crea notifica
 */
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
            });
        if (error) console.error('Errore creazione notifica:', error);
    } catch (error) {
        console.error('Errore notifica:', error);
    }
}

/**
 * Mostra notifiche toast
 */
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `<div class="toast-content"><span class="toast-icon">${
        type === 'success' ? '✅' :
        type === 'error' ? '❌' :
        type === 'warning' ? '⚠️' : 'ℹ️'
    }</span><span class="toast-message">${message}</span></div>`;

    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: var(--surface-dark);
        border: 1px solid ${
            type === 'success' ? '#00ff00' :
            type === 'error' ? '#ff4444' :
            type === 'warning' ? '#ffaa00' : 'var(--primary-yellow)'
        };
        border-radius: 12px; padding: 16px 20px;
        display: flex; align-items: center; gap: 12px;
        z-index: 9999; animation: slideInRight 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export per uso globale
window.followingSystem = {
    followUser,
    unfollowUser,
    toggleFollow,
    checkIfFollowing,
    updateFollowButton,
    showNotification
};
