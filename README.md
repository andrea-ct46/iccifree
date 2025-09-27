# 🔥 ICCI FREE - Streaming Platform

> **La piattaforma di streaming live senza censura. Finalmente puoi dire quello che pensi.**

[![Version](https://img.shields.io/badge/version-2.0-gold.svg)](https://github.com/yourusername/iccifree)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-ready-green.svg)](manifest.json)

---

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Architettura](#-architettura)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Uso](#-uso)
- [Testing](#-testing)
- [Ottimizzazioni](#-ottimizzazioni)
- [Deploy](#-deploy)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Caratteristiche

### 🎯 Core Features
- **Zero Censura**: Libertà di espressione totale
- **WebRTC P2P**: Streaming a bassa latenza (<1 secondo)
- **Real-time Chat**: Messaggistica istantanea integrata
- **Monetizzazione**: Guadagna direttamente dai tuoi fan
- **Privacy First**: I tuoi dati sono tuoi

### 🚀 Performance
- **PWA Ready**: Installabile come app nativa
- **Offline Support**: Funziona senza connessione
- **Lazy Loading**: Caricamento ottimizzato delle risorse
- **Service Worker**: Caching intelligente
- **Core Web Vitals**: Ottimizzato per velocità

### 🔒 Security
- **Security Headers**: X-Frame-Options, CSP, HSTS
- **OAuth 2.0**: Autenticazione sicura
- **Supabase Auth**: Backend sicuro e scalabile
- **Error Recovery**: Gestione errori automatica

---

## 🏗️ Architettura

```
iccifree-complete/
│
├── index.html              # Homepage
├── dashboard.html          # Dashboard utente
├── auth.html              # Autenticazione
├── golive.html            # Go Live interface
├── offline.html           # PWA offline page
│
├── manifest.json          # PWA manifest
├── service-worker.js      # Service worker
├── sitemap.xml            # SEO sitemap
├── robots.txt             # SEO robots
├── _headers               # Security headers
│
├── css/
│   ├── style.css                    # Main styles
│   └── mobile-optimizations.css    # Mobile-specific
│
├── js/
│   ├── app.js                    # Homepage logic
│   ├── supabase.js               # Supabase client
│   ├── webrtc-streaming.js       # WebRTC V5.0
│   ├── analytics.js              # Analytics system
│   ├── error-handler.js          # Error management
│   ├── performance-optimizer.js  # Performance tools
│   └── testing-utils.js          # Testing suite
│
└── images/
    └── [icons, screenshots, assets]
```

---

## 📦 Installazione

### Requisiti
- Node.js 18+ (opzionale, per dev tools)
- Browser moderno (Chrome 90+, Firefox 88+, Safari 14+)
- Account Supabase (per backend)

### Quick Start

1. **Clone il repository**
```bash
git clone https://github.com/yourusername/iccifree.git
cd iccifree-complete
```

2. **Configura Supabase**
- Crea un progetto su [supabase.com](https://supabase.com)
- Copia le credenziali (URL e anon key)
- Aggiornale in `js/supabase.js`

3. **Avvia il server locale**
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve

# Con VS Code Live Server
# Clicca "Go Live" in basso a destra
```

4. **Apri il browser**
```
http://localhost:8000
```

---

## ⚙️ Configurazione

### Supabase Setup

1. **Database Tables**
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Streams
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  is_live BOOLEAN DEFAULT false,
  viewer_count INT DEFAULT 0,
  offer TEXT,
  answer TEXT,
  ice_candidates TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES streams(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **Storage Buckets**
- `avatars`: Per avatar utenti
- `thumbnails`: Per thumbnail stream

3. **RPC Functions**
```sql
-- Add ICE candidate
CREATE OR REPLACE FUNCTION add_ice_candidate(
  stream_id_param UUID,
  candidate_param TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE streams
  SET ice_candidates = array_append(ice_candidates, candidate_param)
  WHERE id = stream_id_param;
END;
$$ LANGUAGE plpgsql;
```

### Environment Variables

Crea `.env` (opzionale):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

---

## 🎮 Uso

### Per Streamers

1. **Login**
   - Vai su `/auth.html`
   - Login con Google/Discord/Email

2. **Go Live**
   - Clicca "Go Live" nella dashboard
   - Scegli titolo e descrizione
   - Permetti accesso a camera/microfono
   - Clicca "Start Streaming"

3. **Gestisci Stream**
   - Vedi viewer count in real-time
   - Rispondi alla chat
   - Termina quando vuoi

### Per Viewers

1. **Esplora**
   - Vai alla dashboard
   - Vedi stream live disponibili

2. **Guarda**
   - Clicca su uno stream
   - Chat con altri viewer
   - Follow lo streamer

---

## 🧪 Testing

### Console Commands

Il progetto include una suite completa di testing:

```javascript
// Run all tests
runTests()

// Test specifici
testWebRTC()        // Test WebRTC support
testPerformance()   // Test performance metrics
testNetwork()       // Test network conditions

// Reports
testReport()        // Console report
downloadReport()    // Download JSON report
```

### Manual Testing

1. **WebRTC Connection**
   - Apri 2 browser (o incognito)
   - Uno fa broadcast, l'altro viewer
   - Verifica connessione entro 5 secondi

2. **Mobile Testing**
   - Usa Chrome DevTools (F12)
   - Toggle device toolbar
   - Test su vari dispositivi

3. **Offline Mode**
   - Apri DevTools > Network
   - Tick "Offline"
   - Verifica offline page

---

## 🚀 Ottimizzazioni

### Performance

#### ✅ Implementato
- [x] Lazy loading immagini
- [x] Image optimization (Supabase transform)
- [x] Code splitting (modules)
- [x] Preconnect to external domains
- [x] Resource hints (prefetch/preload)
- [x] Core Web Vitals monitoring
- [x] Service Worker caching

#### 📊 Metriche Target
- **LCP**: < 2.5s ✅
- **FID**: < 100ms ✅
- **CLS**: < 0.1 ✅
- **TTFB**: < 600ms ✅

### WebRTC V5.0

**Miglioramenti:**
- ✅ Retry logic avanzato (max 3 tentativi)
- ✅ ICE candidate handling ottimizzato
- ✅ Connection state monitoring
- ✅ Automatic reconnection
- ✅ Stats tracking real-time
- ✅ Bandwidth adaptation

### Error Handling

**Features:**
- ✅ Global error capture
- ✅ Promise rejection handling
- ✅ Resource error tracking
- ✅ User-friendly toast notifications
- ✅ Automatic recovery per WebRTC
- ✅ Offline detection

### Analytics

**Tracking:**
- ✅ Page views
- ✅ User interactions (clicks, forms)
- ✅ Scroll depth
- ✅ Session duration
- ✅ Performance metrics
- ✅ Error events
- ✅ Custom events (stream_start, follow, etc.)

### Security

**Implementato:**
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security (HSTS)
- ✅ Content-Security-Policy (CSP)
- ✅ Referrer-Policy
- ✅ Permissions-Policy

### PWA

**Features:**
- ✅ Installable (Add to Home Screen)
- ✅ Offline support
- ✅ Background sync
- ✅ Push notifications ready
- ✅ App shortcuts
- ✅ Share target API

### Mobile

**Ottimizzazioni:**
- ✅ Touch targets 44x44px min
- ✅ No zoom on input focus (font-size 16px)
- ✅ Smooth scrolling (-webkit-overflow-scrolling)
- ✅ Safe area support (iPhone notch)
- ✅ Landscape mode optimization
- ✅ Reduced motion support

---

## 📤 Deploy

### Netlify

1. **Build Settings**
```toml
# netlify.toml
[build]
  publish = "."
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Deploy**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Custom Server (Nginx)

```nginx
server {
    listen 80;
    server_name iccifree.com;
    
    root /var/www/iccifree;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🐛 Troubleshooting

### WebRTC Non Connette

**Sintomi:** Stream non parte, loading infinito

**Soluzioni:**
1. Verifica permessi camera/microfono
2. Controlla console per errori ICE
3. Testa con `testWebRTC()`
4. Verifica STUN server accessibili
5. Prova da rete diversa (alcuni firewall bloccano WebRTC)

### Service Worker Non Aggiorna

**Sintomi:** Modifiche non visibili

**Soluzioni:**
1. Hard refresh (Ctrl+Shift+R)
2. Cancella cache browser
3. Unregister SW manualmente:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
```

### Performance Lenta

**Sintomi:** Caricamento lento, lag

**Soluzioni:**
1. Run `testPerformance()` per diagnostics
2. Verifica network con `testNetwork()`
3. Controlla Core Web Vitals:
```javascript
window.PerformanceOptimizer.getMetrics()
```
4. Ottimizza immagini
5. Riduci bundle size

### Errori Supabase

**Sintomi:** API errors, auth failures

**Soluzioni:**
1. Verifica credenziali in `supabase.js`
2. Controlla RLS policies
3. Verifica quota Supabase
4. Check logs in Supabase dashboard

---

## 📚 Resources

### Documentation
- [WebRTC Guide](https://webrtc.org/getting-started/overview)
- [Supabase Docs](https://supabase.com/docs)
- [PWA Guide](https://web.dev/progressive-web-apps/)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance audit
- [WebPageTest](https://www.webpagetest.org/) - Performance testing
- [Can I Use](https://caniuse.com/) - Browser compatibility

---

## 🤝 Contributing

Contributi benvenuti! Per favore:

1. Fork il repository
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

---

## 📄 License

Questo progetto è sotto licenza MIT. Vedi [LICENSE](LICENSE) per dettagli.

---

## 👨‍💻 Autori

- **Team ICCI FREE** - *Initial work*

---

## 🙏 Ringraziamenti

- Supabase per il backend
- WebRTC per P2P streaming
- Community open source

---

## 🔗 Links

- **Website**: [iccifree.com](https://iccifree.com)
- **Documentation**: [docs.iccifree.com](https://docs.iccifree.com)
- **Support**: [support@iccifree.com](mailto:support@iccifree.com)

---

<div align="center">
  <strong>Built with 🔥 for freedom</strong>
  <br>
  <sub>ICCI FREE © 2025</sub>
</div>
