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
        const { data: streams, error } = await supabaseClient
            .from('streams')
            .select(`
                *,
                profiles!user_id (
                    username,
                    avatar_url
                )
            `)
            .eq('status', 'live')
            .order('created_at', { ascending: false });
        
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
                    <h3 style="color: #fff;">Nessuna diretta al momento</h3>
                    <p>Sii il primo ad andare live!</p>
                    <a href="/golive-webrtc.html" style="
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 30px;
                        background: #FFD700;
                        color: #000;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: 700;
                    ">🔴 GO LIVE ORA</a>
                </div>
            `;
            return;
        }
        
        streamGrid.innerHTML = streams.map(stream => {
            const streamer = stream.profiles;
            if (!streamer) return '';
            
            return `
                <a href="/stream-webrtc.html?id=${stream.id}" style="text-decoration: none; color: inherit;">
                    <div class="stream-card">
                        <div class="stream-thumbnail">
                            <img src="https://placehold.co/320x180/0d0d0d/FFD700?text=LIVE" alt="Stream">
                            <div class="live-indicator">● LIVE</div>
                            <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                👁️ ${stream.viewer_count || 0}
                            </div>
                        </div>
                        <div class="stream-info">
                            <div class="streamer-avatar">
                                <img src="${streamer.avatar_url || 'https://placehold.co/40x40/282828/FFD700?text=?'}" alt="${streamer.username}">
                            </div>
                            <div class="stream-details">
                                <div class="title">${stream.title || 'Untitled Stream'}</div>
                                <div class="streamer-name">${streamer.username}</div>
                                <div class="category">${stream.category || 'Live Stream'}</div>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading streams:', error);
        streamGrid.innerHTML = '<div style="text-align: center; color: #ff4444;">Errore caricamento streams</div>';
    }
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    const resultsDiv = document.getElementById('searchResults');
    
    if (query.length < 2) {
        if (resultsDiv) resultsDiv.classList.remove('active');
        return;
    }
    
    try {
        const { data: users } = await supabaseClient
            .rpc('search_users', { search_query: query });
        
        const { data: streams } = await supabaseClient
            .rpc('search_streams', { search_query: query });
        
        let html = '';
        
        if (streams && streams.length > 0) {
            html += '<div style="padding: 8px 16px; color: #888; font-size: 12px;">LIVE ORA</div>';
            streams.forEach(stream => {
                html += `
                    <a href="/stream-webrtc.html?id=${stream.id}" class="search-result-item">
                        <img src="${stream.avatar_url || 'https://placehold.co/40x40/282828/FFD700?text=?'}" 
                             class="search-result-avatar">
                        <div class="search-result-info">
                            <div class="search-result-name">${stream.title}</div>
                            <div class="search-result-meta">${stream.username} • ${stream.category}</div>
                        </div>
                    </a>
                `;
            });
        }
        
        if (users && users.length > 0) {
            html += '<div style="padding: 8px 16px; color: #888; font-size: 12px;">UTENTI</div>';
            users.forEach(user => {
                html += `
                    <a href="/profile.html?user=${user.username}" class="search-result-item">
                        <img src="${user.avatar_url || 'https://placehold.co/40x40/282828/FFD700?text=?'}" 
                             class="search-result-avatar">
                        <div class="search-result-info">
                            <div class="search-result-name">${user.username}</div>
                            <div class="search-result-meta">${user.followers_count} followers</div>
                        </div>
                    </a>
                `;
            });
        }
        
        if (!html) {
            html = '<div style="padding: 20px; text-align: center; color: #666;">Nessun risultato</div>';
        }
        
        if (resultsDiv) {
            resultsDiv.innerHTML = html;
            resultsDiv.classList.add('active');
        }
        
    } catch (error) {
        console.error('Search error:', error);
    }
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

window.logout = async function() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}
