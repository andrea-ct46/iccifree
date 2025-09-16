// Dentro la tua funzione che inizializza la pagina del profilo...
async function initializeProfilePage() {
    // ... recuperi i dati del profilo e l'utente loggato ...
    const currentUser = await checkUser();
    const profileUsername = /* ... ottieni lo username dall'URL ... */;
    
    // Recupera l'ID del profilo visualizzato
    const { data: profile } = await supabaseClient.from('profiles').select('id, followers_count').eq('username', profileUsername).single();
    const profileId = profile.id;

    const followButton = document.getElementById('followButton');
    const followersCountSpan = document.getElementById('followersCount');
    
    // Imposta lo stato iniziale del bottone
    let isFollowing = await checkIfFollowing(currentUser.id, profileId);
    followButton.textContent = isFollowing ? 'Smetti di seguire' : 'Segui';
    followersCountSpan.textContent = profile.followers_count;

    // Aggiungi l'evento al click
    followButton.addEventListener('click', async () => {
        // Disabilita il bottone per evitare doppi click
        followButton.disabled = true;

        if (isFollowing) {
            // Se sta seguendo, esegui l'unfollow
            await unfollowUser(currentUser.id, profileId);
            followersCountSpan.textContent = parseInt(followersCountSpan.textContent) - 1;
            followButton.textContent = 'Segui';
        } else {
            // Se non sta seguendo, esegui il follow
            await followUser(currentUser.id, profileId);
            followersCountSpan.textContent = parseInt(followersCountSpan.textContent) + 1;
            followButton.textContent = 'Smetti di seguire';
        }

        // Aggiorna lo stato e riabilita il bottone
        isFollowing = !isFollowing;
        followButton.disabled = false;
    });

    // Gestione avatar fallback
    const profileAvatar = document.getElementById('profileAvatar');
    profileAvatar.src = profile.avatar_url || 'https://placehold.co/150x150/282828/a0a0a0?text=?';
}
