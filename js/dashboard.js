// js/dashboard.js
async function initializeDashboard() {
    const user = await checkUser();
    if (!user) { window.location.replace('/auth.html'); return; }
    try {
        const { data: profile, error } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
        if (error) throw error;
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        populateUserData(profile);
        await populateStreamFeed();
    } catch (err) {
        console.error('Errore dashboard:', err);
        window.location.replace('/setup-profile.html');
    }
}

function populateUserData(profile) {
    const userAvatar = document.getElementById('userAvatar');
    const myProfileLink = document.getElementById('myProfileLink');
    if (userAvatar) userAvatar.src = profile.avatar_url || 'https://placehold.co/40x40/282828/A0A0A0?text=?';
    if (myProfileLink && profile.username) myProfileLink.href = `/profile.html?user=${profile.username}`;
}

async function populateStreamFeed() {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;
    try {
        const { data: streams, error } = await supabaseClient
            .from('streams')
            .select('*, profiles(username, avatar_url)')
            .eq('status', 'live')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!streams || streams.length === 0) { streamGrid.innerHTML = '<p class="empty-feed">Nessuna diretta al momento.</p>'; return; }
        let streamHTML = '';
        streams.forEach(stream => {
            const streamer = stream.profiles;
            if (!streamer) return;
            streamHTML += `
                <a href="/stream-webrtc.html?id=${stream.id}" class="stream-card-link">
                    <div class="stream-card">
                        <div class="stream-thumbnail">
                            <img src="https://placehold.co/300x170/181818/FFD700?text=${stream.category || 'LIVE'}" alt="Anteprima stream">
                            <div class="live-indicator">LIVE</div>
                        </div>
                        <div class="stream-info">
                            <div class="streamer-avatar">
                                <img src="${streamer.avatar_url || 'https://placehold.co/40x40/282828/A0A0A0?text=?'}" alt="${streamer.username}">
                            </div>
                            <div class="stream-details">
                                <div class="title">${stream.title || 'Diretta senza titolo'}</div>
                                <div class="streamer-name">${streamer.username}</div>
                                <div class="category">${stream.category || 'Nessuna categoria'}</div>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        });
        streamGrid.innerHTML = streamHTML;
    } catch (err) {
        console.error('Errore feed:', err);
        streamGrid.innerHTML = '<p class="empty-feed">Impossibile caricare le dirette. Riprova più tardi.</p>';
    }
}

document.addEventListener('DOMContentLoaded', initializeDashboard);