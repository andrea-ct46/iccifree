// La logica della dashboard ora è più semplice e diretta.

/**
 * Funzione principale che inizializza la dashboard.
 */
async function initializeDashboard() {
    // Controlla chi è l'utente loggato.
    const user = await checkUser();

    // Se per qualche motivo un utente non loggato arriva qui, lo reindirizziamo al login.
    // Questa è una misura di sicurezza aggiuntiva.
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
        
        // FIX 1: Imposta il link al profilo dell'utente
        setupProfileLink(profile.username);

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
    if (userAvatar) {
        if (profile.avatar_url) {
            userAvatar.src = profile.avatar_url;
        } else {
            // FIX 5: Avatar placeholder unico basato sull'username
            const initials = profile.username ? profile.username.substring(0, 2).toUpperCase() : '??';
            userAvatar.src = `https://placehold.co/40x40/FFD700/000000?text=${initials}`;
        }
    }
}

/**
 * FIX 1: Configura il link al profilo dell'utente
 * @param {string} username - Username dell'utente loggato
 */
function setupProfileLink(username) {
    const profileLink = document.getElementById('myProfileLink');
    if (profileLink && username) {
        profileLink.href = `/profile.html?user=${username}`;
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
        { 
            title: "Discussione Libera sulla Politica", 
            streamer: "LiberoPensatore", 
            category: "Talk Show & IRL", 
            viewers: 1200, 
            avatar: "https://placehold.co/40x40/7DF9FF/000000?text=LP" 
        },
        { 
            title: "Gaming Senza Censure", 
            streamer: "GamerOnFire", 
            category: "Gaming", 
            viewers: 854, 
            avatar: "https://placehold.co/40x40/FF5733/FFFFFF?text=GF" 
        },
        {
            title: "Crypto & Finanza Decentralizzata",
            streamer: "CryptoRebel",
            category: "Crypto",
            viewers: 432,
            avatar: "https://placehold.co/40x40/00FF00/000000?text=CR"
        }
    ];

    let streamHTML = '';
    streams.forEach(stream => {
        streamHTML += `
            <div class="stream-card" onclick="alert('Stream di ${stream.streamer} - Coming soon!')">
                <div class="stream-thumbnail">
                    <img src="https://placehold.co/300x180/1a1a1a/FFD700?text=${encodeURIComponent(stream.category)}" alt="Stream Thumbnail">
                    <div class="live-indicator">LIVE</div>
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
 * Funzione di logout migliorata
 */
window.logout = async function() {
    if (confirm('Sei sicuro di voler uscire?')) {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            window.location.href = '/';
        } catch (error) {
            console.error('Errore durante il logout:', error);
            // Forza il redirect anche in caso di errore
            window.location.href = '/';
        }
    }
}

// Avvia l'inizializzazione della dashboard non appena il DOM è pronto.
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupSearchBar();
});

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
        
        // Debounce di 300ms
        searchTimeout = setTimeout(() => {
            filterStreams(query);
        }, 300);
    });
    
    // Gestione tasto Enter
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
        // Se la query è vuota, mostra tutti
        streamCards.forEach(card => {
            card.style.display = '';
            visibleCount++;
        });
    } else {
        // Filtra basandosi su titolo, streamer e categoria
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
    
    // Mostra empty state se non ci sono risultati
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
