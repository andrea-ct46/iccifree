// ... (tutto il codice iniziale e le funzioni rimangono invariate) ...

/**
 * Popola l'interfaccia con i dati dello stream e dello streamer.
 * @param {object} stream - L'oggetto dello stream recuperato da Supabase.
 */
function populateStreamInfo(stream) {
    document.title = `${stream.title} - ICCI FREE`;
    document.getElementById('streamTitle').textContent = stream.title;
    
    // --- MODIFICA PER IL PLACEHOLDER ---
    // Aggiorniamo il testo del placeholder con il titolo reale della diretta.
    const placeholder = document.getElementById('streamVideoPlaceholder');
    if (placeholder) {
        // Usiamo l'API di placehold.co per generare un'immagine dinamica
        placeholder.src = `https://placehold.co/1280x720/101010/A0A0A0?text=${encodeURIComponent(stream.title)}`;
    }
    
    const streamerProfile = stream.profiles;
    if (streamerProfile) {
        document.getElementById('streamerName').textContent = streamerProfile.username;
        document.getElementById('streamerAvatar').src = streamerProfile.avatar_url || `https://placehold.co/50x50/181818/A0A0A0?text=${streamerProfile.username.charAt(0).toUpperCase()}`;
    }
}

// ... (tutte le altre funzioni rimangono invariate) ...