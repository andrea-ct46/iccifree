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
                // Profile doesn't exist
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
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.src = profile.avatar_url || 
                `https://placehold.co/40x40/FFD700/000?text=${profile.username.charAt(0).toUpperCase()}`;
        }
        
        const myProfileLink = document.getElementById('myProfileLink');
        if (myProfileLink) {
            myProfileLink.href = `/profile.html?user=${profile.username}`;
            myProfileLink.innerHTML = '👤 Il mio Profilo';
        }
        
        // Hide loading
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Load streams
        await loadStreams();
        
        // Setup search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
        
        // Setup realtime updates for streams
        setupRealtimeUpdates();
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingState').innerHTML = `
            <div style="text-align: center; color: #ff4444;">
                <h2>Errore</h2>
                <p>${error.message}</p>
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
});

async function loadStreams() {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;
    
    try {
        console.log('🔍 Caricamento streams con FIX...');
        
        // ✅ CORREZIONE: Query più specifica per stream live
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
            .is('ended_at', null)  // ✅ Escludi stream già terminati
            .order('started_at', { ascending: false });
        
        console.log('🔍 Query risultati:', streams?.length || 0, 'streams trovati');
        
        if (error) {
            console.error('❌ Errore query streams:', error;
            throw error;
        }
        
        // ✅ DEBUG: Mostra tutti gli stream per debug
        const { data: allStreams } = await supabaseClient
            .from('streams')
            .select('id, status, title, started_at, ended_at, profiles!user_id(username)')
            .order('created_at', { ascending: false })
            .limit(10);
            
        console.log('🔍 DEBUG - Tutti gli stream recenti:', allStreams);
        
        if (!streams || streams.length === 0) {
            streamGrid.innerHTML = `
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
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">🔴 GO LIVE ORA</a>
                    <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; font-size: 13px; color: #666;">
                        <strong>📊 DEBUG INFO:</strong><br>
                        Stream totali nel database: ${allStreams?.length || 0}<br>
                        Stream con status 'live': ${allStreams?.filter(s => s.status === 'live')?.length || 0}<br>
                        <details style="margin-top: 10px;">
                            <summary style="cursor: pointer; color: #FFD700;">Dettagli tecnici</summary>
                            <pre style="font-size: 11px; margin-top: 10px; color: #999; text-align: left;">${JSON.stringify(allStreams, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            `;
            return;
        }
        
        // ✅ CORREZIONE: Filtra stream con profili validi
        const validStreams = streams.filter(stream => {
            if (!stream.profiles || !stream.profiles.username) {
                console.warn('⚠️ Stream senza profilo valido:', stream.id);
                return false;
            }
            return true;
        });
        
        console.log('✅ Stream validi dopo filtro:', validStreams.length);
        
        // ✅ CORREZIONE: Mostra stream con link corretto
        streamGrid.innerHTML = validStreams.map((stream, index) => {
            const streamer = stream.profiles;
            const timeAgo = getTimeAgo(stream.started_at);
            
            return `
                <a href="/stream-webrtc.html?id=${stream.id}" 
                   style="text-decoration: none; color: inherit;"
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
                                ${(streamer.followers_count > 1000) ? '<div class="verified-badge">✓</div>' : ''}
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
        }).join('');
        
        // Add effects
        addStreamCardEffects();
        
        console.log('✅ Dashboard aggiornata con', validStreams.length, 'stream live');
        
    } catch (error) {
        console.error('❌ Errore caricamento streams:', error);
        streamGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(255, 68, 68, 0.1); border: 1px solid #ff4444; border-radius: 12px; color: #ff4444;">
                <h3>⚠️ Errore Caricamento</h3>
                <p>Impossibile caricare gli stream: ${error.message}</p>
                <button onclick="loadStreams()" style="margin-top: 16px; padding: 10px 20px; background: #FFD700; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">🔄 Riprova</button>
            </div>
        `;
    }
}

// Utility functions - aggiungi queste DOPO la funzione loadStreams
function getStreamerAvatar(streamer) {
    if (streamer.avatar_url) return streamer.avatar_url;
    const colors = ['FF5733','33FF57','3357FF','FF33F5','F5FF33','33FFF5'];
    const colorIndex = streamer.username.charCodeAt(0) % colors.length;
    const initials = streamer.username.substring(0, 2).toUpperCase();
    return `https://placehold.co/40x40/${colors[colorIndex]}/FFFFFF?text=${initials}`;
}

function formatViewerCount(count) {
    if (count < 1000) return count.toString();
    if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
    return (count / 1000000).toFixed(1) + 'M';
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
});
        
        if (error) throw error;
        
        if (!streams || streams.length === 0) {
            streamGrid.innerHTML = `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    color: #888;
                ">
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
                    ">🔴 GO LIVE ORA</a>
                </div>
            `;
            return;
        }
        
        streamGrid.innerHTML = streams.map(stream => {
            if (!stream.username) return '';
            
            const duration = stream.duration ? formatDuration(stream.duration) : 'Live';
            
            return `
                <a href="/stream-webrtc.html?id=${stream.id}" style="text-decoration: none; color: inherit;">
                    <div class="stream-card">
                        <div class="stream-thumbnail">
                            <img src="https://picsum.photos/320/180?random=${stream.id}" 
                                 alt="Stream Thumbnail" 
                                 loading="lazy">
                            <div class="live-indicator">
                                <span>●</span> LIVE
                            </div>
                            <div class="viewer-counter">
                                👁️ ${formatNumber(stream.current_viewers || 0)}
                            </div>
                            <div class="duration-badge">${duration}</div>
                        </div>
                        <div class="stream-info">
                            <div class="streamer-avatar">
                                <img src="${stream.avatar_url || getDefaultAvatar(stream.username)}" 
                                     alt="${stream.username}"
                                     loading="lazy">
                                ${stream.followers_count > 1000 ? '<div class="verified-badge">✓</div>' : ''}
                            </div>
                            <div class="stream-details">
                                <div class="title">${escapeHtml(stream.title || 'Untitled Stream')}</div>
                                <div class="streamer-name">${escapeHtml(stream.username)}</div>
                                <div class="category">
                                    <span class="category-tag">${escapeHtml(stream.category || 'Live Stream')}</span>
                                    ${stream.followers_count ? `• ${formatNumber(stream.followers_count)} followers` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
        
        // Add hover effects
        addStreamCardEffects();
        
    } catch (error) {
        console.error('Error loading streams:', error);
        streamGrid.innerHTML = `
            <div style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px 20px;
                color: #ff4444;
            ">
                <p style="font-size: 32px;">⚠️</p>
                <h3>Errore nel caricamento</h3>
                <p>${error.message}</p>
                <button onclick="loadStreams()" style="
                    margin-top: 16px;
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

function setupRealtimeUpdates() {
    // Listen for real-time updates on streams table
    const channel = supabaseClient.channel('dashboard_streams');
    
    channel.on(
        'postgres_changes',
        { 
            event: '*', 
            schema: 'public', 
            table: 'streams',
            filter: 'status=eq.live'
        },
        (payload) => {
            console.log('Stream update:', payload);
            
            // Debounce reload to avoid too many updates
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

async function handleSearch(event) {
    const query = event.target.value.trim();
    const resultsDiv = document.getElementById('searchResults');
    
    if (query.length < 2) {
        if (resultsDiv) resultsDiv.classList.remove('active');
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
            .from('live_streams')
            .select('*')
            .or(`title.ilike.%${query}%,category.ilike.%${query}%,username.ilike.%${query}%`)
            .limit(5);
        
        let html = '';
        
        if (streams && streams.length > 0) {
            html += '<div style="padding: 8px 16px; color: #FFD700; font-size: 12px; font-weight: 600;">🔴 LIVE NOW</div>';
            streams.forEach(stream => {
                html += `
                    <a href="/stream-webrtc.html?id=${stream.id}" class="search-result-item">
                        <img src="${stream.avatar_url || getDefaultAvatar(stream.username)}" 
                             class="search-result-avatar">
                        <div class="search-result-info">
                            <div class="search-result-name">
                                ${escapeHtml(stream.title)}
                                <span class="live-badge-small">LIVE</span>
                            </div>
                            <div class="search-result-meta">
                                ${escapeHtml(stream.username)} • ${escapeHtml(stream.category)} • ${stream.current_viewers || 0} viewers
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
                        <img src="${user.avatar_url || getDefaultAvatar(user.username)}" 
                             class="search-result-avatar">
                        <div class="search-result-info">
                            <div class="search-result-name">${escapeHtml(user.username)}</div>
                            <div class="search-result-meta">
                                ${user.followers_count || 0} followers
                                ${user.bio ? ' • ' + escapeHtml(user.bio.substring(0, 30) + '...') : ''}
                            </div>
                        </div>
                    </a>
                `;
            });
        }
        
        if (!html) {
            html = '<div style="padding: 20px; text-align: center; color: #666;">Nessun risultato per "' + escapeHtml(query) + '"</div>';
        }
        
        if (resultsDiv) {
            resultsDiv.innerHTML = html;
            resultsDiv.classList.add('active');
        }
        
    } catch (error) {
        console.error('Search error:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff4444;">Errore nella ricerca</div>';
            resultsDiv.classList.add('active');
        }
    }
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

// UTILITY FUNCTIONS
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

function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
}

function formatDuration(duration) {
    // duration is a PostgreSQL interval
    if (typeof duration === 'string') {
        const match = duration.match(/(\d+):(\d+):(\d+)/);
        if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
        }
    }
    return 'Live';
}

function getDefaultAvatar(username) {
    const colors = ['FF5733','33FF57','3357FF','FF33F5','F5FF33','33FFF5'];
    const colorIndex = username.charCodeAt(0) % colors.length;
    const initials = username.substring(0, 2).toUpperCase();
    return `https://placehold.co/40x40/${colors[colorIndex]}/FFFFFF?text=${initials}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// GLOBAL FUNCTIONS
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
        let query = supabaseClient.from('live_streams').select('*');
        
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
        
        // Reload streams with filtered data
        loadStreams();
        
    } catch (error) {
        console.error('Filter error:', error);
        streamGrid.innerHTML = '<div style="text-align: center; color: #ff4444;">Errore nel filtro</div>';
    }
}
// ===================================================
// AGGIUNGI ALLA FINE DEL dashboard.js
// ===================================================

// Auto-refresh per streams nella dashboard
async function forceRefreshStreams() {
    console.log('🔄 Auto-refresh streams...');
    
    try {
        // Prima pulisci streams "fantasma" (offline ma segnati come live)
        const { error: cleanupError } = await supabaseClient
            .from('streams')
            .update({ status: 'offline' })
            .lt('started_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Più di 6 ore fa
            .eq('status', 'live');
            
        if (cleanupError) {
            console.warn('⚠️ Cleanup warning:', cleanupError);
        }
        
        // Poi ricarica la lista streams
        await loadStreams();
        
    } catch (error) {
        console.error('❌ Errore auto-refresh:', error);
    }
}

// Setup auto-refresh solo nella dashboard
if (window.location.pathname === '/dashboard.html' || window.location.pathname === '/') {
    
    // Auto-refresh ogni 15 secondi
    setInterval(forceRefreshStreams, 15000);
    
    // Refresh immediato se la pagina viene caricata con parametri speciali
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('refresh') || urlParams.has('force_refresh')) {
        console.log('🔄 Force refresh richiesto via URL');
        setTimeout(forceRefreshStreams, 2000);
        
        // Pulisci l'URL dopo il refresh
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
    
    // Refresh quando la pagina diventa visibile (cambio tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('🔄 Pagina visibile - refresh streams');
            setTimeout(forceRefreshStreams, 1000);
        }
    });
    
    console.log('✅ Auto-refresh dashboard attivato');
}
