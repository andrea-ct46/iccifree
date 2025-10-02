// ============= ICCI FREE MOBILE APP - MAIN CONTROLLER =============
// Sistema di navigazione e gestione views per app mobile

console.log('📱 Mobile App loading...');

const MobileApp = {
    // ============= STATE =============
    currentView: 'home',
    currentUser: null,
    isLive: false,
    currentStream: null,
    userGems: 0,
    
    // ============= INIT =============
    init: async function() {
        console.log('📱 Mobile App initializing...');
        
        try {
            // Load current user
            if (window.SupabaseMobile) {
                await window.SupabaseMobile.init();
                this.currentUser = window.SupabaseMobile.currentUser;
                
                if (this.currentUser) {
                    await this.loadUserGems();
                }
            }
            
            // Setup touch events
            this.setupTouchEvents();
            
            // Render initial view
            this.renderView('home');
            
            // Setup realtime subscriptions
            this.setupRealtimeSubscriptions();
            
            console.log('✅ Mobile App ready');
            
        } catch (error) {
            console.error('❌ Mobile App init error:', error);
        }
    },
    
    // ============= NAVIGATION =============
    renderView: function(viewName) {
        console.log(`📱 Rendering view: ${viewName}`);
        
        this.currentView = viewName;
        
        // Get main content container
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('❌ Main content container not found');
            return;
        }
        
        // Render view content
        let viewHTML = '';
        switch(viewName) {
            case 'home':
                viewHTML = this.getHomeView();
                break;
            case 'explore':
                viewHTML = this.getExploreView();
                break;
            case 'golive':
                viewHTML = this.getGoLiveView();
                break;
            case 'wallet':
                viewHTML = this.getWalletView();
                break;
            case 'profile':
                viewHTML = this.getProfileView();
                break;
            default:
                viewHTML = this.getHomeView();
        }
        
        // Update content
        mainContent.innerHTML = viewHTML + this.getBottomNav();
        
        // Add event listeners
        this.addViewEventListeners(viewName);
        
        // Update bottom nav active state
        this.updateBottomNavActive(viewName);
    },
    
    // ============= HOME VIEW =============
    getHomeView: function() {
        return `
            <div class="view-home">
                <!-- Hero Section -->
                <div class="hero-section">
                    <div class="hero-content">
                        <h1 class="hero-title">
                            <span class="gradient-text">Stream Without Limits</span>
                        </h1>
                        <p class="hero-subtitle">
                            Esprimi le tue opinioni liberamente. Zero censura, massima libertà.
                        </p>
                        
                        ${this.currentUser ? `
                            <div class="user-welcome">
                                <div class="user-avatar">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                </div>
                                <div class="user-info">
                                    <span class="user-name">Ciao, ${this.currentUser.email?.split('@')[0] || 'User'}!</span>
                                    <div class="user-gems">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>${this.userGems} gems</span>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <button class="cta-button" onclick="window.location.href='/auth.html'">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                Inizia Subito
                            </button>
                        `}
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="quick-actions">
                    <div class="action-card" onclick="MobileApp.renderView('golive')">
                        <div class="action-icon">🔴</div>
                        <div class="action-content">
                            <h3>Go Live</h3>
                            <p>Inizia il tuo stream</p>
                        </div>
                        <div class="action-arrow">→</div>
                    </div>
                    
                    <div class="action-card" onclick="MobileApp.renderView('explore')">
                        <div class="action-icon">🔍</div>
                        <div class="action-content">
                            <h3>Esplora</h3>
                            <p>Scopri stream live</p>
                        </div>
                        <div class="action-arrow">→</div>
                    </div>
                    
                    <div class="action-card" onclick="MobileApp.renderView('wallet')">
                        <div class="action-icon">💎</div>
                        <div class="action-content">
                            <h3>Wallet</h3>
                            <p>${this.userGems} gems disponibili</p>
                        </div>
                        <div class="action-arrow">→</div>
                    </div>
                </div>
                
                <!-- Live Streams -->
                <div class="live-streams-section">
                    <div class="section-header">
                        <h2>🔥 Stream Live</h2>
                        <button class="see-all-btn" onclick="MobileApp.renderView('explore')">Vedi tutti</button>
                    </div>
                    
                    <div id="live-streams-container" class="live-streams-grid">
                        <div class="loading-streams">
                            <div class="spinner"></div>
                            <p>Caricamento stream...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ============= EXPLORE VIEW =============
    getExploreView: function() {
        return `
            <div class="view-explore">
                <!-- Header -->
                <div class="explore-header">
                    <h1>🔍 Esplora</h1>
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="Cerca stream..." id="search-input">
                        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                    </div>
                </div>
                
                <!-- Categories -->
                <div class="categories-section">
                    <div class="categories-scroll">
                        <div class="category-chip active" data-category="all">Tutti</div>
                        <div class="category-chip" data-category="gaming">🎮 Gaming</div>
                        <div class="category-chip" data-category="music">🎵 Musica</div>
                        <div class="category-chip" data-category="talk">💬 Talk</div>
                        <div class="category-chip" data-category="art">🎨 Arte</div>
                        <div class="category-chip" data-category="sport">⚽ Sport</div>
                    </div>
                </div>
                
                <!-- Streams Grid -->
                <div id="explore-streams-container" class="explore-streams">
                    <div class="loading-streams">
                        <div class="spinner"></div>
                        <p>Caricamento stream...</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ============= GO LIVE VIEW =============
    getGoLiveView: function() {
        if (!this.currentUser) {
            return `
                <div class="view-golive">
                    <div class="auth-required">
                        <div class="auth-icon">🔐</div>
                        <h2>Login Richiesto</h2>
                        <p>Devi effettuare il login per iniziare uno stream live.</p>
                        <button class="cta-button" onclick="window.location.href='/auth.html'">
                            Vai al Login
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (this.isLive) {
            return this.getLiveStreamingView();
        } else {
            return this.getStreamSetupView();
        }
    },
    
    // ============= STREAM SETUP VIEW =============
    getStreamSetupView: function() {
        return `
            <div class="view-golive">
                <!-- Header -->
                <div class="golive-header">
                    <h1>🔴 Go Live</h1>
                    <p>Configura il tuo stream e inizia a trasmettere</p>
                </div>
                
                <!-- Preview -->
                <div class="stream-preview">
                    <video id="preview-video" class="preview-video" autoplay muted playsinline></video>
                    <div class="preview-overlay">
                        <button class="camera-flip-btn" onclick="MobileApp.flipCamera()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Stream Configuration -->
                <div class="stream-config">
                    <div class="config-section">
                        <label class="config-label">Titolo Stream</label>
                        <input type="text" id="stream-title" class="config-input" placeholder="Inserisci il titolo del tuo stream..." maxlength="100">
                    </div>
                    
                    <div class="config-section">
                        <label class="config-label">Categoria</label>
                        <select id="stream-category" class="config-select">
                            <option value="">Seleziona categoria</option>
                            <option value="gaming">🎮 Gaming</option>
                            <option value="music">🎵 Musica</option>
                            <option value="talk">💬 Talk Show</option>
                            <option value="art">🎨 Arte e Creatività</option>
                            <option value="sport">⚽ Sport</option>
                            <option value="education">📚 Educazione</option>
                            <option value="other">🌟 Altro</option>
                        </select>
                    </div>
                    
                    <div class="config-section">
                        <label class="config-label">Descrizione</label>
                        <textarea id="stream-description" class="config-textarea" placeholder="Descrivi il tuo stream..." maxlength="500"></textarea>
                    </div>
                    
                    <!-- Stream Settings -->
                    <div class="stream-settings">
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-title">Chat Attiva</span>
                                <span class="setting-desc">Permetti ai viewer di chattare</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="enable-chat" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-title">Regali Attivi</span>
                                <span class="setting-desc">Permetti di ricevere regali</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="enable-gifts" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Go Live Button -->
                <div class="golive-actions">
                    <button class="golive-btn" onclick="MobileApp.startLive()" id="start-live-btn">
                        <div class="btn-content">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="8"/>
                            </svg>
                            <span>Inizia Stream Live</span>
                        </div>
                    </button>
                </div>
            </div>
        `;
    },
    
    // ============= LIVE STREAMING VIEW =============
    getLiveStreamingView: function() {
        return `
            <div class="view-golive live-active">
                <!-- Live Header -->
                <div class="live-header">
                    <div class="live-indicator">
                        <div class="live-dot"></div>
                        <span>LIVE</span>
                    </div>
                    <div class="live-duration" id="live-duration">00:00</div>
                </div>
                
                <!-- Live Stats -->
                <div class="live-stats">
                    <div class="stat-card">
                        <div class="stat-icon">👁️</div>
                        <div class="stat-content">
                            <div class="stat-number" id="viewer-count">0</div>
                            <div class="stat-label">Viewers</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">💎</div>
                        <div class="stat-content">
                            <div class="stat-number" id="gems-earned">0</div>
                            <div class="stat-label">Gems Guadagnate</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🎁</div>
                        <div class="stat-content">
                            <div class="stat-number" id="gifts-received">0</div>
                            <div class="stat-label">Regali</div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="live-activity">
                    <h3>Attività Recente</h3>
                    <div id="activity-feed" class="activity-feed">
                        <div class="activity-item">
                            <span class="activity-text">Stream iniziato!</span>
                            <span class="activity-time">ora</span>
                        </div>
                    </div>
                </div>
                
                <!-- Live Controls -->
                <div class="live-controls">
                    <button class="control-btn" onclick="MobileApp.toggleMute()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                    </button>
                    
                    <button class="control-btn" onclick="MobileApp.flipCamera()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                        </svg>
                    </button>
                    
                    <button class="stop-live-btn" onclick="MobileApp.stopLive()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12"/>
                        </svg>
                        <span>Termina Live</span>
                    </button>
                </div>
            </div>
        `;
    },
    
    // ============= WALLET VIEW =============
    getWalletView: function() {
        return `
            <div class="view-wallet">
                <!-- Header -->
                <div class="wallet-header">
                    <h1>💎 Wallet</h1>
                    <p>Gestisci le tue gems e transazioni</p>
                </div>
                
                <!-- Gems Balance Card -->
                <div class="gems-balance-card">
                    <div class="balance-background">
                        <div class="balance-stars">✨</div>
                        <div class="balance-content">
                            <div class="balance-label">Saldo Gems</div>
                            <div class="balance-amount">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFD700">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span class="balance-number">${this.userGems}</span>
                            </div>
                            <button class="buy-gems-btn" onclick="MobileApp.showBuyGemsModal()">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                Compra Gems
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="wallet-actions">
                    <div class="action-item" onclick="MobileApp.showBuyGemsModal()">
                        <div class="action-icon">💳</div>
                        <span>Compra Gems</span>
                    </div>
                    <div class="action-item" onclick="MobileApp.showTransactionHistory()">
                        <div class="action-icon">📊</div>
                        <span>Cronologia</span>
                    </div>
                    <div class="action-item" onclick="MobileApp.showGiftModal()">
                        <div class="action-icon">🎁</div>
                        <span>Invia Regalo</span>
                    </div>
                </div>
                
                <!-- Recent Transactions -->
                <div class="transactions-section">
                    <div class="section-header">
                        <h3>Transazioni Recenti</h3>
                        <button class="see-all-btn" onclick="MobileApp.showTransactionHistory()">Vedi tutte</button>
                    </div>
                    
                    <div id="transactions-container" class="transactions-list">
                        <div class="loading-transactions">
                            <div class="spinner"></div>
                            <p>Caricamento transazioni...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ============= PROFILE VIEW =============
    getProfileView: function() {
        if (!this.currentUser) {
            return `
                <div class="view-profile">
                    <div class="auth-required">
                        <div class="auth-icon">👤</div>
                        <h2>Profilo Non Disponibile</h2>
                        <p>Effettua il login per visualizzare il tuo profilo.</p>
                        <button class="cta-button" onclick="window.location.href='/auth.html'">
                            Vai al Login
                        </button>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="view-profile">
                <!-- Profile Header -->
                <div class="profile-header">
                    <div class="profile-background">
                        <div class="floating-stars">
                            <div class="star">⭐</div>
                            <div class="star">✨</div>
                            <div class="star">🌟</div>
                        </div>
                    </div>
                    
                    <div class="profile-content">
                        <div class="profile-avatar">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                        </div>
                        
                        <div class="profile-info">
                            <h2 class="profile-name">${this.currentUser.email?.split('@')[0] || 'User'}</h2>
                            <p class="profile-email">${this.currentUser.email}</p>
                            
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <div class="stat-number">0</div>
                                    <div class="stat-label">Followers</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number">0</div>
                                    <div class="stat-label">Following</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number">0</div>
                                    <div class="stat-label">Stream</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Profile Actions -->
                <div class="profile-actions">
                    <button class="profile-btn secondary" onclick="MobileApp.editProfile()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        Modifica Profilo
                    </button>
                    
                    <button class="profile-btn secondary" onclick="MobileApp.showSettings()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                        </svg>
                        Impostazioni
                    </button>
                </div>
                
                <!-- Recent Streams Grid -->
                <div class="recent-streams-section">
                    <h3>I Tuoi Stream</h3>
                    <div class="streams-grid">
                        <div class="stream-placeholder">
                            <div class="placeholder-icon">📺</div>
                            <p>Nessuno stream ancora</p>
                            <button class="start-streaming-btn" onclick="MobileApp.renderView('golive')">
                                Inizia il tuo primo stream
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Logout -->
                <div class="profile-footer">
                    <button class="logout-btn" onclick="MobileApp.logout()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        `;
    },
    
    // ============= BOTTOM NAVIGATION =============
    getBottomNav: function() {
        return `
            <nav class="bottom-nav">
                <div class="nav-item" data-view="home" onclick="MobileApp.renderView('home')">
                    <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                    <span class="nav-label">Home</span>
                </div>
                
                <div class="nav-item" data-view="explore" onclick="MobileApp.renderView('explore')">
                    <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <span class="nav-label">Esplora</span>
                </div>
                
                <div class="nav-item nav-center" data-view="golive" onclick="MobileApp.renderView('golive')">
                    <div class="center-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="8"/>
                        </svg>
                    </div>
                </div>
                
                <div class="nav-item" data-view="wallet" onclick="MobileApp.renderView('wallet')">
                    <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span class="nav-label">Wallet</span>
                </div>
                
                <div class="nav-item" data-view="profile" onclick="MobileApp.renderView('profile')">
                    <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span class="nav-label">Profilo</span>
                </div>
            </nav>
        `;
    },
    
    // ============= EVENT LISTENERS =============
    addViewEventListeners: function(viewName) {
        // Add view-specific event listeners
        switch(viewName) {
            case 'home':
                this.loadLiveStreams();
                break;
            case 'explore':
                this.setupExploreListeners();
                this.loadExploreStreams();
                break;
            case 'golive':
                if (!this.isLive) {
                    this.setupCameraPreview();
                }
                break;
            case 'wallet':
                this.loadTransactions();
                break;
            case 'profile':
                this.loadUserProfile();
                break;
        }
    },
    
    // ============= HELPER FUNCTIONS =============
    updateBottomNavActive: function(activeView) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === activeView) {
                item.classList.add('active');
            }
        });
    },
    
    // ============= STREAMING FUNCTIONS =============
    startLive: async function() {
        console.log('🔴 Starting live stream...');
        
        const title = document.getElementById('stream-title')?.value;
        const category = document.getElementById('stream-category')?.value;
        const description = document.getElementById('stream-description')?.value;
        
        if (!title || !category) {
            this.showNotification('Inserisci titolo e categoria per iniziare', 'error');
            return;
        }
        
        try {
            // Create stream in database
            if (window.SupabaseMobile) {
                const streamData = {
                    title,
                    category,
                    description,
                    is_live: true,
                    started_at: new Date().toISOString()
                };
                
                const result = await window.SupabaseMobile.createStream(streamData);
                if (result.success) {
                    this.currentStream = result.data;
                    this.isLive = true;
                    this.renderView('golive');
                    this.startLiveTimer();
                    this.showNotification('Stream avviato con successo!', 'success');
                } else {
                    throw new Error(result.error);
                }
            }
            
        } catch (error) {
            console.error('❌ Error starting stream:', error);
            this.showNotification('Errore avvio stream: ' + error.message, 'error');
        }
    },
    
    stopLive: async function() {
        console.log('⏹️ Stopping live stream...');
        
        try {
            if (this.currentStream && window.SupabaseMobile) {
                await window.SupabaseMobile.endStream(this.currentStream.id);
            }
            
            this.isLive = false;
            this.currentStream = null;
            this.stopLiveTimer();
            this.renderView('golive');
            this.showNotification('Stream terminato', 'info');
            
        } catch (error) {
            console.error('❌ Error stopping stream:', error);
            this.showNotification('Errore terminazione stream', 'error');
        }
    },
    
    // ============= CAMERA FUNCTIONS =============
    setupCameraPreview: async function() {
        try {
            const video = document.getElementById('preview-video');
            if (video) {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user' }, 
                    audio: true 
                });
                video.srcObject = stream;
            }
        } catch (error) {
            console.error('❌ Camera access error:', error);
            this.showNotification('Errore accesso camera', 'error');
        }
    },
    
    flipCamera: async function() {
        // Implementation for camera flip
        console.log('📷 Flipping camera...');
    },
    
    toggleMute: function() {
        // Implementation for mute toggle
        console.log('🔇 Toggling mute...');
    },
    
    // ============= DATA LOADING =============
    loadLiveStreams: async function() {
        try {
            if (window.SupabaseMobile) {
                const result = await window.SupabaseMobile.getActiveStreams();
                if (result.success) {
                    this.renderLiveStreams(result.data);
                }
            }
        } catch (error) {
            console.error('❌ Error loading streams:', error);
        }
    },
    
    loadExploreStreams: async function() {
        // Similar to loadLiveStreams but for explore view
        await this.loadLiveStreams();
    },
    
    loadTransactions: async function() {
        try {
            if (this.currentUser && window.SupabaseMobile) {
                const result = await window.SupabaseMobile.getGiftHistory(this.currentUser.id);
                if (result.success) {
                    this.renderTransactions(result.data);
                }
            }
        } catch (error) {
            console.error('❌ Error loading transactions:', error);
        }
    },
    
    loadUserGems: async function() {
        try {
            if (this.currentUser && window.SupabaseMobile) {
                const result = await window.SupabaseMobile.getUserGems(this.currentUser.id);
                if (result.success) {
                    this.userGems = result.data || 0;
                }
            }
        } catch (error) {
            console.error('❌ Error loading gems:', error);
        }
    },
    
    loadUserProfile: async function() {
        // Load user profile data
        console.log('👤 Loading user profile...');
    },
    
    // ============= RENDER FUNCTIONS =============
    renderLiveStreams: function(streams) {
        const container = document.getElementById('live-streams-container');
        if (!container) return;
        
        if (!streams || streams.length === 0) {
            container.innerHTML = `
                <div class="no-streams">
                    <div class="no-streams-icon">📺</div>
                    <p>Nessuno stream attivo al momento</p>
                    <button class="cta-button" onclick="MobileApp.renderView('golive')">
                        Sii il primo a fare live!
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = streams.map(stream => `
            <div class="stream-card" onclick="MobileApp.watchStream('${stream.id}')">
                <div class="stream-thumbnail">
                    <div class="stream-preview"></div>
                    <div class="live-badge">LIVE</div>
                    <div class="viewer-count">👁️ ${stream.viewer_count || 0}</div>
                </div>
                <div class="stream-info">
                    <h4 class="stream-title">${stream.title}</h4>
                    <p class="stream-category">${stream.category}</p>
                    <div class="stream-meta">
                        <span class="streamer-name">@${stream.user_id?.slice(0, 8)}</span>
                        <span class="stream-time">${this.formatTime(stream.started_at)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    renderTransactions: function(transactions) {
        const container = document.getElementById('transactions-container');
        if (!container) return;
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <div class="no-transactions">
                    <div class="no-transactions-icon">📊</div>
                    <p>Nessuna transazione ancora</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = transactions.slice(0, 5).map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    ${this.getTransactionIcon(transaction.type)}
                </div>
                <div class="transaction-info">
                    <div class="transaction-title">${this.getTransactionTitle(transaction)}</div>
                    <div class="transaction-date">${this.formatDate(transaction.created_at)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'received' ? '+' : '-'}${transaction.amount} gems
                </div>
            </div>
        `).join('');
    },
    
    // ============= MODAL FUNCTIONS =============
    showGiftModal: function() {
        if (window.GiftSystem) {
            window.GiftSystem.showGiftModal();
        }
    },
    
    showBuyGemsModal: function() {
        if (window.GiftSystem) {
            window.GiftSystem.showBuyGemsModal();
        }
    },
    
    // ============= UTILITY FUNCTIONS =============
    watchStream: function(streamId) {
        console.log(`📺 Watching stream: ${streamId}`);
        window.location.href = `/stream-viewer-example.html?stream=${streamId}`;
    },
    
    formatTime: function(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000 / 60); // minutes
        
        if (diff < 1) return 'ora';
        if (diff < 60) return `${diff}m fa`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h fa`;
        return date.toLocaleDateString();
    },
    
    formatDate: function(timestamp) {
        return new Date(timestamp).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    getTransactionIcon: function(type) {
        const icons = {
            'sent': '📤',
            'received': '📥',
            'purchased': '💳'
        };
        return icons[type] || '💎';
    },
    
    getTransactionTitle: function(transaction) {
        const titles = {
            'sent': 'Regalo inviato',
            'received': 'Regalo ricevuto',
            'purchased': 'Gems acquistate'
        };
        return titles[transaction.type] || 'Transazione';
    },
    
    // ============= LIVE TIMER =============
    startLiveTimer: function() {
        this.liveStartTime = Date.now();
        this.liveTimer = setInterval(() => {
            const duration = Math.floor((Date.now() - this.liveStartTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationElement = document.getElementById('live-duration');
            if (durationElement) {
                durationElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    },
    
    stopLiveTimer: function() {
        if (this.liveTimer) {
            clearInterval(this.liveTimer);
            this.liveTimer = null;
        }
    },
    
    // ============= TOUCH EVENTS =============
    setupTouchEvents: function() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    },
    
    handleSwipe: function() {
        const swipeThreshold = 100;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next view
                this.navigateNext();
            } else {
                // Swipe right - previous view
                this.navigatePrevious();
            }
        }
    },
    
    navigateNext: function() {
        const views = ['home', 'explore', 'golive', 'wallet', 'profile'];
        const currentIndex = views.indexOf(this.currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        this.renderView(views[nextIndex]);
    },
    
    navigatePrevious: function() {
        const views = ['home', 'explore', 'golive', 'wallet', 'profile'];
        const currentIndex = views.indexOf(this.currentView);
        const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
        this.renderView(views[prevIndex]);
    },
    
    // ============= EXPLORE LISTENERS =============
    setupExploreListeners: function() {
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchStreams(e.target.value);
            }, 300));
        }
        
        // Category chips
        const categoryChips = document.querySelectorAll('.category-chip');
        categoryChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                categoryChips.forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.filterStreamsByCategory(e.target.dataset.category);
            });
        });
    },
    
    searchStreams: function(query) {
        console.log('🔍 Searching streams:', query);
        // Implement search functionality
    },
    
    filterStreamsByCategory: function(category) {
        console.log('📂 Filtering by category:', category);
        // Implement category filtering
    },
    
    // ============= REALTIME SUBSCRIPTIONS =============
    setupRealtimeSubscriptions: function() {
        if (window.SupabaseMobile && this.currentUser) {
            // Subscribe to gems updates
            window.SupabaseMobile.subscribeToGems(this.currentUser.id, (gems) => {
                this.userGems = gems;
                this.updateGemsDisplay();
            });
            
            // Subscribe to streams updates
            window.SupabaseMobile.subscribeToStreams((streams) => {
                if (this.currentView === 'home' || this.currentView === 'explore') {
                    this.renderLiveStreams(streams);
                }
            });
        }
    },
    
    updateGemsDisplay: function() {
        const gemsElements = document.querySelectorAll('.balance-number, .user-gems span');
        gemsElements.forEach(element => {
            if (element.textContent.includes('gems')) {
                element.textContent = `${this.userGems} gems`;
            } else {
                element.textContent = this.userGems;
            }
        });
    },
    
    // ============= UTILITY =============
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    showNotification: function(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    },
    
    // ============= AUTH FUNCTIONS =============
    logout: async function() {
        try {
            if (window.SupabaseMobile) {
                await window.SupabaseMobile.signOut();
            }
            
            this.currentUser = null;
            this.userGems = 0;
            this.renderView('home');
            this.showNotification('Logout effettuato', 'success');
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            this.showNotification('Errore logout', 'error');
        }
    }
};

// ============= AUTO INIT =============
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM loaded, initializing Mobile App...');
    MobileApp.init();
});

// Export globally
window.MobileApp = MobileApp;

console.log('✅ Mobile App script loaded');