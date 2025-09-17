// js/profile.js
// Pagina Profilo - integra followingSystem

// assicurati che supabase.js sia caricato prima

// carica following.js se non è già presente (solo se non caricato)
if (!window.followingSystem) {
    const s = document.createElement('script');
    s.src = '/js/following.js';
    document.head.appendChild(s);
}

async function initializeProfilePage() {
    const messageContainer = document.getElementById('messageState');
    const messageText = document.getElementById('messageText');
    const profileContainer = document.getElementById('profileContainer');

    try {
        const params = new URLSearchParams(window.location.search);
        const username = params.get('user');

        if (!username) {
            const currentUser = await checkUser();
            if (currentUser) {
                const { data: profile } = await supabaseClient.from('profiles').select('username').eq('id', currentUser.id).single();
                if (profile?.username) { window.location.replace(`/profile.html?user=${profile.username}`); return; }
            }
            messageText.innerHTML = '<p>Nessun profilo specificato.</p>'; return;
        }

        const { data: profile, error } = await supabaseClient.from('profiles').select('*').eq('username', username).single();
        if (error || !profile) { messageText.innerHTML = `<p>Utente "${username}" non trovato.</p>`; return; }

        populateProfileData(profile);
        await setupActionButtons(profile);
        await loadFollowData(profile);

        profileContainer.style.display = 'block';
        messageContainer.style.display = 'none';
    } catch (err) {
        console.error(err);
        messageText.innerHTML = '<p>Errore nel caricamento del profilo.</p>';
    }
}

function populateProfileData(profile) {
    document.title = `${profile.username} - ICCI FREE`;
    const elU = document.getElementById('profileUsername'); if (elU) elU.textContent = profile.username;
    const elB = document.getElementById('profileBio'); if (elB) elB.textContent = profile.bio || 'Nessuna biografia impostata.';
    const elF = document.getElementById('followersCount'); if (elF) elF.textContent = profile.followers_count || 0;
    const elG = document.getElementById('followingCount'); if (elG) elG.textContent = profile.following_count || 0;

    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        if (profile.avatar_url) profileAvatar.src = profile.avatar_url;
        else {
            const initials = profile.username.substring(0,2).toUpperCase();
            const colors = ['FF5733','33FF57','3357FF','FF33F5','F5FF33','33FFF5'];
            const colorIndex = profile.username.charCodeAt(0) % colors.length;
            profileAvatar.src = `https://placehold.co/150x150/${colors[colorIndex]}/FFFFFF?text=${initials}`;
        }
    }
}

async function setupActionButtons(profile) {
    const currentUser = await checkUser();
    const profileActionsDiv = document.getElementById('profileActions');
    const headerActionBtn = document.getElementById('headerActionBtn');

    if (currentUser && currentUser.id === profile.id) {
        profileActionsDiv.innerHTML = `<a href="/setup-profile.html?edit=true" class="action-btn edit">✏️ Modifica Profilo</a>`;
        headerActionBtn.style.display = 'none';
        return;
    }

    const isFollowing = await window.followingSystem.checkIfFollowing(profile.id);
    profileActionsDiv.innerHTML = `
        <button class="action-btn ${isFollowing ? 'following' : 'follow'}"
                data-follow-user="${profile.id}"
                onclick="handleFollowClick('${profile.id}')">
            ${isFollowing ? '✓ Following' : '+ Follow'}
        </button>`;
    headerActionBtn.href = '/dashboard.html'; headerActionBtn.textContent = '← Dashboard'; headerActionBtn.style.display = 'block';
}

async function handleFollowClick(userId) {
    if (!window.followingSystem) return console.error('Sistema not loaded');
    await window.followingSystem.toggleFollow(userId);
    // After toggle, refresh the exact state from DB and update UI
    const isNowFollowing = await window.followingSystem.checkIfFollowing(userId);
    window.followingSystem.updateFollowButton(userId, isNowFollowing);
    await window.followingSystem.updateFollowersCountFromDB(userId);
    // If followers tab open, refresh list
    if (document.querySelector('.content-tabs .tab.active')?.textContent.toLowerCase().includes('followers')) {
        refreshFollowers(userId);
    }
}

