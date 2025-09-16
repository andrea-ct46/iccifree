// =====================================================
// SISTEMA FOLLOWING/FOLLOWERS - ICCI FREE
// =====================================================
// =====================================================
// SISTEMA FOLLOWING/FOLLOWERS - ICCI FREE
// =====================================================

async function followUser(userIdToFollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return window.location.href = '/auth.html';
        if (currentUser.id === userIdToFollow) {
            showNotification('Non puoi seguire te stesso! 😅', 'warning');
            return false;
        }

        const { error } = await supabaseClient
            .from('follows')
            .insert({ follower_id: currentUser.id, following_id: userIdToFollow });

        if (error && error.code !== '23505') throw error;
        if (!error) showNotification('Ora segui questo utente! 🎉', 'success');
        return true;

    } catch (error) {
        console.error('Errore nel follow:', error);
        showNotification('Errore nel seguire l\'utente', 'error');
        return false;
    }
}

async function unfollowUser(userIdToUnfollow) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return window.location.href = '/auth.html';

        const { error } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userIdToUnfollow);

        if (error) throw error;

        showNotification('Hai smesso di seguire questo utente', 'info');
        return true;

    } catch (error) {
        console.error('Errore nell\'unfollow:', error);
        showNotification('Errore nel smettere di seguire', 'error');
        return false;
    }
}

async function checkIfFollowing(userId) {
    try {
        const currentUser = await checkUser();
        if (!currentUser) return false;

        const { data, error } = await supabaseClient
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .single();

        return !error && data !== null;

    } catch (error) {
        console.error('Errore nel check following:', error);
        return false;
    }
}

async function toggleFollow(userId) {
    const isFollowing = await checkIfFollowing(userId);
    let success = false;

    if (isFollowing) success = await unfollowUser(userId);
    else success = await followUser(userId);

    if (success) await updateFollowersCount(userId);
    return !isFollowing;
}

async function getFollowersCount(userId) {
    try {
        const { count, error } = await supabaseClient
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', userId);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Errore getFollowersCount:', error);
        return 0;
    }
}

async function updateFollowersCount(userId) {
    const count = await getFollowersCount(userId);
    const followersCountElem = document.getElementById('followersCount');
    if (followersCountElem) followersCountElem.textContent = count;

    // Aggiorna anche tab followers
    const followersTab = document.querySelector('.content-tabs button.tab:nth-child(2)');
    if (followersTab) followersTab.textContent = `Followers (${count})`;
}

// Aggiorna bottone follow
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

window.followingSystem = {
    followUser,
    unfollowUser,
    toggleFollow,
    checkIfFollowing,
    getFollowersCount,
    updateFollowersCount,
    updateFollowButton
};
