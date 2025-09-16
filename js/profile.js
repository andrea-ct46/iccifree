// Profile Page con Sistema Following Integrato

// Carica il sistema following
const script = document.createElement('script');
script.src = '/js/following.js';
document.head.appendChild(script);

// Funzione principale che si avvia al caricamento della pagina
async function initializeProfilePage() {
    const messageContainer = document.getElementById('messageState');
    const messageText = document.getElementById('messageText');
    const profileContainer = document.getElementById('profileContainer');

    try {
        // 1. Legge lo username dall'URL
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
                
                if (profile && profile.username) {
                    window.location.replace(`/profile.html?user=${profile.username}`);
                    return;
                }
            }
            
            messageText.innerHTML = `
                <div style="text-align: center;">
                    <h2 style="color: #FFD700; margin-bottom: 20px;">Nessun profilo specificato</h2>
                    <p style="margin-bottom: 20px;">Per vedere un profilo, usa un link del tipo:<br>
                    <code style="background: #282828; padding: 5px; border-radius: 4px;">
                        /profile.html?user=username
                    </code></p>
                    <a href="/dashboard.html" style="color: #FFD700;">Torna alla Dashboard</a>
                </div>
            `;
            return;
        }

        // 2. Cerca il profilo nel database
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !profile) {
            messageText.innerHTML = `
                <div style="text-align: center;">
                    <h2 style="color: #ff4444; margin-bottom: 20px;">Utente non trovato</h2>
                    <p style="margin-bottom: 20px;">L'utente "<strong>${username}</strong>" non esiste o è stato eliminato.</p>
                    <a href="/dashboard.html" style="color: #FFD700;">Torna alla Dashboard</a>
                </div>
            `;
            return;
        }

        // 3. Popola la pagina con i dati trovati
        populateProfileData(profile);

        // 4. Setup action buttons con follow system
        await setupActionButtons(profile);

        // 5. Carica followers e following
        await loadFollowData(profile);

        // 6. Mostra il contenuto e nascondi il caricamento
        profileContainer.style.display = 'block';
        messageContainer.style.display = 'none';

    } catch (error) {
        console.error("Errore nel caricamento del profilo:", error);
        messageText.innerHTML = `
            <div style="text-align: center;">
                <h2 style="color: #ff4444; margin-bottom: 20px;">Errore</h2>
                <p style="margin-bottom: 20px;">Si è verificato un errore nel caricamento del profilo.</p>
                <p style="color: #888; font-size: 14px; margin-bottom: 20px;">${error.message}</p>
                <a href="/dashboard.html" style="color: #FFD700;">Torna alla Dashboard</a>
            </div>
        `;
    }
}

// Funzione per inserire i dati del profilo nell'HTML
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
            const initials = profile.username.substring(0, 2).toUpperCase();
            const colors = ['FF5733', '33FF57', '3357FF', 'FF33F5', 'F5FF33', '33FFF5'];
            const colorIndex = profile.username.charCodeAt(0) % colors.length;
            profileAvatar.src = `https://placehold.co/150x150/${colors[colorIndex]}/FFFFFF?text=${initials}`;
        }
    }
}

