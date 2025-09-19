// ======================================================
// ICCI FREE - DASHBOARD CONTROLLER COMPLETO
// ======================================================

let currentUser = null;
let currentProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inizializzazione dashboard...');
    
    try {
        // Check auth
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error || !user) {
            console.log('User not authenticated, redirecting...');
            window.location.href = '/auth.html';
            return;
        }
        
        currentUser = user;
        console.log('User authenticated:', user.email);
        
        // Load profile
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (profileError) {
            console.error('Profile error:', profileError);
            if (profileError.code === 'PGRST116') {
                window.location.href = '/setup-profile.html';
                return;
            }
        }
        
        if (!profile || !profile.username || !profile.date_of_birth) {
            window.location.href = '/setup-profile.html';
            return;
        }
        
        currentProfile = profile;
        
        // Update UI
        updateUserInterface();
        
        // Hide loading
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Load streams
        await loadStreams();
        
        // Setup search
        setupSearch();
        
        // Setup realtime updates
        setupRealtimeUpdates();
        
        // Auto-refresh
        setInterval(loadStreams, 15000);
        
    } catch (error) {
        console.error('Error:', error);
        showErrorState(error.message);
    }
});

// ============= UPDATE UI =============
function updateUserInterface() {
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.src = currentProfile.avatar_url || 
            `https://placehold.co/40x40/FFD700/000?text=${currentProfile.username.charAt(0).toUpperCase()}`;
    }
    
    const myProfileLink = document.getElementById('myProfileLink');
    if (myProfileLink) {
        myProfileLink.href = `/profile.html?user=${currentProfile.username}`;
    }
}

// ============= LOAD STREAMS =============
async function loadStreams() {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;
    
    try {
        console.log('🔍 Caricamento streams...');
        
        // Query per stream live
        const { data: streams, error } = await supabaseClient
            .from('streams')
            .select(`
                *,
                profiles!user_id (
                    username,
                    avatar_url,
                    followers_count
                )
            `)
            .eq('status', 'live')
            .is('ended_at', null)
            .order('started_at', { ascending: false });
        
        if (error) throw error;
        
        // Debug info
        console.log(`✅ Trovati ${streams?.length || 0} stream live`);
        
        if (!streams || streams.length === 0) {
            showEmptyState(streamGrid);
            return;
        }
        
        // Filtra stream validi
        const validStreams = streams.filter(stream => 
            stream.profiles && stream.profiles.username
        );
        
        // Render streams
        streamGrid.innerHTML = validStreams.map((stream, index) => 
            createStreamCard(stream, index)
        ).join('');
        
        // Add hover effects
        addStreamCardEffects();
        
    } catch (error) {
        console.error('❌ Errore caricamento streams:', error);
        showErrorInGrid(streamGrid, error.message);
    }
}

// ============= CREATE STREAM CARD =============
function createStreamCard(stream, index) {
    const streamer = stream.profiles;
    const timeAgo = getTimeAgo(stream.started_at);
    
    return `
        <a href="/stream-webrtc.html?id=${stream.id}" 
           class="stream-card-link"
           data-stream-id="${stream.id}">
            <div class="stream-card" style="animation-delay: ${index * 0.1}s;">
                <div class="stream-thumbnail">
                    <img src="https://picsum.photos/320/180?random=${stream.id}" 
                         alt="Stream Thumbnail" 
                         loading="lazy">
                    
                    <div class="live-indicator">
                        <span style="animation: blink 1.5s infinite;">●</span> LIVE
                    </div>
                    
                    <div class="viewer-counter">
                        👁️ ${formatViewerCount(stream.viewer_count || 0)}
                    </div>
                    
                    <div class="stream-duration" style="
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        background: rgba(0, 0, 0, 0.7);
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: 600;
                        backdrop-filter: blur(5px);
                    ">
                        ${timeAgo}
                    </div>
                </div>
                
                <div class="stream-info">
                    <div class="streamer-avatar">
                        <img src="${getStreamerAvatar(streamer)}" 
                             alt="${streamer.username}"
                             loading="lazy">
                        ${streamer.followers_count > 1000 ? '<div class="verified-badge">✓</div>' : ''}
                    </div>
                    
                    <div class="stream-details">
                        <div class="title">${escapeHtml(stream.title || 'Untitled Stream')}</div>
                        <div class="streamer-name">${escapeHtml(streamer.username)}</div>
                        <div class="category">
                            <span class="category-tag">${escapeHtml(stream.category || 'Live Stream')}</span>
                            ${streamer.followers_count ? `• ${formatNumber(streamer.followers_count)} followers` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </a>
    `;
}

