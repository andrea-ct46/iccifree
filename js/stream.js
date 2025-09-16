// =================================================================================
// ICCI FREE - LOGICA DELLA PAGINA STREAMING (Versione Robusta)
// =================================================================================

let currentUser = null;

/**
 * Funzione per recuperare i dati dello stream con una logica di "riprova".
 * Questo risolve il problema della "gara di velocità" dopo la creazione di una diretta.
 * @param {string} streamId - L'ID dello stream da recuperare.
 * @param {number} retries - Numero di tentativi rimasti.
 * @returns {Promise<object>} L'oggetto dello stream.
 */
async function fetchStreamWithRetries(streamId, retries = 3) {
    try {
        const { data: stream, error } = await supabaseClient
            .from('streams')
            .select(`*, profiles ( id, username, avatar_url )`)
            .eq('id', streamId)
            .single();

        if (error) {
            // Se l'errore è "not found" E abbiamo ancora tentativi, riproviamo.
            if (error.code === 'PGRST116' && retries > 0) {
                console.warn(`Diretta non ancora trovata. Riprovo... (${retries} tentativi rimasti)`);
                // Aspetta 500ms prima del prossimo tentativo
                await new Promise(resolve => setTimeout(resolve, 500));
                return fetchStreamWithRetries(streamId, retries - 1);
            }
            // Se l'errore è diverso o abbiamo finito i tentativi, lo lanciamo.
            throw error;
        }
        
        return stream;

    } catch (e) {
        throw e; // Rilancia l'errore alla funzione principale
    }
}


/**
 * Funzione principale che si avvia al caricamento della pagina
 */
async function initializeStreamPage() {
    const loadingState = document.getElementById('loadingState');
    const streamPageContainer = document.getElementById('streamPageContainer');
    const loadingText = loadingState.querySelector('.loading-text');

    try {
        currentUser = await checkUser();
        if (!currentUser) {
            alert("Devi effettuare l'accesso per guardare una diretta.");
            window.location.href = '/auth.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const streamId = params.get('id');
        if (!streamId) throw new Error("ID della diretta non trovato nell'URL.");

        // Usa la nuova funzione con logica di riprova
        const stream = await fetchStreamWithRetries(streamId);
        if (!stream) throw new Error(`Diretta non trovata o terminata.`);

        populateStreamInfo(stream);
        setupFollowButton(stream.profiles);
        await setupChat(stream.id);

        loadingState.style.display = 'none';
        streamPageContainer.style.display = 'flex';

    } catch (error) {
        loadingText.textContent = error.message;
        console.error("Errore nel caricamento della diretta:", error);
    }
}

// ... (Tutte le altre funzioni come populateStreamInfo, setupFollowButton, setupChat, etc. rimangono invariate)
function populateStreamInfo(stream) {
    document.title = `${stream.title} - ICCI FREE`;
    document.getElementById('streamTitle').textContent = stream.title;
    
    const streamerProfile = stream.profiles;
    if (streamerProfile) {
        document.getElementById('streamerName').textContent = streamerProfile.username;
        document.getElementById('streamerAvatar').src = streamerProfile.avatar_url || `https://placehold.co/50x50/181818/A0A0A0?text=${streamerProfile.username.charAt(0).toUpperCase()}`;
    }
}
async function setupFollowButton(streamerProfile) {
    const followBtn = document.getElementById('followBtn');
    if (!streamerProfile || currentUser.id === streamerProfile.id) {
        followBtn.style.display = 'none';
        return;
    }
    let isFollowing = await checkIfFollowing(currentUser.id, streamerProfile.id);
    updateFollowButtonUI(followBtn, isFollowing);
    followBtn.addEventListener('click', async () => {
        followBtn.disabled = true;
        const success = isFollowing 
            ? await unfollowUser(currentUser.id, streamerProfile.id)
            : await followUser(currentUser.id, streamerProfile.id);
        
        if (success) {
            isFollowing = !isFollowing;
            updateFollowButtonUI(followBtn, isFollowing);
        }
        followBtn.disabled = false;
    });
}
function updateFollowButtonUI(button, isFollowing) {
    if (isFollowing) {
        button.textContent = 'Smetti di seguire';
        button.classList.add('unfollow-style');
    } else {
        button.textContent = 'Segui';
        button.classList.remove('unfollow-style');
    }
}
async function setupChat(streamId) { /* ... codice invariato ... */ }

// Avvia tutto al caricamento della pagina
document.addEventListener('DOMContentLoaded', initializeStreamPage);