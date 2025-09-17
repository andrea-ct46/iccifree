// =====================================================
// ICCI FREE - DASHBOARD COMPLETA
// =====================================================

let currentUser = null;
let currentProfile = null;
let selectedCategory = 'all';
let searchTimeout = null;
let notificationChannel = null;

// =====================================================
// INIZIALIZZAZIONE
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inizializzazione dashboard...');
    
    try {
        // Verifica autenticazione
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error || !user) {
            console.log('❌ Utente non autenticato');
            window.location.href = '/auth.html';
            return;
        }
        
        currentUser = user;
        console.log('✅ Utente autenticato:', user.email);
        
        // Carica profilo
        await loadUserProfile();
        
        // Inizializza componenti
        await Promise.all([
            loadStats(),
            loadStreams(),
            loadFollowing(),
            loadNotifications()
        ]);
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup realtime subscriptions
        setupRealtimeSubscriptions();
        
        // Nascondi loading e mostra app
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        console.log('✅ Dashboard caricata con successo!');
        
    } catch (error) {
        console.error('❌ Errore inizializzazione:', error);
        showError(error.message);
    }
});

// =====================================================
// CARICA PROFILO UTENTE
// =====================================================
async function loadUserProfile() {
    const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (error) {
        if (error.code === 'PGRST116') {
            // Profilo non esiste, redirect a setup
            window.location.href = '/setup-profile.html';
            return;
        }
        throw error;
    }
    
    if (!profile.username || !profile.date_of_birth) {
        // Profilo incompleto
        window.location.href = '/setup-profile.html';
        return;
    }
    
    currentProfile = profile;
    
    // Aggiorna UI con dati profilo
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.src = profile.avatar_url || 
            `https://placehold.co/40x40/FFD700/000?text=${profile.username.charAt(0).toUpperCase()}`;
    }
    
    const myProfileLink = document.getElementById('myProfileLink');
    if (myProfileLink) {
        myProfileLink.href = `/profile.html?user=${profile.username}`;
    }
    
    // Aggiorna followers count
    document.getElementById('yourFollowers').textContent = profile.followers_count || 0;
}

// =====================================================
// CARICA STATISTICHE
// =====================================================
async function loadStats() {
    try {
        // Conta viewers totali
        const { count: totalViewers } = await supabaseClient
            .from('stream_viewers')
            .select('*', { count: 'exact', head: true })
            .is('left_at', null);
        
        // Conta live streams
        const { count: liveStreams } = await supabaseClient
            .from('streams')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'live');
        
        // Conta streamers totali
        const { count: totalStreamers } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        // Aggiorna UI
        document.getElementById('totalViewers').textContent = totalViewers || 0;
        document.getElementById('liveStreams').textContent = liveStreams || 0;
        document.getElementById('totalStreamers').textContent = totalStreamers || 0;
        
    } catch (error) {
        console.error('Errore caricamento stats:', error);
    }
}

