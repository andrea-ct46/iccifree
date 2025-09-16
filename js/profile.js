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

// Avvia pagina
initializeProfilePage();
