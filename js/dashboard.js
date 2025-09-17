// =================================================================================
// ICCI FREE - LOGICA DELLA DASHBOARD (VERSIONE AVANZATA CON WEBRTC)
// =================================================================================

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
        await populateStreamFeed();

    } catch (error) {
        console.error("Errore nel caricare i dati della dashboard:", error);
        document.getElementById('loadingState').innerHTML = `<p>Errore nel caricamento della dashboard. <a href="/setup-profile.html">Configura il profilo</a></p>`;
    }
}

function populateUserData(profile) {
    const userAvatar = document.getElementById('userAvatar');
    const myProfileLink = document.getElementById('myProfileLink');

    if (userAvatar && profile.avatar_url) userAvatar.src = profile.avatar_url;
    if (myProfileLink && profile.username) myProfileLink.href = `/profile.html?user=${profile.username}`;
}

async function populateStreamFeed() {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;

    try {
        const { data: streams, error } = await supabaseClient
            .from('streams')
            .select(`*, profiles ( username, avatar_url )`)
            .eq('status', 'live')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!streams || streams.length === 0) {
            streamGrid.innerHTML = `
                <div class="empty-feed">
                    <p>🎥 Nessuna diretta al momento</p>
                    <p>Sii il primo ad andare live!</p>
                    <a href="/golive-webrtc.html" class="go-live-empty-btn">GO LIVE ORA</a>
                </div>
            `;
            return;
        }

        let streamHTML = '';
        streams.forEach(stream => {
            const streamer = stream.profiles;
            if (!streamer) return;

            // Colori per categorie
            const categoryColors = {
                "Gaming": "#9146FF",
                "Musica": "#1DB954",
                "Arte": "#FF9F1C",
                "LIVE": "#E50914"
            };
            const cat = stream.category || "LIVE";
            const catColor = categoryColors[cat] || "#FFD700";

            // Genera la card dello stream
            streamHTML += `
                <a href="/stream-webrtc.html?id=${stream.id}" class="stream-card-link">
                    <div class="stream-card">
                        <div class="stream-thumbnail">
                            <img src="${stream.thumbnail_url || `https://placehold.co/320x180/0d0d0d/${catColor.slice(1)}?text=${cat}`}" alt="Stream Thumbnail">
                            <div class="live-indicator">
                                <span class="live-dot">●</span> LIVE
                            </div>
                            <div class="viewer-counter">
                                👁️ ${stream.viewer_count || Math.floor(Math.random()*500)}
                            </div>
                        </div>
                        <div class="stream-info">
                            <div class="streamer-avatar">
                                <img src="${streamer.avatar_url || 'https://placehold.co/40x40/282828/FFD700?text=?'}" alt="${streamer.username} avatar">
                            </div>
                            <div class="stream-details">
                                <div class="title">${stream.title}</div>
                                <div class="streamer-name">${streamer.username}</div>
                                <div class="category" style="color: ${catColor}; font-weight: bold;">${cat}</div>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        });

        streamGrid.innerHTML = streamHTML;

    } catch (error) {
        console.error("Errore nel caricamento del feed:", error.message);
        streamGrid.innerHTML = '<p class="empty-feed">Impossibile caricare le dirette. Riprova più tardi.</p>';
    }
}

// Aggiorna il link GO LIVE nell'header
document.addEventListener('DOMContentLoaded', () => {
    const goLiveBtn = document.querySelector('.go-live-btn');
    if (goLiveBtn) goLiveBtn.href = '/golive-webrtc.html';
    
    initializeDashboard();
});

// CSS aggiuntivo per empty state e live indicators
const style = document.createElement('style');
style.textContent = `
    .empty-feed {
        text-align: center;
        color: var(--text-secondary);
        padding: 60px 20px;
    }
    .empty-feed p { margin: 10px 0; font-size: 18px; }
    .go-live-empty-btn {
        display: inline-block;
        margin-top: 20px;
        padding: 12px 30px;
        background: linear-gradient(135deg, var(--primary-yellow) 0%, #FFB700 100%);
        color: var(--background-dark);
        text-decoration: none;
        border-radius: 12px;
        font-weight: 700;
        transition: all 0.3s;
    }
    .go-live-empty-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(255, 215, 0, 0.3);
    }
    .stream-card-link { text-decoration: none; color: inherit; }
    .viewer-counter {
        position: absolute;
        bottom: 12px;
        right: 12px;
        background: rgba(0,0,0,0.8);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
    }
    .live-indicator {
        position: absolute;
        top: 12px;
        left: 12px;
        background: #ff3b30;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 4px;
        animation: pulse 2s infinite;
    }
    .live-dot { animation: blink 1s infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;
document.head.appendChild(style);
