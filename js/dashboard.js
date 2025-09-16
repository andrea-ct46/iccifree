// Dashboard con Ricerca Reale nel Database

// Carica il sistema following
const followScript = document.createElement('script');
followScript.src = '/js/following.js';
document.head.appendChild(followScript);

// Variabili globali
let currentFeedType = 'all';
let allUsers = []; // Cache degli utenti per ricerca veloce

/**
 * Funzione principale che inizializza la dashboard.
 */
async function initializeDashboard() {
    const user = await checkUser();

    if (!user) {
        window.location.replace('/auth.html');
        return;
    }

    try {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        populateUserData(profile);
        setupProfileLink(profile.username);
        
        // Aggiungi toggle per feed
        addFeedToggle();
        
        // Carica TUTTI gli utenti reali dal database
        await loadAllUsers();
        
        // Carica il feed con utenti reali
        await loadFeed(currentFeedType);
        
        // Carica la lista following nella sidebar
        await loadFollowingList();

    } catch (error) {
        console.error("Errore nel caricare i dati della dashboard:", error);
        window.location.replace('/setup-profile.html');
    }
}

/**
 * Carica TUTTI gli utenti dal database per la ricerca
 */
async function loadAllUsers() {
    try {
        const { data: users, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allUsers = users || [];
        console.log(`Caricati ${allUsers.length} utenti dal database`);
        
    } catch (error) {
        console.error('Errore nel caricamento utenti:', error);
        allUsers = [];
    }
}

/**
 * Aggiunge il toggle per switchare tra "Per Te" e "Following"
 */
function addFeedToggle() {
    const categoryTitle = document.getElementById('categoryTitle');
    if (!categoryTitle) return;
    
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
        display: flex;
        gap: 16px;
        align-items: center;
        margin-bottom: 24px;
    `;
    
    toggleContainer.innerHTML = `
        <button class="feed-toggle-btn active" id="allFeedBtn" onclick="switchFeed('all')">
            🔥 Per Te
        </button>
        <button class="feed-toggle-btn" id="followingFeedBtn" onclick="switchFeed('following')">
            👥 Following
        </button>
        <button class="feed-toggle-btn" id="usersBtn" onclick="switchFeed('users')">
            🌟 Tutti gli Utenti
        </button>
        <style>
            .feed-toggle-btn {
                padding: 10px 20px;
                background: var(--surface-medium);
                border: 1px solid var(--border-color);
                border-radius: 20px;
                color: var(--text-secondary);
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            .feed-toggle-btn.active {
                background: var(--primary-yellow);
                color: var(--background-dark);
                border-color: var(--primary-yellow);
            }
            .feed-toggle-btn:hover:not(.active) {
                border-color: var(--primary-yellow);
                color: var(--text-primary);
            }
        </style>
    `;
    
    categoryTitle.parentNode.insertBefore(toggleContainer, categoryTitle);
    categoryTitle.style.fontSize = '1.5rem';
}

/**
 * Switcha tra feed types
 */
async function switchFeed(type) {
    currentFeedType = type;
    
    // Aggiorna UI dei bottoni
    document.getElementById('allFeedBtn').classList.toggle('active', type === 'all');
    document.getElementById('followingFeedBtn').classList.toggle('active', type === 'following');
    document.getElementById('usersBtn').classList.toggle('active', type === 'users');
    
    // Aggiorna titolo
    const categoryTitle = document.getElementById('categoryTitle');
    if (type === 'all') {
        categoryTitle.textContent = 'Stream in Evidenza';
    } else if (type === 'following') {
        categoryTitle.textContent = 'Stream dai tuoi Following';
    } else if (type === 'users') {
        categoryTitle.textContent = `Utenti Registrati (${allUsers.length})`;
    }
    
    await loadFeed(type);
}

/**
 * Carica il feed basato sul tipo
 */
async function loadFeed(type) {
    const streamGrid = document.getElementById('streamGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (type === 'users') {
        // Mostra tutti gli utenti registrati come card
        if (allUsers.length === 0) {
            streamGrid.innerHTML = '';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div style="font-size: 72px; margin-bottom: 20px;">👥</div>
                <h3 style="color: var(--text-secondary); margin-bottom: 10px;">
                    Nessun utente registrato
                </h3>
            `;
        } else {
            emptyState.style.display = 'none';
            displayUsersAsCards(allUsers);
        }
    } else if (type === 'following' && window.followingSystem) {
        // Feed following
        const feed = await window.followingSystem.getFollowingFeed();
        
        if (feed.length === 0) {
            streamGrid.innerHTML = '';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div style="font-size: 72px; margin-bottom: 20px;">👥</div>
                <h3 style="color: var(--text-secondary); margin-bottom: 10px;">
                    Nessuno stream dai tuoi following
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">
                    Segui qualcuno per vedere i loro stream qui!
                </p>
                <button onclick="switchFeed('users'); return false;" 
                   class="go-live-btn" style="display: inline-block;">
                    Scopri Utenti
                </button>
            `;
        } else {
            emptyState.style.display = 'none';
            populateStreamFeed(feed);
        }
    } else {
        // Feed normale con utenti reali + mock streams
        emptyState.style.display = 'none';
        populateStreamFeed();
    }
}

/**
 * Mostra gli utenti come card (tipo stream ma per profili)
 */
function displayUsersAsCards(users) {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;
    
    let html = '';
    
    users.forEach(user => {
        const avatar = user.avatar_url || 
            `https://placehold.co/300x180/1a1a1a/FFD700?text=${user.username?.substring(0, 2).toUpperCase()}`;
        
        const joinDate = new Date(user.created_at);
        const daysAgo = Math.floor((Date.now() - joinDate) / (1000 * 60 * 60 * 24));
        
        html += `
            <div class="stream-card" onclick="window.location.href='/profile.html?user=${user.username}'">
                <div class="stream-thumbnail">
                    <img src="${avatar}" alt="${user.username}" style="object-fit: cover;">
                    <div class="live-indicator" style="background: #00ff00;">USER</div>
                </div>
                <div class="stream-info">
                    <div class="streamer-avatar">
                        <img src="${avatar}" alt="${user.username} avatar">
                    </div>
                    <div class="stream-details">
                        <div class="title">${user.username}</div>
                        <div class="streamer-name">${user.bio || 'Nessuna bio'}</div>
                        <div class="category">
                            👥 ${user.followers_count || 0} followers • 
                            📅 Iscritto ${daysAgo === 0 ? 'oggi' : daysAgo === 1 ? 'ieri' : daysAgo + ' giorni fa'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    streamGrid.innerHTML = html;
}

/**
 * Popola il feed con stream (mock + utenti reali)
 */
function populateStreamFeed(customStreams = null) {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;

    // Mix di stream mock e utenti reali
    let streams = [];
    
    if (customStreams) {
        streams = customStreams;
    } else {
        // Aggiungi alcuni stream mock
        streams = [
            { 
                title: "Discussione Libera sulla Politica", 
                streamer: "LiberoPensatore", 
                category: "Talk Show & IRL", 
                viewers: 1200, 
                avatar: "https://placehold.co/40x40/7DF9FF/000000?text=LP",
                isLive: true,
                isMock: true
            },
            { 
                title: "Gaming Senza Censure", 
                streamer: "GamerOnFire", 
                category: "Gaming", 
                viewers: 854, 
                avatar: "https://placehold.co/40x40/FF5733/FFFFFF?text=GF",
                isLive: true,
                isMock: true
            }
        ];
        
        // Aggiungi utenti reali come "stream offline"
        allUsers.slice(0, 3).forEach(user => {
            streams.push({
                title: `Profilo di ${user.username}`,
                streamer: user.username,
                category: "Offline",
                viewers: user.followers_count || 0,
                avatar: user.avatar_url || `https://placehold.co/40x40/FFD700/000000?text=${user.username?.substring(0,2).toUpperCase()}`,
                isLive: false,
                userId: user.id,
                isMock: false
            });
        });
    }

    let streamHTML = '';
    streams.forEach(stream => {
        const onclick = stream.isMock ? 
            `alert('Stream di ${stream.streamer} - Coming soon!')` :
            `window.location.href='/profile.html?user=${stream.streamer}'`;
            
        streamHTML += `
            <div class="stream-card" onclick="${onclick}">
                <div class="stream-thumbnail">
                    <img src="https://placehold.co/300x180/1a1a1a/FFD700?text=${encodeURIComponent(stream.category)}" alt="Stream Thumbnail">
                    ${stream.isLive ? '<div class="live-indicator">LIVE</div>' : '<div class="live-indicator" style="background: #666;">OFFLINE</div>'}
                </div>
                <div class="stream-info">
                    <div class="streamer-avatar">
                        <img src="${stream.avatar}" alt="${stream.streamer} avatar">
                    </div>
                    <div class="stream-details">
                        <div class="title">${stream.title}</div>
                        <div class="streamer-name">${stream.streamer}</div>
                        <div class="category">${stream.category} • ${stream.viewers} ${stream.isLive ? 'spettatori' : 'followers'}</div>
                    </div>
                </div>
            </div>
        `;
    });
    streamGrid.innerHTML = streamHTML;
}

