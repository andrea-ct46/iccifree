// =================================================================================
// ICCI FREE - LOGICA WEBRTC PER LA PAGINA DELLO STREAMING
// =================================================================================

let currentUser = null;
let peerConnection;
let localStream;
let streamId;

// --- NUOVA CONFIGURAZIONE WEBRTC ---
// Aggiungiamo dei server STUN pubblici per permettere ai peer di trovarsi su internet.
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

/**
 * Funzione principale che si avvia al caricamento della pagina
 */
async function initializeStreamPage() {
    const loadingState = document.getElementById('loadingState');
    const loadingText = loadingState.querySelector('.loading-text');

    try {
        currentUser = await checkUser();
        if (!currentUser) {
            alert("Devi effettuare l'accesso per guardare una diretta.");
            window.location.href = '/auth.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        streamId = params.get('id');
        if (!streamId) throw new Error("ID della diretta non trovato nell'URL.");

        const { data: stream, error } = await supabaseClient
            .from('streams')
            .select(`*, profiles (*)`)
            .eq('id', streamId)
            .single();

        if (error || !stream) throw new Error(`Diretta non trovata o terminata.`);
        
        populateStreamInfo(stream);
        
        // Decide se inizializzare come streamer o come spettatore
        if (stream.user_id === currentUser.id) {
            await startStreamAsStreamer(stream);
        } else {
            await startStreamAsViewer(stream);
        }

        setupFollowButton(stream.profiles);
        setupChat(stream.id);

        loadingState.style.display = 'none';
        document.getElementById('streamPageContainer').style.display = 'flex';

    } catch (error) {
        loadingText.textContent = error.message;
        console.error("Errore nel caricamento della diretta:", error);
    }
}

/**
 * Inizializza la pagina per lo STREAMER
 */
async function startStreamAsStreamer(stream) {
    document.getElementById('streamerControls').style.display = 'block';
    const videoElement = document.getElementById('streamVideo');

    // 1. Ottieni lo stream dalla webcam
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoElement.srcObject = localStream;

    // 2. Prepara la connessione WebRTC usando la nuova configurazione STUN
    peerConnection = new RTCPeerConnection(rtcConfig);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // 3. Ascolta in tempo reale le "risposte" (answer) degli spettatori
    supabaseClient
        .channel(`stream-${streamId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'streams',
            filter: `id=eq.${streamId}`
        }, payload => {
            const answerSdp = payload.new.answer_sdp;
            if (answerSdp && peerConnection.currentRemoteDescription === null) {
                console.log("Risposta ricevuta da uno spettatore, connessione in corso...");
                peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));
            }
        })
        .subscribe();
        
    // 4. Gestisci il pulsante "Termina Diretta"
    document.getElementById('endStreamBtn').addEventListener('click', async () => {
        // Aggiorna lo stato della diretta nel database
        await supabaseClient.from('streams').update({ status: 'ended' }).eq('id', streamId);
        // Ferma la webcam
        localStream.getTracks().forEach(track => track.stop());
        // Torna alla dashboard
        window.location.href = '/dashboard.html';
    });
}

/**
 * Inizializza la pagina per lo SPETTATORE
 */
async function startStreamAsViewer(stream) {
    document.getElementById('backToDashboardBtn').style.display = 'block';
    const videoElement = document.getElementById('streamVideo');

    // 1. Prepara la connessione WebRTC usando la nuova configurazione STUN
    peerConnection = new RTCPeerConnection(rtcConfig);

    // 2. Quando riceve il video dallo streamer, lo mostra nell'elemento <video>
    peerConnection.ontrack = event => {
        videoElement.srcObject = event.streams[0];
    };

    // 3. Usa l'"offerta" dello streamer per preparare una "risposta"
    const offerSdp = stream.offer_sdp;
    if (!offerSdp) {
        throw new Error("Lo streamer non ha ancora avviato la connessione.");
    }
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offerSdp }));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // 4. Salva la "risposta" nel database per farla leggere allo streamer
    await supabaseClient
        .from('streams')
        .update({ answer_sdp: answer.sdp })
        .eq('id', streamId);

    console.log("Risposta inviata allo streamer. In attesa del video...");
}


// --- Funzioni di supporto (invariate) ---
function populateStreamInfo(stream) { 
    document.title = `${stream.title} - ICCI FREE`;
    document.getElementById('streamTitle').textContent = stream.title;
    
    const streamerProfile = stream.profiles;
    if (streamerProfile) {
        document.getElementById('streamerName').textContent = streamerProfile.username;
        document.getElementById('streamerAvatar').src = streamerProfile.avatar_url || `https://placehold.co/50x50/181818/A0A0A0?text=${streamerProfile.username.charAt(0).toUpperCase()}`;
    }
 }
async function setupFollowButton(streamerProfile) { /* ... codice invariato ... */ }
function updateFollowButtonUI(button, isFollowing) { /* ... codice invariato ... */ }
async function setupChat(streamId) { /* ... codice invariato ... */ }


// Avvia tutto al caricamento della pagina
document.addEventListener('DOMContentLoaded', initializeStreamPage);