// ============= EMPTY STATE =============
function showEmptyState(container) {
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #888;">
            <p style="font-size: 48px;">📺</p>
            <h3 style="color: #fff; margin: 16px 0;">Nessuna diretta al momento</h3>
            <p>Sii il primo ad andare live!</p>
            <a href="/golive.html" style="
                display: inline-block; 
                margin-top: 20px; 
                padding: 12px 30px; 
                background: linear-gradient(135deg, #FFD700 0%, #FFB700 100%); 
                color: #000; 
                text-decoration: none; 
                border-radius: 12px; 
                font-weight: 700;
                transition: all 0.3s;
            " onmouseover="this.style.transform='translateY(-2px)'" 
               onmouseout="this.style.transform='translateY(0)'">
                🔴 GO LIVE ORA
            </a>
        </div>
    `;
}

// ============= ERROR STATE =============
function showErrorState(message) {
    document.getElementById('loadingState').innerHTML = `
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

function showErrorInGrid(container, message) {
    container.innerHTML = `
        <div style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px 20px;
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid #ff4444;
            border-radius: 12px;
            color: #ff4444;
        ">
            <h3>⚠️ Errore Caricamento</h3>
            <p>${message}</p>
            <button onclick="loadStreams()" style="
                margin-top: 16px;
                padding: 10px 20px;
                background: #FFD700;
                color: #000;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
            ">🔄 Riprova</button>
        </div>
    `;
}

// ============= SEARCH =============
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }
        
        try {
            // Search users
            const { data: users } = await supabaseClient
                .from('profiles')
                .select('username, avatar_url, followers_count, bio')
                .or(`username.ilike.%${query}%,bio.ilike.%${query}%`)
                .limit(5);
            
            // Search live streams
            const { data: streams } = await supabaseClient
                .from('streams')
                .select(`
                    *,
                    profiles!user_id (username, avatar_url)
                `)
                .eq('status', 'live')
                .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
                .limit(5);
            
            displaySearchResults(searchResults, users, streams, query);
            
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff4444;">Errore nella ricerca</div>';
            searchResults.classList.add('active');
        }
    }, 300));
    
    // Close search on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            searchResults.classList.remove('active');
        }
    });
}

function displaySearchResults(container, users, streams, query) {
    let html = '';
    
    if (streams && streams.length > 0) {
        html += '<div style="padding: 8px 16px; color: #FFD700; font-size: 12px; font-weight: 600;">🔴 LIVE NOW</div>';
        streams.forEach(stream => {
            if (!stream.profiles) return;
            html += `
                <a href="/stream-webrtc.html?id=${stream.id}" class="search-result-item">
                    <img src="${getStreamerAvatar(stream.profiles)}" class="search-result-avatar">
                    <div class="search-result-info">
                        <div class="search-result-name">
                            ${escapeHtml(stream.title)}
                            <span class="live-badge-small">LIVE</span>
                        </div>
                        <div class="search-result-meta">
                            ${escapeHtml(stream.profiles.username)} • ${escapeHtml(stream.category)} • ${stream.viewer_count || 0} viewers
                        </div>
                    </div>
                </a>
            `;
        });
    }
    
    if (users && users.length > 0) {
        html += '<div style="padding: 8px 16px; color: #888; font-size: 12px; font-weight: 600;">👤 USERS</div>';
        users.forEach(user => {
            html += `
                <a href="/profile.html?user=${user.username}" class="search-result-item">
                    <img src="${user.avatar_url || getDefaultAvatar(user.username)}" class="search-result-avatar">
                    <div class="search-result-info">
                        <div class="search-result-name">${escapeHtml(user.username)}</div>
                        <div class="search-result-meta">
                            ${formatNumber(user.followers_count || 0)} followers
                            ${user.bio ? ' • ' + escapeHtml(user.bio.substring(0, 30) + '...') : ''}
                        </div>
                    </div>
                </a>
            `;
        });
    }
    
    if (!html) {
        html = `<div style="padding: 20px; text-align: center; color: #666;">Nessun risultato per "${escapeHtml(query)}"</div>`;
    }
    
    container.innerHTML = html;
    container.classList.add('active');
}

