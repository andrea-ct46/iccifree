// =================================================================================
// ICCI FREE - LOGICA DELLA DASHBOARD DINAMICA
// =================================================================================

/**
 * Funzione principale che inizializza la dashboard.
 */
async function initializeDashboard() {
    // Controlla chi è l'utente loggato.
    const user = await checkUser();
    if (!user) {
        window.location.replace('/auth.html');
        return;
    }

    try {
        // Recuperiamo i dati del profilo per popolare l'header.
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        // Se il profilo esiste, mostra l'app e popola i dati.
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';

        populateUserData(profile);

        // Ora chiamiamo la nuova funzione asincrona per caricare il feed.
        await populateStreamFeed();

    } catch (error) {
        console.error("Errore nel caricare i dati della dashboard:", error);
        window.location.replace('/setup-profile.html');
    }
}

/**
 * Popola gli elementi dell'interfaccia con i dati dell'utente.
 */
function populateUserData(profile) {
    const userAvatar = document.getElementById('userAvatar');
    const myProfileLink = document.getElementById('myProfileLink'); 

    if (userAvatar && profile.avatar_url) {
        userAvatar.src = profile.avatar_url;
    }

    if (myProfileLink && profile.username) {
        myProfileLink.href = `/profile.html?user=${profile.username}`;
    }
}

/**
 * NUOVA VERSIONE: Carica gli stream reali dal database e li mostra nel feed.
 */
async function populateStreamFeed() {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;

    try {
        // 1. Chiediamo a Supabase tutti gli stream con status 'live'.
        const { data: streams, error } = await supabaseClient
            .from('streams')
            .select(`
                *,
                profiles ( username, avatar_url )
            `)
            .eq('status', 'live')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Se non ci sono dirette, mostriamo un messaggio.
        if (!streams || streams.length === 0) {
            streamGrid.innerHTML = '<p class="empty-feed">🎥 Nessuna diretta al momento. Sii il primo ad andare live!</p>';
            return;
        }

        // 3. Se ci sono dirette, costruiamo le card HTML.
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
                                <img src="${streamer.avatar_url || 'https://placehold.co/40x40/282828/A0A0A0?text=?'}" alt="Avatar di ${streamer.username}">
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

    } catch (error) {
        console.error("Errore nel caricamento del feed:", error.message);
        streamGrid.innerHTML = '<p class="empty-feed">⚠️ Impossibile caricare le dirette. Riprova più tardi.</p>';
    }
}

// Aggiungiamo uno stile per il messaggio di feed vuoto nel CSS se non c'è già.
document.head.insertAdjacentHTML('beforeend', `
<style>
    .stream-card-link { 
        text-decoration: none; 
        color: inherit; 
    }
    .empty-feed { 
        color: var(--text-secondary); 
        text-align: center; 
        margin-top: 20px;
    }
</style>
`);

// Avvia l'inizializzazione della dashboard.
document.addEventListener('DOMContentLoaded', initializeDashboard);