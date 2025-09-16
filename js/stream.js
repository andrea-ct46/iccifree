// =================================================================================
// ICCI FREE - LOGICA DELLA PAGINA STREAMING (Versione Robusta con Retry)
// =================================================================================

let currentUser = null;

/**
 * Funzione per recuperare i dati dello stream con una logica di "riprova".
 * Questo risolve il problema della "gara di velocità" dopo la creazione di una diretta.
 * @param {string} streamId - L'ID dello stream da recuperare.
 * @param {number} retries - Numero di tentativi rimasti (default 3).
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
                console.warn(`Diretta non ancora pronta nel database. Riprovo... (${retries} tentativi rimasti)`);
                // Aspetta 500ms prima del prossimo tentativo per dare tempo al DB.
                await new Promise(resolve => setTimeout(resolve, 500));
                return fetchStreamWithRetries(streamId, retries - 1);
            }
            // Se l'errore è diverso o abbiamo finito i tentativi, lo lanciamo.
            throw error;
        }
        
        console.log("Diretta trovata con successo!", stream);
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
        loadingText.textContent = `Errore: ${error.message}`;
        console.error("Errore nel caricamento della diretta:", error);
    }
}

// ... (Tutte le altre funzioni come populateStreamInfo, setupFollowButton, setupChat, etc. rimangono invariate)
// ... (Assicurati che esistano nel tuo file, le riporto qui per completezza)

function populateStreamInfo(stream) {
    document.title = `${stream.title} - ICCI FREE`;
    document.getElementById('streamTitle').textContent = stream.title;
    
    const placeholder = document.getElementById('streamVideoPlaceholder');
    if (placeholder) {
        placeholder.src = `https://placehold.co/1280x720/101010/A0A0A0?text=${encodeURIComponent(stream.title)}`;
    }
    
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
async function setupChat(streamId) {
    const chatMessagesContainer = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const sendMessage = async () => {
        const messageText = chatInput.value.trim();
        if (!messageText) return;
        try {
            const { error } = await supabaseClient.from('chat_messages').insert({ stream_id: streamId, user_id: currentUser.id, message: messageText });
            if (error) throw error;
            chatInput.value = '';
        } catch (error) { console.error("Errore invio messaggio:", error.message); }
    };
    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') sendMessage(); });
    const displayMessage = (message) => {
        chatMessagesContainer.insertAdjacentHTML('afterbegin', `<div class="chat-message"><span class="username">${message.profiles.username}:</span> <span class="message-text">${message.message}</span></div>`);
    };
    const { data: initialMessages } = await supabaseClient.from('chat_messages').select(`*, profiles ( username )`).eq('stream_id', streamId).order('created_at', { ascending: false }).limit(50);
    if (initialMessages) initialMessages.forEach(displayMessage);
    supabaseClient.channel(`chat_stream_${streamId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `stream_id=eq.${streamId}`}, async (payload) => {
        const { data: message } = await supabaseClient.from('chat_messages').select(`*, profiles ( username )`).eq('id', payload.new.id).single();
        if (message) displayMessage(message);
    }).subscribe();
}

// Avvia tutto al caricamento della pagina
document.addEventListener('DOMContentLoaded', initializeStreamPage);