// =====================================================
// CARICA STREAMS
// =====================================================
async function loadStreams(category = 'all') {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;
    
    try {
        let query = supabaseClient
            .from('streams')
            .select(`
                *,
                profiles!user_id (
                    username,
                    avatar_url,
                    is_verified
                )
            `)
            .eq('status', 'live')
            .order('viewer_count', { ascending: false });
        
        // Filtra per categoria se specificata
        if (category !== 'all') {
            query = query.ilike('category', `%${category.replace('-', ' ')}%`);
        }
        
        const { data: streams, error } = await query;
        
        if (error) throw error;
        
        if (!streams || streams.length === 0) {
            streamGrid.innerHTML = `
                <div class="empty-state">
                    <p style="font-size: 48px;">📺</p>
                    <h3>Nessuna diretta ${category !== 'all' ? 'in questa categoria' : 'al momento'}</h3>
                    <p>Sii il primo ad andare live!</p>
                    <a href="/golive-webrtc.html" class="go-live-empty-btn">
                        🔴 GO LIVE ORA
                    </a>
                </div>
            `;
            return;
        }
        
        streamGrid.innerHTML = streams.map(stream => {
            const streamer = stream.profiles;
            return `
                <a href="/stream-webrtc.html?id=${stream.id}" class="stream-card-link">
                    <div class="stream-card">
                        <div class="stream-thumbnail">
                            <img src="${stream.thumbnail_url || 'https://placehold.co/320x180/0d0d0d/FFD700?text=LIVE'}" 
                                 alt="${stream.title}"
                                 onerror="this.src='https://placehold.co/320x180/0d0d0d/FFD700?text=LIVE'">
                            <div class="live-indicator">● LIVE</div>
                            <div class="viewer-counter">👁️ ${stream.viewer_count || 0}</div>
                            ${stream.is_featured ? '<div class="featured-badge">⭐ IN EVIDENZA</div>' : ''}
                        </div>
                        <div class="stream-info">
                            <div class="streamer-avatar">
                                <img src="${streamer.avatar_url || 'https://placehold.co/40x40/282828/FFD700?text=?'}" 
                                     alt="${streamer.username}">
                                ${streamer.is_verified ? '<span class="verified-badge">✓</span>' : ''}
                            </div>
                            <div class="stream-details">
                                <div class="title">${escapeHtml(stream.title)}</div>
                                <div class="streamer-name">${streamer.username}</div>
                                <div class="category">${stream.category || 'Live Stream'}</div>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Errore caricamento streams:', error);
        streamGrid.innerHTML = '<div class="error-state">Errore caricamento streams</div>';
    }
}

// =====================================================
// CARICA FOLLOWING
// =====================================================
async function loadFollowing() {
    try {
        // Carica lista following
        const { data: following, error } = await supabaseClient
            .from('follows')
            .select(`
                following_id,
                profiles!follows_following_id_fkey (
                    id,
                    username,
                    avatar_url,
                    is_live
                )
            `)
            .eq('follower_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Separa live e offline
        const liveFollowing = [];
        const offlineFollowing = [];
        
        following?.forEach(f => {
            const profile = f.profiles;
            if (profile.is_live) {
                liveFollowing.push(profile);
            } else {
                offlineFollowing.push(profile);
            }
        });
        
        // Aggiorna UI - Following Live
        const followingLiveDiv = document.getElementById('followingLive');
        if (followingLiveDiv) {
            if (liveFollowing.length > 0) {
                followingLiveDiv.innerHTML = liveFollowing.map(user => `
                    <div class="following-item">
                        <img src="${user.avatar_url || 'https://placehold.co/32x32/282828/FFD700?text=?'}" 
                             class="following-avatar" alt="${user.username}">
                        <a href="/profile.html?user=${user.username}" class="following-name">
                            ${user.username}
                        </a>
                        <span class="live-badge-small">LIVE</span>
                    </div>
                `).join('');
            } else {
                followingLiveDiv.innerHTML = '<p style="color: #666; font-size: 12px; padding: 10px;">Nessuno online</p>';
            }
        }
        
        // Aggiorna UI - Following List
        const followingListDiv = document.getElementById('followingList');
        if (followingListDiv) {
            if (offlineFollowing.length > 0) {
                followingListDiv.innerHTML = offlineFollowing.map(user => `
                    <div class="following-item">
                        <img src="${user.avatar_url || 'https://placehold.co/32x32/282828/FFD700?text=?'}" 
                             class="following-avatar" alt="${user.username}">
                        <a href="/profile.html?user=${user.username}" class="following-name">
                            ${user.username}
                        </a>
                        <span class="following-status"></span>
                    </div>
                `).join('');
            } else if (liveFollowing.length === 0) {
                followingListDiv.innerHTML = '<p style="color: #666; font-size: 12px; padding: 10px;">Non segui ancora nessuno</p>';
            }
        }
        
    } catch (error) {
        console.error('Errore caricamento following:', error);
    }
}

// =====================================================
// CARICA NOTIFICHE
// =====================================================
async function loadNotifications() {
    try {
        const { data: notifications, error } = await supabaseClient
            .from('notifications')
            .select(`
                *,
                profiles!notifications_sender_id_fkey (
                    username,
                    avatar_url
                )
            `)
            .eq('recipient_id', currentUser.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        // Aggiorna badge count
        const notificationCount = document.getElementById('notificationCount');
        if (notifications && notifications.length > 0) {
            notificationCount.textContent = notifications.length;
            notificationCount.style.display = 'block';
        } else {
            notificationCount.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Errore caricamento notifiche:', error);
    }
}

// =====================================================
// SETUP EVENT LISTENERS
// =====================================================
function setupEventListeners() {
    // Ricerca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length > 0) {
                handleSearch();
            }
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-bar')) {
                document.getElementById('searchResults').classList.remove('active');
            }
        });
    }
    
    // Filtri categoria
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            selectedCategory = e.target.dataset.category;
            loadStreams(selectedCategory);
            
            // Aggiorna titolo feed
            const feedTitle = document.getElementById('feedTitle');
            if (selectedCategory === 'all') {
                feedTitle.textContent = '🔥 Stream in Evidenza';
            } else {
                feedTitle.textContent = `${e.target.textContent} Streams`;
            }
        });
    });
    
    // Sidebar category links
    document.querySelectorAll('[data-filter]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.dataset.filter;
            loadStreams(category);
        });
    });
}

// =====================================================
// GESTIONE RICERCA
// =====================================================
function handleSearch() {
    clearTimeout(searchTimeout);
    const query = document.getElementById('searchInput').value.trim();
    const resultsDiv = document.getElementById('searchResults');
    
    if (query.length < 2) {
        resultsDiv.classList.remove('active');
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            // Cerca utenti
            const { data: users } = await supabaseClient
                .rpc('search_users', { search_query: query });
            
            // Cerca streams
            const { data: streams } = await supabaseClient
                .rpc('search_streams', { search_query: query });
            
            let html = '';
            
            // Mostra streams trovati
            if (streams && streams.length > 0) {
                html += '<div style="padding: 8px 16px; color: #888; font-size: 12px;">LIVE ORA</div>';
                streams.forEach(stream => {
                    html += `
                        <a href="/stream-webrtc.html?id=${stream.id}" class="search-result-item">
                            <img src="${stream.avatar_url || 'https://placehold.co/40x40/282828/FFD700?text=?'}" 
                                 class="search-result-avatar">
                            <div class="search-result-info">
                                <div class="search-result-name">${escapeHtml(stream.title)}</div>
                                <div class="search-result-meta">
                                    ${stream.username} • ${stream.category} • 
                                    <span class="live-badge-small">LIVE</span>
                                </div>
                            </div>
                        </a>
                    `;
                });
            }
            
            // Mostra utenti trovati
            if (users && users.length > 0) {
                html += '<div style="padding: 8px 16px; color: #888; font-size: 12px;">UTENTI</div>';
                users.forEach(user => {
                    html += `
                        <a href="/profile.html?user=${user.username}" class="search-result-item">
                            <img src="${user.avatar_url || 'https://placehold.co/40x40/282828/FFD700?text=?'}" 
                                 class="search-result-avatar">
                            <div class="search-result-info">
                                <div class="search-result-name">
                                    ${user.username}
                                    ${user.is_verified ? '✓' : ''}
                                    ${user.is_live ? '<span class="live-badge-small">LIVE</span>' : ''}
                                </div>
                                <div class="search-result-meta">
                                    ${user.followers_count} followers
                                </div>
                            </div>
                        </a>
                    `;
                });
            }
            
            if (!html) {
                html = '<div style="padding: 20px; text-align: center; color: #666;">Nessun risultato</div>';
            }
            
            resultsDiv.innerHTML = html;
            resultsDiv.classList.add('active');
            
        } catch (error) {
            console.error('Errore ricerca:', error);
        }
    }, 300);
}

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================
function setupRealtimeSubscriptions() {
    // Subscribe to new streams
    supabaseClient
        .channel('public:streams')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'streams' },
            (payload) => {
                console.log('Stream update:', payload);
                loadStreams(selectedCategory);
                loadStats();
            }
        )
        .subscribe();
    
    // Subscribe to notifications
    notificationChannel = supabaseClient
        .channel(`notifications:${currentUser.id}`)
        .on('postgres_changes',
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `recipient_id=eq.${currentUser.id}`
            },
            (payload) => {
                console.log('New notification:', payload);
                showNotification(payload.new);
                loadNotifications();
            }
        )
        .subscribe();
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.innerHTML = `
            <div style="text-align: center; color: #ff4444;">
                <h2>Errore</h2>
                <p>${message}</p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #FFD700;
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Riprova</button>
            </div>
        `;
    }
}

function showNotification(notification) {
    // Crea notifica toast
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <strong>${notification.title}</strong>
        <p>${notification.message}</p>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// =====================================================
// TOGGLE FUNCTIONS
// =====================================================
window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('mobile-open');
}

window.toggleNotifications = function() {
    // Implementa panel notifiche
    alert('Panel notifiche in sviluppo!');
}

window.toggleTheme = function() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

window.logout = async function() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = '/';
    } catch (error) {
        console.error('Errore logout:', error);
    }
}

// =====================================================
// REFRESH PERIODICO
// =====================================================
setInterval(() => {
    loadStats();
    loadStreams(selectedCategory);
    loadFollowing();
}, 30000); // Aggiorna ogni 30 secondi