async function loadFollowData(profile) {
    const contentTabs = document.querySelector('.content-tabs');
    if (!contentTabs) return;
    contentTabs.innerHTML = `
        <button class="tab active" onclick="showTab('streams')">Stream Recenti</button>
        <button class="tab" onclick="showTab('followers')">Followers (${profile.followers_count||0})</button>
        <button class="tab" onclick="showTab('following')">Following (${profile.following_count||0})</button>
        <button class="tab" onclick="showTab('clips')">Clips</button>
    `;
    showTab('streams');
}

async function showTab(tabName) {
    const contentGrid = document.querySelector('.content-grid');
    const tabs = document.querySelectorAll('.content-tabs .tab');
    tabs.forEach(t => t.classList.toggle('active', t.textContent.toLowerCase().includes(tabName)));

    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    const { data: profile } = await supabaseClient.from('profiles').select('id').eq('username', username).single();
    if (!profile) { contentGrid.innerHTML = '<p>Utente non trovato.</p>'; return; }

    if (tabName === 'followers') {
        const followers = await window.followingSystem.getFollowers(profile.id);
        displayFollowers(followers);
    } else if (tabName === 'following') {
        const following = await window.followingSystem.getFollowing(profile.id);
        displayFollowing(following);
    } else {
        contentGrid.innerHTML = '<p id="noContentMessage">Nessun contenuto da mostrare.</p>';
    }
}

function displayFollowers(followers) {
    const contentGrid = document.querySelector('.content-grid');
    if (!followers || followers.length === 0) { contentGrid.innerHTML = '<p id="noContentMessage">Nessun follower ancora.</p>'; return; }
    let html = '<div style="display:grid;gap:16px;padding:20px;">';
    followers.forEach(f => {
        const username = f.follower_username || 'Anon';
        const avatar = f.follower_avatar || `https://placehold.co/50x50/FFD700/000000?text=${username.substring(0,2).toUpperCase()}`;
        html += `<div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--surface-dark);border-radius:12px;">
            <a href="/profile.html?user=${username}"><img src="${avatar}" alt="${username}" style="width:50px;height:50px;border-radius:50%;border:2px solid var(--border-color);"></a>
            <div style="flex:1;"><a href="/profile.html?user=${username}" style="color:var(--text-primary);text-decoration:none;font-weight:600;">${username}</a>
            <p style="color:var(--text-secondary);font-size:14px;margin:4px 0;">${f.follower_bio || 'Nessuna bio'}</p></div>
        </div>`;
    });
    html += '</div>'; contentGrid.innerHTML = html;
}

function displayFollowing(following) {
    const contentGrid = document.querySelector('.content-grid');
    if (!following || following.length === 0) { contentGrid.innerHTML = '<p id="noContentMessage">Non segui nessuno ancora.</p>'; return; }
    let html = '<div style="display:grid;gap:16px;padding:20px;">';
    following.forEach(f => {
        const username = f.following_username || 'Anon';
        const avatar = f.following_avatar || `https://placehold.co/50x50/FFD700/000000?text=${username.substring(0,2).toUpperCase()}`;
        html += `<div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--surface-dark);border-radius:12px;">
            <a href="/profile.html?user=${username}"><img src="${avatar}" alt="${username}" style="width:50px;height:50px;border-radius:50%;border:2px solid var(--border-color);"></a>
            <div style="flex:1;"><a href="/profile.html?user=${username}" style="color:var(--text-primary);text-decoration:none;font-weight:600;">${username}</a>
            <p style="color:var(--text-secondary);font-size:14px;margin:4px 0;">${f.following_bio || 'Nessuna bio'}</p></div></div>`;
    });
    html += '</div>'; contentGrid.innerHTML = html;
}

async function refreshFollowers(userId) {
    const followers = await window.followingSystem.getFollowers(userId);
    displayFollowers(followers);
    const elem = document.getElementById('followersCount');
    if (elem) elem.textContent = followers.length;
}

// start
document.addEventListener('DOMContentLoaded', initializeProfilePage);