// ============= REALTIME UPDATES =============
function setupRealtimeUpdates() {
    const channel = supabaseClient.channel('dashboard_streams');
    
    channel.on(
        'postgres_changes',
        { 
            event: '*', 
            schema: 'public', 
            table: 'streams'
        },
        (payload) => {
            console.log('Stream update:', payload);
            
            // Debounce reload
            clearTimeout(window.streamReloadTimeout);
            window.streamReloadTimeout = setTimeout(() => {
                loadStreams();
            }, 1000);
        }
    );
    
    channel.subscribe((status) => {
        console.log('Realtime status:', status);
    });
}

// ============= UTILITY FUNCTIONS =============
function getStreamerAvatar(streamer) {
    if (streamer.avatar_url) return streamer.avatar_url;
    const colors = ['FF5733','33FF57','3357FF','FF33F5','F5FF33','33FFF5'];
    const colorIndex = streamer.username.charCodeAt(0) % colors.length;
    const initials = streamer.username.substring(0, 2).toUpperCase();
    return `https://placehold.co/40x40/${colors[colorIndex]}/FFFFFF?text=${initials}`;
}

function getDefaultAvatar(username) {
    const colors = ['FF5733','33FF57','3357FF','FF33F5','F5FF33','33FFF5'];
    const colorIndex = username.charCodeAt(0) % colors.length;
    const initials = username.substring(0, 2).toUpperCase();
    return `https://placehold.co/40x40/${colors[colorIndex]}/FFFFFF?text=${initials}`;
}

function formatViewerCount(count) {
    if (count < 1000) return count.toString();
    if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
    return (count / 1000000).toFixed(1) + 'M';
}

function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
}

function getTimeAgo(startedAt) {
    const now = new Date();
    const started = new Date(startedAt);
    const diffMs = now - started;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}g`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function addStreamCardEffects() {
    const cards = document.querySelectorAll('.stream-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ============= GLOBAL FUNCTIONS =============
window.logout = async function() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

window.filterByCategory = async function(category) {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;
    
    streamGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">🔄 Caricamento...</div>';
    
    try {
        let query = supabaseClient
            .from('streams')
            .select(`
                *,
                profiles!user_id (
                    username,
                    avatar_url,
                    followers_count
                )
            `)
            .eq('status', 'live')
            .is('ended_at', null);
        
        if (category !== 'all') {
            query = query.eq('category', category);
        }
        
        const { data: streams, error } = await query.order('started_at', { ascending: false });
        
        if (error) throw error;
        
        if (!streams || streams.length === 0) {
            streamGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #888;">
                    <p style="font-size: 48px;">📺</p>
                    <h3>Nessuna diretta ${category !== 'all' ? 'in ' + category : ''}</h3>
                    <a href="/golive.html" style="
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 24px;
                        background: #FFD700;
                        color: #000;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: 700;
                    ">GO LIVE ORA</a>
                </div>
            `;
            return;
        }
        
        const validStreams = streams.filter(stream => 
            stream.profiles && stream.profiles.username
        );
        
        streamGrid.innerHTML = validStreams.map((stream, index) => 
            createStreamCard(stream, index)
        ).join('');
        
        addStreamCardEffects();
        
    } catch (error) {
        console.error('Filter error:', error);
        streamGrid.innerHTML = '<div style="text-align: center; color: #ff4444;">Errore nel filtro</div>';
    }
}

// ============= AUTO-CLEANUP =============
if (window.location.pathname === '/dashboard.html') {
    // Clean up old streams on load
    (async () => {
        try {
            const { error } = await supabaseClient
                .from('streams')
                .update({ status: 'offline' })
                .lt('started_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
                .eq('status', 'live');
                
            if (error) console.warn('Cleanup warning:', error);
        } catch (e) {
            console.warn('Cleanup error:', e);
        }
    })();
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadStreams();
        }
    });
    
    // Handle refresh params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('refresh') || urlParams.has('force_refresh')) {
        setTimeout(loadStreams, 2000);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

console.log('✅ Dashboard controller loaded successfully');
