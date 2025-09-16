// =================================================================================
// ICCI FREE - LOGICA DEL SISTEMA DI FOLLOW
// Questo file gestisce le azioni di follow, unfollow e il controllo dello stato.
// =================================================================================

/**
 * Controlla se un utente (follower) ne sta già seguendo un altro (following).
 * @param {string} followerId - L'ID dell'utente che potrebbe seguire.
 * @param {string} followingId - L'ID dell'utente che potrebbe essere seguito.
 * @returns {Promise<boolean>} Ritorna true se il follow esiste, altrimenti false.
 */
async function checkIfFollowing(followerId, followingId) {
    if (!followerId || !followingId) return false;
    try {
        const { count, error } = await supabaseClient
            .from('follows')
            .select('*', { count: 'exact', head: true }) // Metodo efficiente per contare senza scaricare dati
            .eq('follower_id', followerId)
            .eq('following_id', followingId);

        if (error) throw error;
        
        return count > 0;
    } catch (error) {
        console.error("Errore nel controllo del follow:", error.message);
        return false;
    }
}

/**
 * Crea una relazione di follow tra due utenti.
 * @param {string} followerId - L'ID dell'utente che inizia a seguire.
 * @param {string} followingId - L'ID dell'utente che viene seguito.
 * @returns {Promise<boolean>} Ritorna true se l'operazione ha successo.
 */
async function followUser(followerId, followingId) {
    try {
        const { error } = await supabaseClient
            .from('follows')
            .insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
        
        // Crea una notifica (opzionale, ma buona pratica)
        await createNotification(followingId, followerId, 'new_follower');
        return true;
    } catch (error) {
        console.error("Errore durante il follow:", error.message);
        return false;
    }
}

/**
 * Rimuove una relazione di follow tra due utenti.
 * @param {string} followerId - L'ID dell'utente che smette di seguire.
 * @param {string} followingId - L'ID dell'utente che non viene più seguito.
 * @returns {Promise<boolean>} Ritorna true se l'operazione ha successo.
 */
async function unfollowUser(followerId, followingId) {
    try {
        const { error } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Errore durante l'unfollow:", error.message);
        return false;
    }
}

/**
 * Crea una notifica per un nuovo follower.
 * @param {string} recipientId - Chi riceve la notifica.
 * @param {string} actorId - Chi ha compiuto l'azione.
 * @param {string} type - Il tipo di notifica.
 */
async function createNotification(recipientId, actorId, type) {
    try {
        const { error } = await supabaseClient
            .from('notifications')
            .insert({ recipient_id: recipientId, actor_id: actorId, type: type });
        if (error) {
            console.error("Errore nella creazione della notifica:", error.message);
        }
    } catch (error) {
        console.error("Eccezione nella creazione della notifica:", error.message);
    }
}

