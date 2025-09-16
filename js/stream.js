// =================================================================================
// ICCI FREE - LOGICA DELLA PAGINA STREAMING
// Gestisce il caricamento dei dati, la chat in tempo reale e le interazioni.
// =================================================================================

// Variabile globale per memorizzare l'utente loggato, per non doverlo chiedere più volte
let currentUser = null;

/**
 * Funzione principale che si avvia al caricamento della pagina
 */
async function initializeStreamPage() {
    const loadingState = document.getElementById('loadingState');
    const streamPageContainer = document.getElementById('streamPageContainer');
    const loadingText = loadingState.querySelector('.loading-text');

    try {
        // 1. Controlla se l'utente è loggato. Se non lo è, non può vedere la diretta.
        currentUser = await checkUser();
        if (!currentUser) {
            alert("Devi effettuare l'accesso per guardare una diretta.");
            window.location.href = '/auth.html';
            return;
        }

        // 2. Legge l'ID dello stream dall'URL (es. ?id=UUID)
        const params = new URLSearchParams(window.location.search);
        const streamId = params.get('id');
        if (!streamId) {
            throw new Error("ID della diretta non trovato nell'URL.");
        }

        // 3. Cerca lo stream nel database e, contemporaneamente, recupera i dati del profilo
        //    dello streamer usando una 'join'.
        const { data: stream, error } = await supabaseClient
            .from('streams')
            .select(`
                *,
                profiles ( id, username, avatar_url )
            `)
            .eq('id', streamId)
            .single(); // Ci aspettiamo un solo risultato

        if (error || !stream) {
            throw new Error(`Diretta non trovata o terminata.`);
        }

        // 4. Se lo stream esiste, popola l'interfaccia e avvia la chat
        populateStreamInfo(stream);
        setupFollowButton(stream.profiles);
        await setupChat(stream.id);

        // 5. Mostra il contenuto della pagina e nascondi il caricamento
        loadingState.style.display = 'none';
        streamPageContainer.style.display = 'flex';

    } catch (error) {
        loadingText.textContent = error.message;
        console.error("Errore nel caricamento della diretta:", error);
    }
}

/**
 * Popola l'interfaccia con i dati dello stream e dello streamer.
 * @param {object} stream - L'oggetto dello stream recuperato da Supabase.
 */
function populateStreamInfo(stream) {
    document.title = `${stream.title} - ICCI FREE`;
    document.getElementById('streamTitle').textContent = stream.title;
    
    const streamerProfile = stream.profiles;
    if (streamerProfile) {
        document.getElementById('streamerName').textContent = streamerProfile.username;
        document.getElementById('streamerAvatar').src = streamerProfile.avatar_url || `https://placehold.co/50x50/181818/A0A0A0?text=${streamerProfile.username.charAt(0).toUpperCase()}`;
    }
}

/**
 * Configura il pulsante "Segui".
 * @param {object} streamerProfile - Il profilo dello streamer.
 */
async function setupFollowButton(streamerProfile) {
    const followBtn = document.getElementById('followBtn');
    if (!streamerProfile || currentUser.id === streamerProfile.id) {
        followBtn.style.display = 'none'; // Nasconde il pulsante se stai guardando il tuo stream
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


/**
 * Inizializza la chat: carica i messaggi iniziali e si iscrive agli aggiornamenti in tempo reale.
 * @param {string} streamId - L'ID dello stream a cui collegare la chat.
 */
async function setupChat(streamId) {
    const chatMessagesContainer = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');

    // Funzione per inviare un messaggio
    const sendMessage = async () => {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        try {
            const { error } = await supabaseClient
                .from('chat_messages')
                .insert({
                    stream_id: streamId,
                    user_id: currentUser.id,
                    message: messageText
                });

            if (error) throw error;
            chatInput.value = ''; // Pulisce l'input
        } catch (error) {
            console.error("Errore nell'invio del messaggio:", error.message);
        }
    };

    // Event listener per il pulsante e il tasto Invio
    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Funzione per visualizzare un singolo messaggio
    const displayMessage = (message) => {
        // I nuovi messaggi vengono aggiunti in cima perché il CSS usa flex-direction: column-reverse
        chatMessagesContainer.insertAdjacentHTML('afterbegin', `
            <div class="chat-message">
                <span class="username">${message.profiles.username}:</span>
                <span class="message-text">${message.message}</span>
            </div>
        `);
    };

    // Carica i messaggi esistenti
    const { data: initialMessages, error } = await supabaseClient
        .from('chat_messages')
        .select(`*, profiles ( username )`)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false }) // I più recenti prima
        .limit(50); // Limita ai 50 messaggi più recenti

    if (error) {
        console.error("Errore nel caricamento dei messaggi iniziali:", error.message);
    } else {
        initialMessages.forEach(displayMessage);
    }

    // Si iscrive ai nuovi messaggi in tempo reale
    supabaseClient
        .channel(`chat_stream_${streamId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `stream_id=eq.${streamId}`
        }, async (payload) => {
            // Quando arriva un nuovo messaggio, recupera anche il profilo dell'utente
            const { data: message, error } = await supabaseClient
                .from('chat_messages')
                .select(`*, profiles ( username )`)
                .eq('id', payload.new.id)
                .single();
            
            if (!error && message) {
                displayMessage(message);
            }
        })
        .subscribe();
}

// Avvia tutto al caricamento della pagina
document.addEventListener('DOMContentLoaded', initializeStreamPage);