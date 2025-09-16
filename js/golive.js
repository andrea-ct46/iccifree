// =================================================================================
// ICCI FREE - LOGICA DELLA PAGINA "GO LIVE"
// Gestisce l'accesso alla fotocamera, i permessi e la creazione di una nuova diretta.
// =================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Seleziona tutti gli elementi interattivi dalla pagina
    const videoElement = document.getElementById('cameraPreview');
    const goLiveBtn = document.getElementById('goLiveBtn');
    const streamTitleInput = document.getElementById('streamTitle');
    const permissionMessage = document.getElementById('permissionMessage');
    const permissionText = document.getElementById('permissionText');
    const requestPermissionBtn = document.getElementById('requestPermissionBtn');
    
    // --- PASSO 1: Controllo di Sicurezza ---
    // Un utente non può andare in diretta se non è loggato.
    const user = await checkUser();
    if (!user) {
        // Se non c'è un utente, lo reindirizziamo alla pagina di login.
        alert("Devi effettuare l'accesso per poter andare in diretta.");
        window.location.href = '/auth.html';
        return;
    }

    // --- PASSO 2: Avvio della Fotocamera ---
    // Funzione per richiedere l'accesso a fotocamera e microfono
    async function startCamera() {
        try {
            // Chiede al browser di accedere a video e audio
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            // Se l'utente accetta, collega lo stream video all'elemento <video>
            videoElement.srcObject = stream;
            permissionMessage.style.display = 'none'; // Nasconde il messaggio dei permessi
        } catch (error) {
            console.error("Errore nell'accesso alla fotocamera:", error);
            // Se l'utente nega i permessi, mostriamo un messaggio di errore
            permissionText.textContent = "Accesso a fotocamera e microfono negato. Per favore, abilita i permessi nelle impostazioni del tuo browser.";
            permissionMessage.style.display = 'flex';
        }
    }

    // Avvia la fotocamera non appena la pagina è pronta
    startCamera();

    // --- PASSO 3: Gestione del Pulsante "GO LIVE" ---
    goLiveBtn.addEventListener('click', async () => {
        const title = streamTitleInput.value.trim();

        // Controllo che il titolo non sia vuoto
        if (!title) {
            alert("Per favore, inserisci un titolo per la tua diretta.");
            return;
        }

        goLiveBtn.disabled = true;
        goLiveBtn.textContent = 'CREAZIONE IN CORSO...';

        try {
            // 1. Inseriamo una nuova riga nella tabella 'streams' del database
            const { data, error } = await supabaseClient
                .from('streams')
                .insert({
                    user_id: user.id,
                    title: title,
                    // Puoi aggiungere una categoria se vuoi
                    // category: 'Talk Show' 
                })
                .select() // .select() ci restituisce i dati della riga appena creata
                .single(); // Ci aspettiamo un solo risultato

            if (error) {
                throw error; // Lancia l'errore se l'inserimento fallisce
            }

            // 2. Se l'inserimento ha successo, reindirizziamo l'utente alla pagina
            //    dello streaming, passando l'ID della nuova diretta nell'URL.
            //    (Creeremo la pagina 'stream.html' nel prossimo step)
            console.log("Diretta creata con successo:", data);
            window.location.href = `/stream.html?id=${data.id}`;

        } catch (error) {
            console.error("Errore nella creazione della diretta:", error.message);
            alert("Si è verificato un errore. Impossibile avviare la diretta.");
            goLiveBtn.disabled = false;
            goLiveBtn.textContent = 'GO LIVE';
        }
    });
});