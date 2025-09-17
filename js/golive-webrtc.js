// File: js/golive-webrtc.js
// Controller per streamer (golive-webrtc.html)

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const toggleCamBtn = document.getElementById('toggleCamBtn');
    const toggleMicBtn = document.getElementById('toggleMicBtn');
    const screenShareBtn = document.getElementById('screenShareBtn');
    const localVideo = document.getElementById('localVideo');
    const status = document.getElementById('status');
    const statsEl = document.getElementById('stats');
    const titleInput = document.getElementById('streamTitle');
    const categoryInput = document.getElementById('streamCategory');

    let streamer = null;
    let web = null;
    let streamRecord = null;
    let cameraEnabled = true;
    let micEnabled = true;

    async function ensureUser() {
        const u = await checkUser();
        if (!u) {
            window.location.href = '/auth.html';
            return null;
        }
        return u;
    }

    async function createStreamRecord(userId, title, category) {
        const { data, error } = await supabaseClient
            .from('streams')
            .insert({
                user_id: userId,
                title: title || 'Diretta ICCI FREE',
                category: category || 'Generale',
                status: 'live',
                started_at: new Date().toISOString()
            })
            .select('*');

        if (error) throw error;
        return data[0];
    }

    async function updateStreamStatus(id, statusVal) {
        await supabaseClient.from('streams').update({ status: statusVal }).eq('id', id);
    }

    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        const user = await ensureUser();
        if (!user) return;

        const title = titleInput.value;
        const category = categoryInput.value;

        try {
            // create stream record
            streamRecord = await createStreamRecord(user.id, title, category);
            status.textContent = 'Creata diretta. Preparing...';

            // init WebRTC
            web = new WebRTCStreaming({ roomId: streamRecord.id, isBroadcaster: true });
            await web.init();

            // get camera+mic
            const localStream = await web.startLocalCameraAudio();
            localVideo.srcObject = localStream;

            // create datachannel for chat
            web.createDataChannel('chat');

            // create offer and signal (createOffer will insert offer row)
            await web.createOffer();

            // start stats
            web.startStats(2000);
            web.onStats = (s) => { statsEl.textContent = JSON.stringify(s); };

            status.textContent = 'In diretta ✅';
            stopBtn.disabled = false;
        } catch (err) {
            console.error(err);
            showNotification('Errore avviando la diretta', 'error');
            startBtn.disabled = false;
        }
    });

    stopBtn.addEventListener('click', async () => {
        if (!streamRecord) return;
        try {
            if (web) {
                await web.close();
            }
            await updateStreamStatus(streamRecord.id, 'offline');
            status.textContent = 'Diretta terminata';
            stopBtn.disabled = true;
            startBtn.disabled = false;
        } catch (err) {
            console.error(err);
        }
    });

    toggleCamBtn.addEventListener('click', () => {
        if (!web || !web.localStream) return;
        const videoTrack = web.localStream.getVideoTracks()[0];
        if (!videoTrack) return;
        cameraEnabled = !cameraEnabled;
        videoTrack.enabled = cameraEnabled;
        toggleCamBtn.textContent = cameraEnabled ? 'Toggle Camera' : 'Camera Off';
    });

    toggleMicBtn.addEventListener('click', () => {
        if (!web || !web.localStream) return;
        const audioTrack = web.localStream.getAudioTracks()[0];
        if (!audioTrack) return;
        micEnabled = !micEnabled;
        audioTrack.enabled = micEnabled;
        toggleMicBtn.textContent = micEnabled ? 'Toggle Mic' : 'Mic Off';
    });

    screenShareBtn.addEventListener('click', async () => {
        if (!web) return;
        try {
            await web.startScreenShare();
            showNotification('Condivisione schermo avviata', 'info');
        } catch (err) {
            console.error(err);
            showNotification('Condivisione schermo fallita', 'error');
        }
    });
});