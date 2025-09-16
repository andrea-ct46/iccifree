// =====================================================
// SISTEMA FOLLOWING/FOLLOWERS - ICCI FREE
// =====================================================

/**
 * Segui un utente
 * @param {string} userIdToFollow - UUID dell'utente da seguire
 * @returns {Promise<boolean>} - true se successo
 */
async function followUser(userIdToFollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) {
            // Utente non loggato, redirect al login
            window.location.href = '/auth.html';
            return false;
        }

        // Non puoi seguire te stesso
        if (currentUser.id === userIdToFollow) {
            showNotification('Non puoi seguire te stesso! 😅', 'warning');
            return false;
        }

        // Inserisci nella tabella follows
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
        
        // Aggiorna UI
        updateFollowButton(userIdToFollow, true);
        
        // Opzionale: Crea notifica per l'utente seguito
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
 * @returns {Promise<boolean>} - true se successo
 */
async function unfollowUser(userIdToUnfollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) {
            window.location.href = '/auth.html';
            return false;
        }

        // Elimina dalla tabella follows
        const { error } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToUnfollow);

        if (error) throw error;

        showNotification('Hai smesso di seguire questo utente', 'info');
        
        // Aggiorna UI
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
 * @param {string} targetUserId - UUID dell'utente da verificare
 * @returns {Promise<boolean>} - true se lo segue
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
 * Ottieni la lista dei follower di un utente
 * @param {string} userId - UUID dell'utente
 * @returns {Promise<Array>} - Array di follower
 */
async function getFollowers(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('followers_view')
            .select('*')
            .eq('user_id', userId)
            .order('followed_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Errore nel recupero follower:', error);
        return [];
    }
}

/**
 * Ottieni la lista di chi segue un utente
 * @param {string} userId - UUID dell'utente
 * @returns {Promise<Array>} - Array di following
 */
async function getFollowing(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('following_view')
            .select('*')
            .eq('user_id', userId)
            .order('followed_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Errore nel recupero following:', error);
        return [];
    }
}

/**
 * Toggle follow/unfollow
 * @param {string} userId - UUID dell'utente
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
 * @param {string} userId - UUID dell'utente
 * @param {boolean} isFollowing - Stato following
 */
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

/**
 * Crea una notifica (opzionale)
 * @param {string} userId - Utente che riceve la notifica
 * @param {string} type - Tipo di notifica
 * @param {string} fromUserId - Utente che genera la notifica
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
                type: type,
                from_user_id: fromUserId,
                message: messages[type] || 'Nuova notifica'
            });
            
        if (error) console.error('Errore creazione notifica:', error);
    } catch (error) {
        console.error('Errore notifica:', error);
    }
}

/**
 * Mostra notifiche toast nell'UI
 * @param {string} message - Messaggio da mostrare
 * @param {string} type - success/error/warning/info
 */
function showNotification(message, type = 'info') {
    // Crea toast notification
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
    
    // Stili inline per il toast
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
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Ottieni feed personalizzato (stream delle persone che segui)
 * @returns {Promise<Array>} - Array di stream
 */
async function getFollowingFeed() {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return [];
        
        // Ottieni gli ID delle persone che segui
        const { data: following, error: followError } = await supabaseClient
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id);
        
        if (followError) throw followError;
        
        if (!following || following.length === 0) {
            return []; // Non segui nessuno
        }
        
        const followingIds = following.map(f => f.following_id);
        
        // Per ora restituiamo mock data, 
        // quando avremo la tabella streams useremo questa query:
        /*
        const { data: streams, error } = await supabaseClient
            .from('streams')
            .select('*, profiles!user_id(*)')
            .in('user_id', followingIds)
            .eq('is_live', true)
            .order('started_at', { ascending: false });
        */
        
        // Mock data per testing
        return followingIds.map(id => ({
            user_id: id,
            title: 'Stream Live',
            viewers: Math.floor(Math.random() * 1000),
            category: 'Gaming'
        }));
        
    } catch (error) {
        console.error('Errore nel feed:', error);
        return [];
    }
}

// Aggiungi CSS per le animazioni toast
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .toast-notification {
            font-family: var(--font-sans);
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .toast-icon {
            font-size: 20px;
        }
        
        .toast-message {
            color: var(--text-primary);
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);
}

// Export per uso globale
window.followingSystem = {
    followUser,
    unfollowUser,
    toggleFollow,
    checkIfFollowing,
    getFollowers,
    getFollowing,
    getFollowingFeed,
    showNotification
};
