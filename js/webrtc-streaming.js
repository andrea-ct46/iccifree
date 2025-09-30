class WebRTCStreamingV5 {
  constructor(streamId, mode) {
    this.streamId = streamId;
    this.mode = mode; // "broadcaster" o "viewer"
    this.pc = null;
    this.localStream = null;
    this.remoteVideo = null;

    // Config ICE server
    this.iceServers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    };

    // Client Supabase (riusa il client globale inizializzato in supabase.js)
    if (typeof window !== "undefined" && window.supabaseClient) {
      this.supabase = window.supabaseClient;
    } else {
      throw new Error("Supabase client non inizializzato. Assicurati che js/supabase.js sia caricato prima.");
    }
  }

  async init() {
    console.log(`🎬 Inizializzo WebRTC come ${this.mode} per stream ${this.streamId}`);

    this.pc = new RTCPeerConnection(this.iceServers);

    if (this.mode === "broadcaster") {
      await this.startBroadcast();
    } else if (this.mode === "viewer") {
      await this.startViewer();
    }
  }

  async startBroadcast() {
    console.log("🎥 Avvio broadcast...");

    // 1️⃣ Cattura media locale
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const videoEl = document.getElementById("localVideo");
    if (videoEl) videoEl.srcObject = this.localStream;

    // 2️⃣ Aggiungi tracce a peer
    this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));

    // 3️⃣ Ascolta ICE
    this.pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.sendSignal("ice", event.candidate);
      }
    };

    // 4️⃣ Crea offerta
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // 5️⃣ Salva offerta su Supabase
    await this.sendSignal("offer", offer);

    // 6️⃣ Ascolta risposte
    this.listenForSignals();
  }

  async startViewer() {
    console.log("👀 Avvio viewer...");

    this.remoteVideo = document.getElementById("remoteVideo");

    this.pc.ontrack = (event) => {
      console.log("📡 Ricevuto stream remoto");
      if (this.remoteVideo) this.remoteVideo.srcObject = event.streams[0];
    };

    this.pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.sendSignal("ice", event.candidate);
      }
    };

    // Attendi offerta del broadcaster
    this.listenForSignals();

    // Carica offerta iniziale
    const { data: offers } = await this.supabase
      .from("signals")
      .select("*")
      .eq("stream_id", this.streamId)
      .eq("type", "offer")
      .order("created_at", { ascending: false })
      .limit(1);

    if (offers && offers.length > 0) {
      const offer = offers[0].payload;
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Crea risposta
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      await this.sendSignal("answer", answer);
    }
  }

  // 👂 Ascolta segnali Supabase
  async listenForSignals() {
    console.log("📡 Ascolto segnali WebRTC...");

    this.supabase
      .channel(`signals-${this.streamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signals", filter: `stream_id=eq.${this.streamId}` },
        async (payload) => {
          const signal = payload.new;
          if (signal.type === "answer" && this.mode === "broadcaster") {
            console.log("📥 Ricevuta answer");
            await this.pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          }
          if (signal.type === "ice" && signal.sender !== this.mode) {
            console.log("📥 ICE ricevuto");
            try {
              await this.pc.addIceCandidate(new RTCIceCandidate(signal.payload));
            } catch (e) {
              console.warn("Errore ICE:", e);
            }
          }
        }
      )
      .subscribe();
  }

  // 📤 Invia segnale su Supabase
  async sendSignal(type, payload) {
    await this.supabase.from("signals").insert({
      stream_id: this.streamId,
      type,
      payload,
      sender: this.mode,
      created_at: new Date().toISOString(),
    });
  }

  // ⏹️ Stop
  async stop() {
    console.log("🛑 Stop streaming...");

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    if (this.pc) {
      this.pc.getSenders().forEach((sender) => this.pc.removeTrack(sender));
      this.pc.close();
    }

    this.pc = null;
    this.localStream = null;
  }
}

// ✅ Rendi disponibile globalmente
window.WebRTCStreaming = WebRTCStreamingV5;