/**
 * Setup della barra di ricerca con RICERCA REALE
 */
function setupSearchBar() {
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            performSearch(query);
        });
    }
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            performSearch(query);
        });
    }
}

/**
 * Esegue la ricerca su utenti REALI
 */
function performSearch(query) {
    const streamGrid = document.getElementById('streamGrid');
    const emptyState = document.getElementById('emptyState');
    const categoryTitle = document.getElementById('categoryTitle');
    
    if (!query) {
        // Reset alla vista normale
        loadFeed(currentFeedType);
        return;
    }
    
    // Cerca negli utenti reali
    const results = allUsers.filter(user => {
        const username = (user.username || '').toLowerCase();
        const bio = (user.bio || '').toLowerCase();
        return username.includes(query) || bio.includes(query);
    });
    
    // Aggiorna il titolo
    categoryTitle.textContent = `Risultati per "${query}" (${results.length})`;
    
    if (results.length === 0) {
        streamGrid.innerHTML = '';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <div style="font-size: 72px; margin-bottom: 20px;">🔍</div>
            <h3 style="color: var(--text-secondary); margin-bottom: 10px;">
                Nessun utente trovato per "${query}"
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 30px;">
                Prova con un'altra ricerca
            </p>
            <button onclick="document.getElementById('searchInput').value=''; performSearch('')" 
                    class="go-live-btn" style="display: inline-block;">
                Mostra Tutti
            </button>
        `;
    } else {
        emptyState.style.display = 'none';
        displayUsersAsCards(results);
    }
}

// Rendi globali le funzioni necessarie
window.switchFeed = switchFeed;
window.performSearch = performSearch;

/**
 * Altre funzioni helper
 */
function populateUserData(profile) {
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        if (profile.avatar_url) {
            userAvatar.src = profile.avatar_url;
        } else {
            const initials = profile.username ? profile.username.substring(0, 2).toUpperCase() : '??';
            userAvatar.src = `https://placehold.co/40x40/FFD700/000000?text=${initials}`;
        }
    }
}

