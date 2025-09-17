// File: js/stream-viewer.js
// Viewer controller for stream-webrtc.html

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const streamId = params.get('id');
    if (!streamId) {
        document.getElementById('streamInfo').textContent = 'Stream non trovato';
        return;
    }

    const remoteVideo = document.getElementById('remoteVideo');
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const followBtn = document.getElementById('followBtn');

    let web = new WebRTCStreaming({
        roomId: streamId,
        isBroadcaster: false,
        onRemoteStream: (s) => { remoteVideo.srcObject = s; },
        onDataMessage: (msg) => {
            chatBox.innerHTML += `<div>${msg.username || 'Anon'}: ${msg.text || JSON.stringify(msg)}</div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    await web.init();

    // viewer waits for offer from broadcaster via signals; when offer arrives web._handleSignal creates answer automatically
    // but we need to create DataChannel for sending chat only if broadcaster supports it; broadcaster creates dc.
    // We'll still send chat via supabase 'chat_messages' table as fallback.

    // Setup chat send via datachannel if available after a short delay or via fallback
    sendBtn.addEventListener('click', async () => {
        const text = chatInput.value.trim();
        if (!text) return;
        if (web.dataChannel && web.dataChannel.readyState === 'open') {
            web.dataChannel.send(JSON.stringify({ text, username: (await checkUser())?.username || 'Anon' }));
        } else {
            // fallback: insert chat into db table chat_messages (not implemented server side in this snippet)
            try {
                await supabaseClient.from('chat_messages').insert({ stream_id: streamId, content: text, username: (await checkUser())?.username || 'Anon' });
            } catch (err) {
                console.error('Chat fallback error', err);
            }
        }
        chatInput.value = '';
    });

    // Follow button uses existing followingSystem if present
    followBtn.addEventListener('click', async () => {
        if (!window.followingSystem) return;
        // need profile id of streamer
        const { data: streamRecord } = await supabaseClient.from('streams').select('user_id').eq('id', streamId).single();
        if (!streamRecord) return;
        await window.followingSystem.toggleFollow(streamRecord.user_id);
    });

    // auto-reconnect: periodically check if remoteVideo got a stream, else try to resubscribe
    let reconnectAttempts = 0;
    setInterval(async () => {
        if (remoteVideo.srcObject) return;
        reconnectAttempts++;
        if (reconnectAttempts > 10) return;
        console.log('Provo a rieffettuare subscribe...', reconnectAttempts);
        // Re-init subscription: close and init again
        await web.close();
        web = new WebRTCStreaming({ roomId: streamId, isBroadcaster: false, onRemoteStream: s => remoteVideo.srcObject = s, onDataMessage: m => {
            chatBox.innerHTML += `<div>${m.username||'Anon'}: ${m.text||JSON.stringify(m)}</div>`;
        }});
        await web.init();
    }, 3000);
});