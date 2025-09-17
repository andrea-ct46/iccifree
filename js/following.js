// js/following.js
// SISTEMA FOLLOWING/FOLLOWERS - ICCI FREE
// Assumes supabaseClient and checkUser() available

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `<div class="toast-content"><span class="toast-icon">${
        type==='success'?'✅':type==='error'?'❌':type==='warning'?'⚠️':'ℹ️'
    }</span><span class="toast-message">${message}</span></div>`;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: var(--surface-dark); border-radius: 12px; padding: 12px 16px;
        z-index: 9999; box-shadow: 0 6px 18px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);
    setTimeout(()=>{ toast.style.opacity = '0'; setTimeout(()=>toast.remove(),300);}, 3000);
}

async function followUser(userIdToFollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) { window.location.href = '/auth.html'; return false; }
        if (currentUser.id === userIdToFollow) { showNotification("Non puoi seguire te stesso", 'warning'); return false; }

        // Check if already following (avoid 406)
        const { data: existing, error: selErr } = await supabaseClient
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToFollow);

        if (selErr) { console.error(selErr); }

        if (existing && existing.length > 0) {
            showNotification('Già segui questo utente', 'info');
            return true;
        }

        // Insert with select('*') to avoid 406 REST issues
        const { data, error } = await supabaseClient
            .from('follows')
            .insert({ follower_id: currentUser.id, following_id: userIdToFollow })
            .select('*');

        if (error) throw error;

        showNotification('Ora segui questo utente! 🎉', 'success');

        // update UI
        updateFollowButton(userIdToFollow, true);
        await updateFollowersCountFromDB(userIdToFollow);

        // create notification (optional) — may trigger RLS; handle errors
        try { await createNotification(userIdToFollow, 'new_follower', currentUser.id); } catch(e){ console.warn('notif error', e); }

        return true;
    } catch (err) {
        console.error('Errore follow:', err);
        showNotification('Errore nel seguire', 'error');
        return false;
    }
}

async function unfollowUser(userIdToUnfollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) { window.location.href = '/auth.html'; return false; }

        // delete with select('*') to avoid REST issues
        const { data, error } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToUnfollow)
            .select('*');

        if (error) throw error;

        showNotification('Hai smesso di seguire questo utente', 'info');

        updateFollowButton(userIdToUnfollow, false);
        await updateFollowersCountFromDB(userIdToUnfollow);

        return true;
    } catch (err) {
        console.error('Errore unfollow:', err);
        showNotification('Errore nell\'unfollow', 'error');
        return false;
    }
}

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
        console.error(err);
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
        console.error(err);
        return [];
    }
}

async function updateFollowersCountFromDB(userId) {
    try {
        const { count, error } = await supabaseClient
            .from('follows')
            .select('id', { head: true, count: 'exact' })
            .eq('following_id', userId);
        if (error) throw error;
        const c = count || 0;
        const elem = document.getElementById('followersCount');
        if (elem) elem.textContent = c;
        // update tab label if exists
        const followersTab = document.querySelector('.content-tabs button:nth-child(2)');
        if (followersTab) followersTab.textContent = `Followers (${c})`;
    } catch (err) {
        console.error('Errore updateFollowersCountFromDB:', err);
    }
}

function updateFollowButton(userId, isFollowing) {
    const buttons = document.querySelectorAll(`[data-follow-user="${userId}"]`);
    buttons.forEach(btn => {
        if (isFollowing) {
            btn.classList.remove('follow'); btn.classList.add('following');
            btn.innerHTML = '✓ Following';
            btn.style.background = 'var(--surface-medium)';
            btn.style.borderColor = 'var(--primary-yellow)';
        } else {
            btn.classList.remove('following'); btn.classList.add('follow');
            btn.innerHTML = '+ Follow';
            btn.style.background = 'var(--primary-yellow)';
            btn.style.borderColor = 'var(--primary-yellow)';
        }
    });
}

async function createNotification(userId, type, fromUserId) {
    try {
        const messages = { new_follower: 'ha iniziato a seguirti!', stream_live: 'è andato live!' };
        const { error } = await supabaseClient
            .from('notifications')
            .insert({ user_id: userId, type, from_user_id: fromUserId, message: messages[type] || 'Nuova notifica' })
            .select('*');
        if (error) throw error;
    } catch (err) {
        // RLS may block; log and continue
        console.error('Errore creazione notifica:', err);
    }
}

window.followingSystem = {
    followUser,
    unfollowUser,
    toggleFollow: async (userId) => {
        const is = await checkIfFollowing(userId);
        if (is) await unfollowUser(userId); else await followUser(userId);
    },
    checkIfFollowing,
    getFollowers,
    getFollowing,
    updateFollowButton,
    updateFollowersCountFromDB,
    showNotification
};