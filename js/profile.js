// profile.js - Pagina Profilo ICCI FREE

// Carica lo script del sistema following
const script = document.createElement('script');
script.src = '/js/following.js';
document.head.appendChild(script);

// Funzione principale
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
                if (profile?.username) {
                    window.location.replace(`/profile.html?user=${profile.username}`);
                    return;
                }
            }

            messageText.innerHTML = `<div style="text-align:center;">
                <h2 style="color:#FFD700;margin-bottom:20px;">Nessun profilo specificato</h2>
                <p>Per vedere un profilo usa un link del tipo:<br>
                <code style="background:#282828;padding:5px;border-radius:4px;">
                    /profile.html?user=username
                </code></p>
                <a href="/dashboard.html" style="color:#FFD700;">Torna alla Dashboard</a>
            </div>`;
            return;
        }

        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !profile) {
            messageText.innerHTML = `<div style="text-align:center;">
                <h2 style="color:#ff4444;margin-bottom:20px;">Utente non trovato</h2>
                <p>L'utente "<strong>${username}</strong>" non esiste o è stato eliminato.</p>
                <a href="/dashboard.html" style="color:#FFD700;">Torna alla Dashboard</a>
            </div>`;
            return;
        }

        populateProfileData(profile);
        await setupActionButtons(profile);
        await loadFollowData(profile);

        profileContainer.style.display = 'block';
        messageContainer.style.display = 'none';
    } catch (err) {
        console.error("Errore nel caricamento del profilo:", err);
        messageText.innerHTML = `<div style="text-align:center;">
            <h2 style="color:#ff4444;margin-bottom:20px;">Errore</h2>
            <p>Si è verificato un errore nel caricamento del profilo.</p>
            <p style="color:#888;font-size:14px;margin-bottom:20px;">${err.message}</p>
            <a href="/dashboard.html" style="color:#FFD700;">Torna alla Dashboard</a>
        </div>`;
    }
}

// Popola dati profilo
function populateProfileData(profile) {
    document.title = `${profile.username} - ICCI FREE`;
    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('profileBio').textContent = profile.bio || 'Nessuna biografia impostata.';
    document.getElementById('followersCount').textContent = profile.followers_count || 0;
    document.getElementById('followingCount').textContent = profile.following_count || 0;

    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        if (profile.avatar_url) {
            profileAvatar.src = profile.avatar_url;
        } else {
            const initials = profile.username.substring(0,2).toUpperCase();
            const colors = ['FF5733','33FF57','3357FF','FF33F5','F5FF33','33FFF5'];
            const colorIndex = profile.username.charCodeAt(0) % colors.length;
            profileAvatar.src = `https://placehold.co/150x150/${colors[colorIndex]}/FFFFFF?text=${initials}`;
        }
    }
}

// Setup bottoni follow/edit
async function setupActionButtons(profile) {
    const currentUser = await checkUser();
    const profileActionsDiv = document.getElementById('profileActions');
    const headerActionBtn = document.getElementById('headerActionBtn');

    if (currentUser) {
        if (currentUser.id === profile.id) {
            profileActionsDiv.innerHTML = `<a href="/setup-profile.html?edit=true" class="action-btn edit">✏️ Modifica Profilo</a>`;
            headerActionBtn.style.display = 'none';
        } else {
            const isFollowing = await window.followingSystem?.checkIfFollowing(profile.id) || false;
            profileActionsDiv.innerHTML = `<button class="action-btn ${isFollowing ? 'following' : 'follow'}"
                data-follow-user="${profile.id}"
                onclick="handleFollowClick('${profile.id}')">
                ${isFollowing ? '✓ Following' : '+ Follow'}
            </button>`;

            const followBtn = profileActionsDiv.querySelector('button');
            if (isFollowing) {
                followBtn.style.background = 'var(--surface-medium)';
                followBtn.style.borderColor = 'var(--primary-yellow)';
            }

            headerActionBtn.href = '/dashboard.html';
            headerActionBtn.textContent = '← Dashboard';
            headerActionBtn.style.display = 'block';
        }
    } else {
        profileActionsDiv.innerHTML = `<a href="/auth.html" class="action-btn follow">🔒 Accedi per seguire</a>`;
        headerActionBtn.href = '/auth.html';
        headerActionBtn.textContent = 'Accedi';
        headerActionBtn.style.display = 'block';
    }
}

// Toggle follow
async function handleFollowClick(userId) {
    if (!window.followingSystem) return console.error('Sistema following non caricato');

    const isNowFollowing = await window.followingSystem.toggleFollow(userId);
    window.followingSystem.updateFollowButton(userId, isNowFollowing);
    await window.followingSystem.updateFollowersCount(userId);
}

// Load followers/following
async function loadFollowData(profile) {
    const contentTabs = document.querySelector('.content-tabs');
    if (contentTabs) {
        contentTabs.innerHTML = `
            <button class="tab active" onclick="showTab('streams')">Stream Recenti</button>
            <button class="tab" onclick="showTab('followers')">Followers (${profile.followers_count||0})</button>
            <button class="tab" onclick="showTab('following')">Following (${profile.following_count||0})</button>
            <button class="tab" onclick="showTab('clips')">Clips</button>
        `;
    }
    showTab('streams');
}

// Tabs
async function showTab(tabName) {
    const content
