// Dashboard con Feed Personalizzato

// Carica il sistema following
const followScript = document.createElement('script');
followScript.src = '/js/following.js';
document.head.appendChild(followScript);

// Variabile per tracciare il feed attuale
let currentFeedType = 'all'; // 'all' o 'following'

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
        
        // Carica il feed appropriato
        await loadFeed(currentFeedType);
        
        // Carica la lista following nella sidebar
        await loadFollowingList();

    } catch (error) {
        console.error("Errore nel caricare i dati della dashboard:", error);
        window.location.replace('/setup-profile.html');
    }
}

/**
 * Aggiunge il toggle per switchare tra "Per Te" e "Following"
 */
function addFeedToggle() {
    const categoryTitle = document.getElementById('categoryTitle');
    if (!categoryTitle) return;
    
    // Crea il toggle container
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
    
    // Sostituisci il titolo con il toggle
    categoryTitle.parentNode.insertBefore(toggleContainer, categoryTitle);
    categoryTitle.style.fontSize = '1.5rem';
}

/**
 * Switcha tra feed "Per Te" e "Following"
 */
async function switchFeed(type) {
    currentFeedType = type;
    
    // Aggiorna UI dei bottoni
    document.getElementById('allFeedBtn').classList.toggle('active', type === 'all');
    document.getElementById('followingFeedBtn').classList.toggle('active', type === 'following');
    
    // Aggiorna titolo
    const categoryTitle = document.getElementById('categoryTitle');
    categoryTitle.textContent = type === 'all' ? 'Stream in Evidenza' : 'Stream dai tuoi Following';
    
    // Carica il feed appropriato
    await loadFeed(type);
}

/**
 * Carica il feed basato sul tipo
 */
async function loadFeed(type) {
    const streamGrid = document.getElementById('streamGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (type === 'following' && window.followingSystem) {
        // Ottieni il feed personalizzato
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
                <a href="/dashboard.html" onclick="switchFeed('all'); return false;" 
                   class="go-live-btn" style="display: inline-block;">
                    Scopri Streamer
                </a>
            `;
        } else {
            emptyState.style.display = 'none';
            // Popola con stream dal feed following
            populateStreamFeed(feed);
        }
    } else {
        // Feed normale "Per Te"
        emptyState.style.display = 'none';
        populateStreamFeed();
    }
}

/**
 * Carica la lista dei following nella sidebar
 */
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
            html += `
                <li>
                    <a href="/following" style="opacity: 0.7;">
                        Vedi tutti (${following.length})
                    </a>
                </li>
            `;
        }
        
        followingList.innerHTML = html;
        
    } catch (error) {
        console.error('Errore nel caricamento following:', error);
    }
}

/**
 * Popola gli elementi dell'interfaccia con i dati dell'utente.
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

/**
 * Configura il link al profilo dell'utente
 */
function setupProfileLink(username) {
    const profileLink = document.getElementById('myProfileLink');
    if (profileLink && username) {
        profileLink.href = `/profile.html?user=${username}`;
    }
}

/**
 * Popola il feed con stream
 */
function populateStreamFeed(customStreams = null) {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;

    // Usa stream custom o quelli di default
    const streams = customStreams || [
        { 
            title: "Discussione Libera sulla Politica", 
            streamer: "LiberoPensatore", 
            category: "Talk Show & IRL", 
            viewers: 1200, 
            avatar: "https://placehold.co/40x40/7DF9FF/000000?text=LP",
            isLive: true
        },
        { 
            title: "Gaming Senza Censure", 
            streamer: "GamerOnFire", 
            category: "Gaming", 
            viewers: 854, 
            avatar: "https://placehold.co/40x40/FF5733/FFFFFF?text=GF",
            isLive: true
        },
        {
            title: "Crypto & Finanza Decentralizzata",
            streamer: "CryptoRebel",
            category: "Crypto",
            viewers: 432,
            avatar: "https://placehold.co/40x40/00FF00/000000?text=CR",
            isLive: true
        }
    ];

    let streamHTML = '';
    streams.forEach(stream => {
        streamHTML += `
            <div class="stream-card" onclick="alert('Stream di ${stream.streamer} - Coming soon!')">
                <div class="stream-thumbnail">
                    <img src="https://placehold.co/300x180/1a1a1a/FFD700?text=${encodeURIComponent(stream.category)}" alt="Stream Thumbnail">
                    ${stream.isLive ? '<div class="live-indicator">LIVE</div>' : ''}
                </div>
                <div class="stream-info">
                    <div class="streamer-avatar">
                        <img src="${stream.avatar}" alt="${stream.streamer} avatar">
                    </div>
                    <div class="stream-details">
                        <div class="title">${stream.title}</div>
                        <div class="streamer-name">${stream.streamer}</div>
                        <div class="category">${stream.category} • ${stream.viewers} spettatori</div>
                    </div>
                </div>
            </div>
        `;
    });
    streamGrid.innerHTML = streamHTML;
}

/**
 * Setup della barra di ricerca
 */
function setupSearchBar() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();
        
        searchTimeout = setTimeout(() => {
            filterStreams(query);
        }, 300);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.toLowerCase().trim();
            filterStreams(query);
        }
    });
}

/**
 * Filtra gli stream basandosi sulla query di ricerca
 */
function filterStreams(query) {
    const streamCards = document.querySelectorAll('.stream-card');
    const emptyState = document.getElementById('emptyState');
    let visibleCount = 0;
    
    if (!query) {
        streamCards.forEach(card => {
            card.style.display = '';
            visibleCount++;
        });
    } else {
        streamCards.forEach(card => {
            const title = card.querySelector('.title')?.textContent.toLowerCase() || '';
            const streamer = card.querySelector('.streamer-name')?.textContent.toLowerCase() || '';
            const category = card.querySelector('.category')?.textContent.toLowerCase() || '';
            
            if (title.includes(query) || streamer.includes(query) || category.includes(query)) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    if (emptyState) {
        if (visibleCount === 0 && query) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div style="font-size: 72px; margin-bottom: 20px;">🔍</div>
                <h3 style="color: var(--text-secondary); margin-bottom: 10px;">
                    Nessun risultato per "${query}"
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">
                    Prova con una ricerca diversa o sfoglia le categorie
                </p>
                <button onclick="document.getElementById('searchInput').value=''; filterStreams('')" 
                        class="go-live-btn" style="display: inline-block;">
                    Mostra Tutti
                </button>
            `;
        } else {
            emptyState.style.display = 'none';
        }
    }
}

/**
 * Funzione di logout
 */
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

// Avvia l'inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupSearchBar();
});
