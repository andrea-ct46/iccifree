// Logica "Guardiano" + Popolamento Dati
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user;

    if (!user) {
        window.location.href = '/auth.html';
        return;
    }

    try {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('username, date_of_birth, avatar_url, bio, followers_count, following_count')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!profile || !profile.username || !profile.date_of_birth) {
            window.location.href = '/setup-profile.html';
        } else {
            // Se il profilo è completo, nascondi il caricamento e mostra l'app
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('appContainer').style.display = 'flex';
            
            // Popola i dati dell'utente
            populateUserData(profile);
            // Popola il feed con stream di esempio
            populateStreamFeed();
        }

    } catch (error) {
        console.error("Errore nel recupero del profilo:", error);
        document.getElementById('loadingState').innerHTML = `<h1>Errore nel caricamento.</h1><p>${error.message}</p>`;
    }
});

function populateUserData(profile) {
    // Aggiorna l'avatar nell'header
    const userAvatar = document.getElementById('userAvatar');
    if (profile.avatar_url) {
        userAvatar.src = profile.avatar_url;
    }
}

function populateStreamFeed() {
    const streamGrid = document.getElementById('streamGrid');
    
    // Dati di esempio per gli stream
    const streams = [
        { title: "Discussione Libera sulla Politica", streamer: "LiberoPensatore", category: "Talk Show & IRL", viewers: 1200, avatar: "https://placehold.co/40x40/7DF9FF/000000?text=LP" },
        { title: "Gaming Senza Censure", streamer: "GamerOnFire", category: "Gaming", viewers: 854, avatar: "https://placehold.co/40x40/FF5733/FFFFFF?text=GF" },
        { title: "Musica e Chiacchiere", streamer: "DJMelody", category: "Musica", viewers: 450, avatar: "https://placehold.co/40x40/C70039/FFFFFF?text=DJ" },
        { title: "Dipingiamo la Notte", streamer: "ArteNotturna", category: "Arte", viewers: 150, avatar: "https://placehold.co/40x40/900C3F/FFFFFF?text=AN" },
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
