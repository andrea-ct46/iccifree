// Dashboard con DEBUG per capire il problema

// Carica il sistema following
const followScript = document.createElement('script');
followScript.src = '/js/following.js';
document.head.appendChild(followScript);

// Variabili globali
let currentFeedType = 'all';
let allUsers = []; // Cache degli utenti

/**
 * Funzione principale
 */
async function initializeDashboard() {
    console.log("🚀 Inizializzazione Dashboard...");
    
    const user = await checkUser();
    console.log("👤 Utente corrente:", user);

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
        
        console.log("✅ Profilo utente caricato:", profile);
        
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        populateUserData(profile);
        setupProfileLink(profile.username);
        
        // Carica TUTTI gli utenti
        await loadAllUsers();
        
        // Setup search DOPO aver caricato gli utenti
        setupSearchBar();
        
        // Aggiungi toggle per feed
        addFeedToggle();
        
        // Carica il feed
        await loadFeed(currentFeedType);
        
        // Carica following list
        await loadFollowingList();

    } catch (error) {
        console.error("❌ Errore inizializzazione:", error);
        window.location.replace('/setup-profile.html');
    }
}

/**
 * Carica TUTTI gli utenti dal database
 */
async function loadAllUsers() {
    console.log("📥 Caricamento utenti dal database...");
    
    try {
        const { data: users, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("❌ Errore query database:", error);
            throw error;
        }
        
        allUsers = users || [];
        console.log(`✅ Caricati ${allUsers.length} utenti:`, allUsers);
        
        // Mostra i primi 3 utenti per debug
        if (allUsers.length > 0) {
            console.log("Primi utenti:", allUsers.slice(0, 3).map(u => ({
                username: u.username,
                bio: u.bio,
                id: u.id
            })));
        }
        
    } catch (error) {
        console.error('❌ Errore nel caricamento utenti:', error);
        allUsers = [];
    }
}

/**
 * Setup della barra di ricerca
 */
function setupSearchBar() {
    console.log("🔍 Setup barra di ricerca...");
    
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    
    if (searchInput) {
        console.log("✅ Input desktop trovato");
        
        // Rimuovi vecchi listener
        searchInput.replaceWith(searchInput.cloneNode(true));
        const newSearchInput = document.getElementById('searchInput');
        
        newSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            console.log("🔤 Ricerca desktop:", query);
            performSearch(query);
        });
        
        newSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.toLowerCase().trim();
                console.log("⏎ Enter premuto, ricerca:", query);
                performSearch(query);
            }
        });
    } else {
        console.warn("⚠️ Input desktop non trovato!");
    }
    
    if (mobileSearchInput) {
        console.log("✅ Input mobile trovato");
        
        mobileSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            console.log("📱 Ricerca mobile:", query);
            performSearch(query);
        });
    }
}

/**
 * Esegue la ricerca
 */
