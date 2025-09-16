// =================================================================================
// ICCI FREE - LOGICA WEBRTC PER LA PAGINA DELLO STREAMING (Versione Definitiva)
// =================================================================================

let currentUser = null;
let peerConnection;
let localStream;
let streamId;

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
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoElement.srcObject = localStream;

    peerConnection = new RTCPeerConnection(rtcConfig);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const channel = supabaseClient.channel(`stream-${streamId}`);

    // NUOVA LOGICA: Gestione degli "indirizzi" (ICE candidates)
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log("Streamer: invio del mio indirizzo (ICE candidate) allo spettatore.");
            channel.send({
                type: 'broadcast',
                event: 'ice-candidate',
                payload: { candidate: event.candidate, from: 'streamer' },
            });
        }
    };

    // Ascolta sia le risposte (answer) che gli indirizzi degli spettatori
    channel.on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'streams', filter: `id=eq.${streamId}`
    }, payload => {
        const answerSdp = payload.new.answer_sdp;
        if (answerSdp && !peerConnection.currentRemoteDescription) {
            console.log("Streamer: risposta ricevuta, imposto la connessione.");
            peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));
        }
    });

    channel.on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        if (payload.from === 'viewer') {
            console.log("Streamer: ricevuto l'indirizzo (ICE candidate) dallo spettatore.");
            peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
    }).subscribe();
        
    document.getElementById('endStreamBtn').addEventListener('click', async () => {
        await supabaseClient.from('streams').update({ status: 'ended' }).eq('id', streamId);
        localStream.getTracks().forEach(track => track.stop());
        window.location.href = '/dashboard.html';
    });
}

/**
 * Inizializza la pagina per lo SPETTATORE
 */
async function startStreamAsViewer(stream) {
    document.getElementById('backToDashboardBtn').style.display = 'block';
    const videoElement = document.getElementById('streamVideo');

    peerConnection = new RTCPeerConnection(rtcConfig);

    peerConnection.ontrack = event => {
        console.log("Spettatore: Traccia video ricevuta! Mostro lo stream.");
        videoElement.srcObject = event.streams[0];
    };

    const channel = supabaseClient.channel(`stream-${streamId}`);

    // NUOVA LOGICA: Gestione degli "indirizzi" (ICE candidates)
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log("Spettatore: invio del mio indirizzo (ICE candidate) allo streamer.");
            channel.send({
                type: 'broadcast',
                event: 'ice-candidate',
                payload: { candidate: event.candidate, from: 'viewer' },
            });
        }
    };

    // Ascolta gli indirizzi inviati dallo streamer
    channel.on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        if (payload.from === 'streamer') {
            console.log("Spettatore: ricevuto l'indirizzo (ICE candidate) dallo streamer.");
            peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
    }).subscribe();

    const offerSdp = stream.offer_sdp;
    if (!offerSdp) throw new Error("Lo streamer non ha ancora avviato la connessione.");
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offerSdp }));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    await supabaseClient.from('streams').update({ answer_sdp: answer.sdp }).eq('id', streamId);
    console.log("Spettatore: risposta inviata. In attesa degli indirizzi e del video...");
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

