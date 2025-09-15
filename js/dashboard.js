// La logica della dashboard ora è più semplice e diretta.

/**
 * Funzione principale che inizializza la dashboard.
 */
async function initializeDashboard() {
    // Controlla chi è l'utente loggato.
    const user = await checkUser();

    // Se per qualche motivo un utente non loggato arriva qui, lo reindirizziamo al login.
    if (!user) {
        window.location.replace('/auth.html');
        return;
    }

    try {
        // Recuperiamo tutti i dati del profilo dal database.
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*') // Seleziona tutte le colonne
            .eq('id', user.id)
            .single();

        if (error) throw error;
        
        // Se il profilo esiste, nascondiamo il caricamento e mostriamo l'app.
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Usiamo i dati recuperati per popolare l'interfaccia.
        populateUserData(profile);
        populateStreamFeed();

    } catch (error) {
        console.error("Errore nel caricare i dati della dashboard:", error);
        // Se c'è un errore qui (es. il profilo è stato cancellato),
        // l'utente viene mandato alla pagina di setup per sicurezza.
        window.location.replace('/setup-profile.html');
    }
}

/**
 * Popola gli elementi dell'interfaccia con i dati dell'utente.
 * @param {object} profile - L'oggetto del profilo recuperato da Supabase.
 */
function populateUserData(profile) {
    const userAvatar = document.getElementById('userAvatar');
    const myProfileLink = document.getElementById('myProfileLink');

    if (userAvatar && profile.avatar_url) {
        userAvatar.src = profile.avatar_url;
    }

    // MODIFICA QUI: Imposta il link per puntare a /profile.html?user=NOMEUTENTE
    if (myProfileLink && profile.username) {
        myProfileLink.href = `/profile.html?user=${profile.username}`;
    }
}

/**
 * Popola il feed con stream di esempio.
 */
function populateStreamFeed() {
    const streamGrid = document.getElementById('streamGrid');
    if (!streamGrid) return;

    // Dati di esempio (verranno sostituiti con dati reali)
    const streams = [
        { title: "Discussione Libera sulla Politica", streamer: "LiberoPensatore", category: "Talk Show & IRL", viewers: 1200, avatar: "https://placehold.co/40x40/7DF9FF/000000?text=LP" },
        { title: "Gaming Senza Censure", streamer: "GamerOnFire", category: "Gaming", viewers: 854, avatar: "https://placehold.co/40x40/FF5733/FFFFFF?text=GF" },
    ];

    let streamHTML = '';
    streams.forEach(stream => {
        streamHTML += `
            <div class="stream-card">
                <div class="stream-thumbnail">
                    <img src="https://placehold.co/300x180/1a1a1a/00FF00?text=${stream.category}" alt="Stream Thumbnail">
                    <div class="live-indicator">LIVE</div>
                </div>
                <div class="stream-info">
                    <div class="streamer-avatar">
                        <img src="${stream.avatar}" alt="${stream.streamer} avatar">
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
    streamGrid.innerHTML = streamHTML;
}

// Avvia l'inizializzazione della dashboard non appena il DOM è pronto.
document.addEventListener('DOMContentLoaded', initializeDashboard);