function performSearch(query) {
    console.log(`🔎 performSearch chiamata con: "${query}"`);
    console.log(`📊 Utenti totali disponibili: ${allUsers.length}`);
    
    const streamGrid = document.getElementById('streamGrid');
    const emptyState = document.getElementById('emptyState');
    const categoryTitle = document.getElementById('categoryTitle');
    
    if (!streamGrid) {
        console.error("❌ streamGrid non trovato!");
        return;
    }
    
    if (!query || query === '') {
        console.log("🔄 Query vuota, reset alla vista normale");
        loadFeed(currentFeedType);
        return;
    }
    
    // Cerca negli utenti
    console.log("🔍 Cerco negli utenti...");
    const results = allUsers.filter(user => {
        const username = (user.username || '').toLowerCase();
        const bio = (user.bio || '').toLowerCase();
        
        const matchUsername = username.includes(query);
        const matchBio = bio.includes(query);
        
        if (matchUsername || matchBio) {
            console.log(`✓ Match trovato: ${user.username}`);
        }
        
        return matchUsername || matchBio;
    });
    
    console.log(`📊 Risultati trovati: ${results.length}`);
    if (results.length > 0) {
        console.log("Risultati:", results.map(r => r.username));
    }
    
    // Aggiorna il titolo
    if (categoryTitle) {
        categoryTitle.textContent = `Risultati per "${query}" (${results.length})`;
    }
    
    if (results.length === 0) {
        console.log("😔 Nessun risultato");
        streamGrid.innerHTML = '';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <div style="font-size: 72px; margin-bottom: 20px;">🔍</div>
            <h3 style="color: var(--text-secondary); margin-bottom: 10px;">
                Nessun utente trovato per "${query}"
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                Utenti nel database: ${allUsers.length}
            </p>
            <p style="color: var(--text-secondary); margin-bottom: 30px;">
                Prova a cercare: ${allUsers.slice(0, 3).map(u => u.username).join(', ')}
            </p>
            <button onclick="document.getElementById('searchInput').value=''; performSearch('')" 
                    class="go-live-btn" style="display: inline-block;">
                Mostra Tutti
            </button>
        `;
    } else {
        console.log("🎉 Mostro risultati");
        emptyState.style.display = 'none';
        displayUsersAsCards(results);
    }
}

/**
 * Mostra gli utenti come card
 */
function displayUsersAsCards(users) {
    console.log(`📇 Mostro ${users.length} utenti come card`);
    
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) {
        console.error("❌ streamGrid non trovato!");
        return;
    }
    
    let html = '';
    
    users.forEach((user, index) => {
        console.log(`Card ${index + 1}: ${user.username}`);
        
        const avatar = user.avatar_url || 
            `https://placehold.co/300x180/1a1a1a/FFD700?text=${(user.username || '??').substring(0, 2).toUpperCase()}`;
        
        const joinDate = new Date(user.created_at);
        const daysAgo = Math.floor((Date.now() - joinDate) / (1000 * 60 * 60 * 24));
        
        html += `
            <div class="stream-card" onclick="window.location.href='/profile.html?user=${user.username}'" style="cursor: pointer;">
                <div class="stream-thumbnail">
                    <img src="${avatar}" alt="${user.username}" style="object-fit: cover;">
                    <div class="live-indicator" style="background: #00ff00;">PROFILO</div>
                </div>
                <div class="stream-info">
                    <div class="streamer-avatar">
                        <img src="${avatar}" alt="${user.username} avatar">
                    </div>
                    <div class="stream-details">
                        <div class="title" style="font-size: 16px; font-weight: 700;">@${user.username}</div>
                        <div class="streamer-name" style="font-size: 14px;">${user.bio || 'Nessuna bio'}</div>
                        <div class="category" style="font-size: 12px;">
                            👥 ${user.followers_count || 0} followers • 
                            📅 ${daysAgo === 0 ? 'Oggi' : daysAgo === 1 ? 'Ieri' : daysAgo + ' giorni fa'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    streamGrid.innerHTML = html;
    console.log("✅ Card inserite nel DOM");
}

/**
 * Toggle feed types
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
        flex-wrap: wrap;
    `;
    
    toggleContainer.innerHTML = `
        <button class="feed-toggle-btn active" id="allFeedBtn" onclick="switchFeed('all')">
            🔥 Per Te
        </button>
        <button class="feed-toggle-btn" id="followingFeedBtn" onclick="switchFeed('following')">
            👥 Following
        </button>
        <button class="feed-toggle-btn" id="usersBtn" onclick="switchFeed('users')">
            🌟 Tutti (${allUsers.length})
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
 * Switch feed
 */
async function switchFeed(type) {
    console.log(`🔄 Switch feed to: ${type}`);
    currentFeedType = type;
    
    document.getElementById('allFeedBtn').classList.toggle('active', type === 'all');
    document.getElementById('followingFeedBtn').classList.toggle('active', type === 'following');
    document.getElementById('usersBtn').classList.toggle('active', type === 'users');
    
    const categoryTitle = document.getElementById('categoryTitle');
    if (type === 'all') {
        categoryTitle.textContent = 'Stream in Evidenza';
    } else if (type === 'following') {
        categoryTitle.textContent = 'Stream dai tuoi Following';
    } else if (type === 'users') {
        categoryTitle.textContent = `Tutti gli Utenti (${allUsers.length})`;
    }
    
    await loadFeed(type);
}

/**
 * Load feed
 */
async function loadFeed(type) {
    console.log(`📊 Loading feed: ${type}`);
    
    const streamGrid = document.getElementById('streamGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (type === 'users') {
        if (allUsers.length === 0) {
            streamGrid.innerHTML = '';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div style="font-size: 72px; margin-bottom: 20px;">👥</div>
                <h3 style="color: var(--text-secondary);">Nessun utente registrato</h3>
            `;
        } else {
            emptyState.style.display = 'none';
            displayUsersAsCards(allUsers);
        }
    } else {
        emptyState.style.display = 'none';
        populateStreamFeed();
    }
}

/**
 * Populate stream feed (mock data)
 */
function populateStreamFeed() {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;
    
    const mockStreams = [
        { 
            title: "Discussione Libera", 
            streamer: "TestUser", 
            category: "Talk", 
            viewers: 42,
            avatar: "https://placehold.co/40x40/FFD700/000000?text=TU"
        }
    ];
    
    // Aggiungi alcuni utenti reali
    allUsers.slice(0, 3).forEach(user => {
        mockStreams.push({
            title: `@${user.username}`,
            streamer: user.username,
            category: "Profilo Utente",
            viewers: user.followers_count || 0,
            avatar: user.avatar_url || `https://placehold.co/40x40/FFD700/000000?text=${user.username?.substring(0,2)}`
        });
    });
    
    let html = '';
    mockStreams.forEach(stream => {
        html += `
            <div class="stream-card" onclick="window.location.href='/profile.html?user=${stream.streamer}'">
                <div class="stream-thumbnail">
                    <img src="https://placehold.co/300x180/1a1a1a/FFD700?text=${stream.category}" alt="">
                    <div class="live-indicator" style="background: #666;">OFFLINE</div>
                </div>
                <div class="stream-info">
                    <div class="streamer-avatar">
                        <img src="${stream.avatar}" alt="">
                    </div>
                    <div class="stream-details">
                        <div class="title">${stream.title}</div>
                        <div class="streamer-name">${stream.streamer}</div>
                        <div class="category">${stream.category}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    streamGrid.innerHTML = html;
}

// Funzioni helper base
function populateUserData(profile) {
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        if (profile.avatar_url) {
            userAvatar.src = profile.avatar_url;
        } else {
            userAvatar.src = `https://placehold.co/40x40/FFD700/000000?text=${profile.username?.substring(0,2).toUpperCase()}`;
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
    // Placeholder per ora
    const followingList = document.getElementById('followingList');
    if (followingList) {
        followingList.innerHTML = '<li><a href="#" style="opacity: 0.5;">Caricamento...</a></li>';
    }
}

// Funzioni globali
window.switchFeed = switchFeed;
window.performSearch = performSearch;
window.logout = async function() {
    if (confirm('Vuoi uscire?')) {
        await supabaseClient.auth.signOut();
        window.location.href = '/';
    }
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    console.log("=== DASHBOARD CARICATA ===");
    initializeDashboard();
});
