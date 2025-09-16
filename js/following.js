// =================================================================================
// ICCI FREE - LOGICA DEL SISTEMA DI FOLLOW
// Gestisce le azioni di follow, unfollow e la creazione di notifiche.
// =================================================================================

/**
 * Controlla se un utente ne sta già seguendo un altro.
 * @param {string} followerId - L'ID dell'utente che compie l'azione.
 * @param {string} followingId - L'ID dell'utente che viene seguito.
 * @returns {Promise<boolean>} Ritorna true se l'utente sta già seguendo, altrimenti false.
 */
async function checkIfFollowing(followerId, followingId) {
    if (!followerId || !followingId) return false;
    try {
        // RISOLUZIONE ERRORE 406:
        // Invece di un SELECT * che può essere ambiguo, contiamo le righe.
        // Se il conteggio è maggiore di 0, significa che l'utente sta già seguendo.
        const { count, error } = await supabaseClient
            .from('follows')
            .select('*', { count: 'exact', head: true }) // Metodo efficiente per contare
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
 * Fa sì che un utente ne segua un altro e aggiorna i contatori.
 * @param {string} followerId - L'ID dell'utente che compie l'azione.
 * @param {string} followingId - L'ID dell'utente che viene seguito.
 */
async function followUser(followerId, followingId) {
    try {
        // 1. Crea la relazione di follow
        const { error: followError } = await supabaseClient
            .from('follows')
            .insert({ follower_id: followerId, following_id: followingId });
        if (followError) throw followError;

        // 2. Aggiorna i contatori usando una funzione del database (RPC)
        // Questo è il modo più sicuro e performante per evitare race conditions.
        // Assicurati di aver creato la funzione 'update_follow_counts' in SQL (vedi passo extra sotto).
        await supabaseClient.rpc('update_follow_counts', {
            user_to_follow_id: followingId,
            current_user_id: followerId,
            increment_followers: true
        });

        console.log("Utente seguito con successo");
        // 3. Crea una notifica per l'utente seguito
        await createNotification(followingId, followerId, 'new_follower');

    } catch (error) {
        console.error("Errore durante il follow:", error.message);
    }
}


/**
 * Fa sì che un utente smetta di seguire un altro e aggiorna i contatori.
 * @param {string} followerId - L'ID dell'utente che compie l'azione.
 * @param {string} followingId - L'ID dell'utente che viene seguito.
 */
async function unfollowUser(followerId, followingId) {
    try {
        // 1. Rimuove la relazione di follow
        const { error: unfollowError } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);
        if (unfollowError) throw unfollowError;
        
        // 2. Aggiorna i contatori usando la stessa funzione RPC
        await supabaseClient.rpc('update_follow_counts', {
            user_to_follow_id: followingId,
            current_user_id: followerId,
            increment_followers: false // Questa volta decrementiamo
        });

        console.log("Unfollow eseguito con successo");
    } catch (error) {
        console.error("Errore durante l'unfollow:", error.message);
    }
}


/**
 * Crea una notifica nel database.
 * @param {string} recipientId - L'ID di chi riceve la notifica.
 * @param {string} actorId - L'ID di chi compie l'azione.
 * @param {string} type - Il tipo di notifica (es. 'new_follower').
 */
async function createNotification(recipientId, actorId, type) {
    try {
        // RISOLUZIONE ERRORE 403 / RLS:
        // La policy SQL che abbiamo creato permette questa operazione
        // perché stiamo inserendo una riga dove actor_id è l'utente loggato.
        const { error } = await supabaseClient
            .from('notifications')
            .insert({ recipient_id: recipientId, actor_id: actorId, type: type });
        if (error) throw error;
        console.log("Notifica creata con successo");
    } catch (error) {
        // L'errore "new row violates row-level security policy" apparirà qui se la policy è sbagliata.
        console.error("Errore creazione notifica:", error.message);
    }
}
