// profile.js - Pagina Profilo ICCI FREE

// Carica lo script del sistema following
const script = document.createElement('script');
script.src = '/js/following.js';
document.head.appendChild(script);

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
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('username')
                    .eq('id', currentUser.id)
                    .single();
                if (profile?.username) window.location.replace(`/profile.html?user=${profile.username}`);
                return;
            }
            messageText.innerHTML = '<p>Nessun profilo specificato.</p>';
            return;
        }

        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !profile) {
            messageText.innerHTML = `<p>Utente "${username}" non trovato.</p>`;
            return;
        }

        populateProfileData(profile);
        await setupActionButtons(profile);
        profileContainer.style.display = 'block';
        messageContainer.style.display = 'none';

    } catch (err) {
        console.error("Errore nel caricamento del profilo:", err);
        messageText.innerHTML = `<p>Errore nel caricamento del profilo.</p>`;
    }
}

// Popola dati profilo
function populateProfileData(profile) {
    document.title = `${profile.username} - ICCI FREE`;
    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('profileBio').textContent = profile.bio || 'Nessuna biografia impostata.';
    document.getElementById('followersCount').textContent = profile.followers_count || 0;
    document.getElementById('followingCount').textContent = profile.following_count || 0;
}

// Setup bottoni follow/edit
async function setupActionButtons(profile) {
    const currentUser = await checkUser();
    const profileActionsDiv = document.getElementById('profileActions');
    const headerActionBtn = document.getElementById('headerActionBtn');

    if (currentUser && currentUser.id === profile.id) {
        profileActionsDiv.innerHTML = `<a href="/setup-profile.html?edit=true" class="action-btn edit">✏️ Modifica Profilo</a>`;
        headerActionBtn.style.display = 'none';
        return;
    }

    const isFollowing = await window.followingSystem?.checkIfFollowing(profile.id) || false;
    profileActionsDiv.innerHTML = `
        <button class="action-btn ${isFollowing ? 'following' : 'follow'}"
                data-follow-user="${profile.id}"
                onclick="handleFollowClick('${profile.id}')">
            ${isFollowing ? '✓ Following' : '+ Follow'}
        </button>`;
}

// Toggle follow click
async function handleFollowClick(userId) {
    if (!window.followingSystem) return;
    await window.followingSystem.toggleFollow(userId);
}

// Load followers/following e tabs
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

// Mostra tab selezionata
async function showTab(tabName) {
    const contentGrid = document.querySelector('.content-grid');
    const tabs = document.querySelectorAll('.content-tabs .tab');

    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(tabName)) tab.classList.add('active');
    });

    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

    if (!profile) {
        contentGrid.innerHTML = '<p>Utente non trovato.</p>';
        return;
    }

    switch(tabName) {
        case 'followers':
            const followers = await window.followingSystem?.getFollowers(profile.id) || [];
            displayFollowers(followers);
            break;

        case 'following':
            const following = await window.followingSystem?.getFollowing(profile.id) || [];
            displayFollowing(following);
            break;

        default:
            contentGrid.innerHTML = '<p>Nessun contenuto da mostrare.</p>';
    }
}

// Display followers aggiornabile in tempo reale
function displayFollowers(followers) {
    const contentGrid = document.querySelector('.content-grid');
    if (!followers || followers.length === 0) {
        contentGrid.innerHTML = '<p id="noContentMessage">Nessun follower ancora.</p>';
        return;
    }

    let html = '<div style="display:grid;gap:16px;padding:20px;">';
    followers.forEach(f => {
        const avatar = f.follower_avatar || `https://placehold.co/50x50/FFD700/000000?text=${f.follower_username?.substring(0,2).toUpperCase()}`;
        html += `
            <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--surface-dark);border-radius:12px;">
                <a href="/profile.html?user=${f.follower_username}">
                    <img src="${avatar}" alt="${f.follower_username}" style="width:50px;height:50px;border-radius:50%;border:2px solid var(--border-color);">
                </a>
                <div style="flex:1;">
                    <a href="/profile.html?user=${f.follower_username}" style="color:var(--text-primary);text-decoration:none;font-weight:600;">
                        ${f.follower_username}
                    </a>
                    <p style="color:var(--text-secondary);font-size:14px;margin:4px 0;">
                        ${f.follower_bio || 'Nessuna bio'}
                    </p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    contentGrid.innerHTML = html;
}

// Display following
function displayFollowing(following) {
    const contentGrid = document.querySelector('.content-grid');
    if (!following || following.length === 0) {
        contentGrid.innerHTML = '<p id="noContentMessage">Non segui nessuno ancora.</p>';
        return;
    }

    let html = '<div style="display:grid;gap:16px;padding:20px;">';
    following.forEach(f => {
        const avatar = f.following_avatar || `https://placehold.co/50x50/FFD700/000000?text=${f.following_username?.substring(0,2).toUpperCase()}`;
        html += `
            <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--surface-dark);border-radius:12px;">
                <a href="/profile.html?user=${f.following_username}">
                    <img src="${avatar}" alt="${f.following_username}" style="width:50px;height:50px;border-radius:50%;border:2px solid var(--border-color);">
                </a>
                <div style="flex:1;">
                    <a href="/profile.html?user=${f.following_username}" style="color:var(--text-primary);text-decoration:none;font-weight:600;">
                        ${f.following_username}
                    </a>
                    <p style="color:var(--text-secondary);font-size:14px;margin:4px 0;">
                        ${f.following_bio || 'Nessuna bio'}
                    </p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    contentGrid.innerHTML = html;
}

// Aggiornamento realtime followers dopo follow/unfollow
async function refreshFollowers(userId) {
    const followers = await window.followingSystem.getFollowers(userId);
    displayFollowers(followers);

    // Aggiorna contatore
    const followersCountElem = document.getElementById('followersCount');
    if (followersCountElem) followersCountElem.textContent = followers.length;
}


// Avvia pagina
initializeProfilePage();