function setupProfileLink(username) {
    const profileLink = document.getElementById('myProfileLink');
    if (profileLink && username) {
        profileLink.href = `/profile.html?user=${username}`;
    }
}

async function loadFollowingList() {
    if (!window.followingSystem) return;
    
    try {
        const user = await checkUser();
        const following = await window.followingSystem.getFollowing(user.id);
        
        const followingList = document.getElementById('followingList');
        if (!followingList) return;
        
        if (following.length === 0) {
            followingList.innerHTML = '<li><a href="#" style="opacity: 0.5;">Nessuno seguito</a></li>';
            return;
        }
        
        let html = '';
        following.slice(0, 10).forEach(user => {
            html += `
                <li>
                    <a href="/profile.html?user=${user.following_username}">
                        <span style="display: inline-block; width: 8px; height: 8px; 
                              background: #00ff00; border-radius: 50%; margin-right: 8px;">
                        </span>
                        ${user.following_username}
                    </a>
                </li>
            `;
        });
        
        if (following.length > 10) {
            html += `<li><a href="#" style="opacity: 0.7;">Vedi tutti (${following.length})</a></li>`;
        }
        
        followingList.innerHTML = html;
        
    } catch (error) {
        console.error('Errore nel caricamento following:', error);
    }
}

window.logout = async function() {
    if (confirm('Sei sicuro di voler uscire?')) {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            window.location.href = '/';
        } catch (error) {
            console.error('Errore durante il logout:', error);
            window.location.href = '/';
        }
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupSearchBar();
});