// Setup action buttons con sistema following
async function setupActionButtons(profile) {
    const currentUser = await checkUser();
    const profileActionsDiv = document.getElementById('profileActions');
    const headerActionBtn = document.getElementById('headerActionBtn');

    if (currentUser) {
        if (currentUser.id === profile.id) {
            // Il proprio profilo
            profileActionsDiv.innerHTML = `
                <a href="/setup-profile.html?edit=true" class="action-btn edit">
                    ✏️ Modifica Profilo
                </a>`;
            headerActionBtn.style.display = 'none';
        } else {
            // Profilo di qualcun altro - Verifica se lo segui
            const isFollowing = await window.followingSystem?.checkIfFollowing(profile.id) || false;
            
            profileActionsDiv.innerHTML = `
                <button class="action-btn ${isFollowing ? 'following' : 'follow'}" 
                        data-follow-user="${profile.id}"
                        onclick="handleFollowClick('${profile.id}')">
                    ${isFollowing ? '✓ Following' : '+ Follow'}
                </button>`;
            
            // Stile dinamico basato su following status
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
        // Non loggato
        profileActionsDiv.innerHTML = `
            <a href="/auth.html" class="action-btn follow">
                🔒 Accedi per seguire
            </a>`;
        headerActionBtn.href = '/auth.html';
        headerActionBtn.textContent = 'Accedi';
        headerActionBtn.style.display = 'block';
    }
}

// Handler per click su follow button
async function handleFollowClick(userId) {
    if (!window.followingSystem) {
        console.error('Sistema following non caricato');
        return;
    }
    
    await window.followingSystem.toggleFollow(userId);
    
    // Aggiorna i counter
    const followersCount = document.getElementById('followersCount');
    const currentCount = parseInt(followersCount.textContent) || 0;
    const button = document.querySelector(`[data-follow-user="${userId}"]`);
    
    if (button.classList.contains('following')) {
        followersCount.textContent = Math.max(0, currentCount - 1);
    } else {
        followersCount.textContent = currentCount + 1;
    }
}

// Carica la lista di followers e following
async function loadFollowData(profile) {
    // Aggiungi tabs per vedere followers/following
    const contentTabs = document.querySelector('.content-tabs');
    if (contentTabs) {
        contentTabs.innerHTML = `
            <button class="tab active" onclick="showTab('streams')">Stream Recenti</button>
            <button class="tab" onclick="showTab('followers')">
                Followers (${profile.followers_count || 0})
            </button>
            <button class="tab" onclick="showTab('following')">
                Following (${profile.following_count || 0})
            </button>
            <button class="tab" onclick="showTab('clips')">Clips</button>
        `;
    }
}

// Mostra tab specifico
async function showTab(tabName) {
    const contentGrid = document.querySelector('.content-grid');
    const tabs = document.querySelectorAll('.content-tabs .tab');
    
    // Aggiorna tab attivo
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(tabName)) {
            tab.classList.add('active');
        }
    });
    
    if (!window.followingSystem) {
        contentGrid.innerHTML = '<p>Caricamento...</p>';
        return;
    }
    
    // Ottieni username dal URL
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    
    // Ottieni user ID dal username
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
    
    if (!profile) return;
    
    switch(tabName) {
        case 'followers':
            const followers = await window.followingSystem.getFollowers(profile.id);
            displayFollowers(followers);
            break;
            
        case 'following':
            const following = await window.followingSystem.getFollowing(profile.id);
            displayFollowing(following);
            break;
            
        case 'clips':
            contentGrid.innerHTML = '<p id="noContentMessage">Nessun clip disponibile.</p>';
            break;
            
        default:
            contentGrid.innerHTML = '<p id="noContentMessage">Nessun contenuto da mostrare.</p>';
    }
}

// Mostra lista followers
function displayFollowers(followers) {
    const contentGrid = document.querySelector('.content-grid');
    
    if (followers.length === 0) {
        contentGrid.innerHTML = '<p id="noContentMessage">Nessun follower ancora.</p>';
        return;
    }
    
    let html = '<div style="display: grid; gap: 16px; padding: 20px;">';
    
    followers.forEach(follower => {
        const avatar = follower.follower_avatar || 
            `https://placehold.co/50x50/FFD700/000000?text=${follower.follower_username?.substring(0,2).toUpperCase()}`;
        
        html += `
            <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--surface-dark); border-radius: 12px; transition: all 0.2s;">
                <a href="/profile.html?user=${follower.follower_username}">
                    <img src="${avatar}" alt="${follower.follower_username}" 
                         style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--border-color);">
                </a>
                <div style="flex: 1;">
                    <a href="/profile.html?user=${follower.follower_username}" 
                       style="color: var(--text-primary); text-decoration: none; font-weight: 600;">
                        ${follower.follower_username}
                    </a>
                    <p style="color: var(--text-secondary); font-size: 14px; margin: 4px 0;">
                        ${follower.follower_bio || 'Nessuna bio'}
                    </p>
                </div>
                <button class="action-btn follow" 
                        onclick="window.location.href='/profile.html?user=${follower.follower_username}'"
                        style="padding: 8px 16px; font-size: 14px;">
                    Visualizza
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    contentGrid.innerHTML = html;
