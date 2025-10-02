// ============= TIKTOK MODAL SYSTEM - COMPLETE FUNCTIONALITY =============

console.log('🎭 TikTok Modals loading...');

const TikTokModals = {
    
    // ============= MODAL SYSTEM BASE =============
    createModal: function(id, title, content) {
        // Remove existing modal
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'tiktok-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="TikTokModals.closeModal('${id}')">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="TikTokModals.closeModal('${id}')">×</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add modal styles if not exists
        this.addModalStyles();
        
        // Animate in
        setTimeout(() => modal.classList.add('active'), 10);
        
        return modal;
    },
    
    closeModal: function(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    addModalStyles: function() {
        if (document.getElementById('tiktokModalStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'tiktokModalStyles';
        style.textContent = `
            .tiktok-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .tiktok-modal.active {
                opacity: 1;
                visibility: visible;
            }
            
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .modal-content {
                background: #1a1a1a;
                border-radius: 20px;
                max-width: 400px;
                width: 100%;
                max-height: 80vh;
                overflow: hidden;
                border: 1px solid rgba(255, 215, 0, 0.3);
                transform: scale(0.8) translateY(50px);
                transition: all 0.3s ease;
            }
            
            .tiktok-modal.active .modal-content {
                transform: scale(1) translateY(0);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid rgba(255, 215, 0, 0.2);
            }
            
            .modal-header h2 {
                color: #FFD700;
                font-size: 1.2rem;
                font-weight: 700;
                margin: 0;
            }
            
            .modal-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 1.5rem;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }
            
            .modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .modal-body {
                padding: 20px;
                color: #fff;
                overflow-y: auto;
                max-height: 60vh;
            }
            
            /* Chat Modal Styles */
            .chat-container {
                display: flex;
                flex-direction: column;
                height: 400px;
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                margin-bottom: 15px;
            }
            
            .chat-message {
                margin-bottom: 10px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                font-size: 0.9rem;
            }
            
            .chat-message.my-message {
                background: rgba(255, 215, 0, 0.2);
                margin-left: 20px;
            }
            
            .chat-user {
                font-weight: 600;
                color: #FFD700;
                margin-right: 8px;
            }
            
            .chat-text {
                color: #fff;
            }
            
            .chat-input-container {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .chat-input {
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 20px;
                padding: 10px 15px;
                color: #fff;
                font-size: 0.9rem;
            }
            
            .chat-input:focus {
                outline: none;
                border-color: #FFD700;
            }
            
            .chat-send-btn {
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #000;
            }
            
            .chat-send-btn:active {
                transform: scale(0.9);
            }
            
            /* Gifts Modal Styles */
            .gifts-container {
                text-align: center;
            }
            
            .user-gems {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                background: rgba(255, 215, 0, 0.2);
                padding: 10px 20px;
                border-radius: 20px;
                margin-bottom: 20px;
                font-weight: 600;
                color: #FFD700;
            }
            
            .gifts-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .gift-item {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 15px;
                padding: 15px 10px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .gift-item:active {
                transform: scale(0.95);
                background: rgba(255, 215, 0, 0.2);
            }
            
            .gift-icon {
                font-size: 2rem;
                margin-bottom: 8px;
            }
            
            .gift-name {
                font-size: 0.8rem;
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .gift-cost {
                font-size: 0.7rem;
                color: #FFD700;
                font-weight: 600;
            }
            
            .buy-gems-btn {
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000;
                border: none;
                padding: 12px 24px;
                border-radius: 20px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .buy-gems-btn:active {
                transform: scale(0.95);
            }
            
            /* Profile Modal Styles */
            .profile-container {
                text-align: center;
            }
            
            .profile-header {
                margin-bottom: 20px;
            }
            
            .profile-avatar-large {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px;
                color: #000;
            }
            
            .profile-header h3 {
                font-size: 1.3rem;
                font-weight: 700;
                margin-bottom: 5px;
                color: #FFD700;
            }
            
            .profile-email {
                font-size: 0.9rem;
                color: #ccc;
                margin-bottom: 20px;
            }
            
            .profile-stats {
                display: flex;
                justify-content: space-around;
                margin-bottom: 25px;
                background: rgba(255, 255, 255, 0.05);
                padding: 15px;
                border-radius: 15px;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-number {
                font-size: 1.2rem;
                font-weight: 700;
                color: #FFD700;
                display: block;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 0.8rem;
                color: #ccc;
            }
            
            .profile-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .profile-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 215, 0, 0.3);
                color: #fff;
                padding: 12px 20px;
                border-radius: 20px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .profile-btn:active {
                background: rgba(255, 215, 0, 0.2);
                transform: scale(0.98);
            }
            
            .profile-btn.logout-btn {
                background: rgba(255, 107, 107, 0.2);
                border-color: rgba(255, 107, 107, 0.5);
                color: #ff6b6b;
            }
            
            /* Discover Modal Styles */
            .discover-container {
                
            }
            
            .search-section {
                margin-bottom: 20px;
            }
            
            .search-bar {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .search-bar input {
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 20px;
                padding: 10px 15px;
                color: #fff;
                font-size: 0.9rem;
            }
            
            .search-bar input:focus {
                outline: none;
                border-color: #FFD700;
            }
            
            .search-btn {
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 1.2rem;
            }
            
            .trending-section {
                margin-bottom: 20px;
            }
            
            .trending-section h3 {
                color: #FFD700;
                margin-bottom: 15px;
                font-size: 1rem;
            }
            
            .categories-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .category-card {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 15px;
                padding: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .category-card:active {
                background: rgba(255, 215, 0, 0.2);
                transform: scale(0.98);
            }
            
            .category-icon {
                font-size: 1.8rem;
                margin-bottom: 8px;
            }
            
            .category-name {
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .category-count {
                font-size: 0.8rem;
                color: #ccc;
            }
            
            .hashtags-section h3 {
                color: #FFD700;
                margin-bottom: 15px;
                font-size: 1rem;
            }
            
            .hashtags-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .hashtag {
                background: rgba(255, 215, 0, 0.2);
                color: #FFD700;
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .hashtag:active {
                background: rgba(255, 215, 0, 0.3);
                transform: scale(0.95);
            }
            
            /* Inbox Modal Styles */
            .inbox-container {
                
            }
            
            .inbox-tabs {
                display: flex;
                margin-bottom: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 20px;
                padding: 5px;
            }
            
            .inbox-tab {
                flex: 1;
                background: none;
                border: none;
                color: #ccc;
                padding: 10px;
                border-radius: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .inbox-tab.active {
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000;
            }
            
            .messages-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .message-item {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(255, 255, 255, 0.05);
                padding: 12px;
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .message-item:active {
                background: rgba(255, 215, 0, 0.1);
                transform: scale(0.98);
            }
            
            .message-item.unread {
                background: rgba(255, 215, 0, 0.1);
                border: 1px solid rgba(255, 215, 0, 0.3);
            }
            
            .message-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                color: #000;
            }
            
            .message-content {
                flex: 1;
            }
            
            .message-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
            }
            
            .message-user {
                font-weight: 600;
                color: #FFD700;
                font-size: 0.9rem;
            }
            
            .message-time {
                font-size: 0.8rem;
                color: #ccc;
            }
            
            .message-text {
                font-size: 0.9rem;
                color: #fff;
                line-height: 1.3;
            }
            
            .unread-dot {
                position: absolute;
                top: 12px;
                right: 12px;
                width: 8px;
                height: 8px;
                background: #FFD700;
                border-radius: 50%;
            }
            
            /* Animations */
            @keyframes giftFly {
                0% {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(0.3) translateY(-300px);
                    opacity: 0;
                }
            }
            
            @keyframes giftSelect {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        `;
        document.head.appendChild(style);
    },
    
    // ============= CHAT MODAL =============
    showChatModal: function() {
        const modal = this.createModal('chat-modal', '💬 Chat Live', this.getChatModalContent());
        this.setupChatListeners(modal);
    },
    
    getChatModalContent: function() {
        return `
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-message">
                        <span class="chat-user">🎮 gamer_pro:</span>
                        <span class="chat-text">Awesome stream! 🔥</span>
                    </div>
                    <div class="chat-message">
                        <span class="chat-user">🎵 music_fan:</span>
                        <span class="chat-text">Love this content ❤️</span>
                    </div>
                    <div class="chat-message">
                        <span class="chat-user">👑 vip_user:</span>
                        <span class="chat-text">Keep it up! 👏</span>
                    </div>
                </div>
                
                <div class="chat-input-container">
                    <input type="text" class="chat-input" placeholder="Scrivi un messaggio..." id="chatInput">
                    <button class="chat-send-btn" onclick="TikTokModals.sendChatMessage()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },
    
    setupChatListeners: function(modal) {
        const chatInput = modal.querySelector('#chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
        
        // Auto-scroll chat
        const chatMessages = modal.querySelector('#chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    },
    
    sendChatMessage: function() {
        const input = document.getElementById('chatInput');
        if (!input || !input.value.trim()) return;
        
        const message = input.value.trim();
        const chatMessages = document.getElementById('chatMessages');
        
        if (chatMessages) {
            const messageEl = document.createElement('div');
            messageEl.className = 'chat-message my-message';
            messageEl.innerHTML = `
                <span class="chat-user">👤 Tu:</span>
                <span class="chat-text">${message}</span>
            `;
            
            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            input.value = '';
            
            if (window.TikTokApp) {
                window.TikTokApp.showNotification('💬 Messaggio inviato!');
            }
            
            // Simulate response
            setTimeout(() => {
                const responseEl = document.createElement('div');
                responseEl.className = 'chat-message';
                responseEl.innerHTML = `
                    <span class="chat-user">🤖 Bot:</span>
                    <span class="chat-text">Grazie per il messaggio! 😊</span>
                `;
                chatMessages.appendChild(responseEl);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1000);
        }
    },
    
    // ============= GIFTS MODAL =============
    showGiftsModal: function() {
        const modal = this.createModal('gifts-modal', '🎁 Invia Regali', this.getGiftsModalContent());
        this.setupGiftsListeners(modal);
    },
    
    getGiftsModalContent: function() {
        const gifts = [
            { id: 1, name: 'Rose', icon: '🌹', cost: 10 },
            { id: 2, name: 'Heart', icon: '❤️', cost: 20 },
            { id: 3, name: 'Fire', icon: '🔥', cost: 50 },
            { id: 4, name: 'Crown', icon: '👑', cost: 100 },
            { id: 5, name: 'Diamond', icon: '💎', cost: 200 },
            { id: 6, name: 'Rocket', icon: '🚀', cost: 500 }
        ];
        
        return `
            <div class="gifts-container">
                <div class="user-gems">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>1,250 gems</span>
                </div>
                
                <div class="gifts-grid">
                    ${gifts.map(gift => `
                        <div class="gift-item" data-gift-id="${gift.id}" onclick="TikTokModals.sendGift(${gift.id})">
                            <div class="gift-icon">${gift.icon}</div>
                            <div class="gift-name">${gift.name}</div>
                            <div class="gift-cost">${gift.cost} gems</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="buy-gems-section">
                    <button class="buy-gems-btn" onclick="TikTokModals.showBuyGemsModal()">
                        💳 Compra Gems
                    </button>
                </div>
            </div>
        `;
    },
    
    setupGiftsListeners: function(modal) {
        // Gift selection animations
        const giftItems = modal.querySelectorAll('.gift-item');
        giftItems.forEach(item => {
            item.addEventListener('click', () => {
                item.style.animation = 'giftSelect 0.3s ease';
                setTimeout(() => {
                    item.style.animation = '';
                }, 300);
            });
        });
    },
    
    sendGift: function(giftId) {
        const gifts = {
            1: { name: 'Rose', icon: '🌹', cost: 10 },
            2: { name: 'Heart', icon: '❤️', cost: 20 },
            3: { name: 'Fire', icon: '🔥', cost: 50 },
            4: { name: 'Crown', icon: '👑', cost: 100 },
            5: { name: 'Diamond', icon: '💎', cost: 200 },
            6: { name: 'Rocket', icon: '🚀', cost: 500 }
        };
        
        const gift = gifts[giftId];
        if (gift) {
            this.createGiftAnimation(gift.icon);
            if (window.TikTokApp) {
                window.TikTokApp.showNotification(`🎁 ${gift.name} inviato! (-${gift.cost} gems)`);
            }
            this.closeModal('gifts-modal');
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        }
    },
    
    createGiftAnimation: function(icon) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const giftEl = document.createElement('div');
                giftEl.textContent = icon;
                giftEl.style.cssText = `
                    position: fixed;
                    right: 60px;
                    bottom: 200px;
                    font-size: 2rem;
                    z-index: 1000;
                    pointer-events: none;
                    animation: giftFly 2s ease-out forwards;
                `;
                
                document.body.appendChild(giftEl);
                setTimeout(() => giftEl.remove(), 2000);
            }, i * 200);
        }
    },
    
    showBuyGemsModal: function() {
        if (window.TikTokApp) {
            window.TikTokApp.showNotification('💳 Acquisto gems in arrivo!');
        }
        this.closeModal('gifts-modal');
    },
    
    // ============= PROFILE MODAL =============
    showProfileModal: function() {
        const modal = this.createModal('profile-modal', '👤 Profilo', this.getProfileModalContent());
        this.setupProfileListeners(modal);
    },
    
    getProfileModalContent: function() {
        const currentUser = window.TikTokApp?.currentUser;
        return `
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-avatar-large">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </div>
                    <h3>${currentUser?.email?.split('@')[0] || 'User'}</h3>
                    <p class="profile-email">${currentUser?.email || 'email@example.com'}</p>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <div class="stat-number">1.2K</div>
                        <div class="stat-label">Followers</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">89</div>
                        <div class="stat-label">Following</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">15</div>
                        <div class="stat-label">Stream</div>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="profile-btn" onclick="TikTokModals.editProfile()">
                        ✏️ Modifica Profilo
                    </button>
                    <button class="profile-btn" onclick="TikTokModals.showSettings()">
                        ⚙️ Impostazioni
                    </button>
                    <button class="profile-btn logout-btn" onclick="TikTokModals.logout()">
                        🚪 Logout
                    </button>
                </div>
            </div>
        `;
    },
    
    setupProfileListeners: function(modal) {
        // Profile actions setup
    },
    
    editProfile: function() {
        if (window.TikTokApp) {
            window.TikTokApp.showNotification('✏️ Modifica profilo in arrivo!');
        }
        this.closeModal('profile-modal');
    },
    
    showSettings: function() {
        if (window.TikTokApp) {
            window.TikTokApp.showNotification('⚙️ Impostazioni in arrivo!');
        }
        this.closeModal('profile-modal');
    },
    
    logout: function() {
        if (confirm('Sei sicuro di voler uscire?')) {
            if (window.TikTokApp) {
                window.TikTokApp.showNotification('🚪 Logout in corso...');
            }
            this.closeModal('profile-modal');
            setTimeout(() => {
                window.location.href = '/auth.html';
            }, 1000);
        }
    },
    
    // ============= DISCOVER MODAL =============
    showDiscoverModal: function() {
        const modal = this.createModal('discover-modal', '🔍 Scopri', this.getDiscoverModalContent());
        this.setupDiscoverListeners(modal);
    },
    
    getDiscoverModalContent: function() {
        const categories = [
            { name: 'Gaming', icon: '🎮', count: '2.1K' },
            { name: 'Musica', icon: '🎵', count: '1.8K' },
            { name: 'Talk', icon: '💬', count: '956' },
            { name: 'Arte', icon: '🎨', count: '743' },
            { name: 'Sport', icon: '⚽', count: '621' },
            { name: 'Cucina', icon: '🍳', count: '489' }
        ];
        
        return `
            <div class="discover-container">
                <div class="search-section">
                    <div class="search-bar">
                        <input type="text" placeholder="Cerca stream, utenti..." id="discoverSearch">
                        <button class="search-btn" onclick="TikTokModals.searchContent()">🔍</button>
                    </div>
                </div>
                
                <div class="trending-section">
                    <h3>🔥 Categorie Trending</h3>
                    <div class="categories-grid">
                        ${categories.map(cat => `
                            <div class="category-card" onclick="TikTokModals.browseCategory('${cat.name}')">
                                <div class="category-icon">${cat.icon}</div>
                                <div class="category-name">${cat.name}</div>
                                <div class="category-count">${cat.count} live</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="hashtags-section">
                    <h3># Hashtag Popolari</h3>
                    <div class="hashtags-list">
                        <span class="hashtag" onclick="TikTokModals.searchHashtag('gaming')">#gaming</span>
                        <span class="hashtag" onclick="TikTokModals.searchHashtag('music')">#music</span>
                        <span class="hashtag" onclick="TikTokModals.searchHashtag('justchatting')">#justchatting</span>
                        <span class="hashtag" onclick="TikTokModals.searchHashtag('art')">#art</span>
                        <span class="hashtag" onclick="TikTokModals.searchHashtag('cooking')">#cooking</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    setupDiscoverListeners: function(modal) {
        const searchInput = modal.querySelector('#discoverSearch');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchContent(e.target.value);
                }
            });
        }
    },
    
    browseCategory: function(categoryName) {
        if (window.TikTokApp) {
            window.TikTokApp.showNotification(`🔍 Navigando in ${categoryName}...`);
        }
        this.closeModal('discover-modal');
    },
    
    searchContent: function(query) {
        const input = document.getElementById('discoverSearch');
        const searchTerm = query || (input ? input.value : '');
        
        if (searchTerm && window.TikTokApp) {
            window.TikTokApp.showNotification(`🔍 Cercando: "${searchTerm}"`);
        }
        this.closeModal('discover-modal');
    },
    
    searchHashtag: function(hashtag) {
        if (window.TikTokApp) {
            window.TikTokApp.showNotification(`🔍 Cercando #${hashtag}`);
        }
        this.closeModal('discover-modal');
    },
    
    // ============= INBOX MODAL =============
    showInboxModal: function() {
        const modal = this.createModal('inbox-modal', '💬 Inbox', this.getInboxModalContent());
        this.setupInboxListeners(modal);
    },
    
    getInboxModalContent: function() {
        const messages = [
            { user: 'gamer_pro', message: 'Grazie per aver guardato il mio stream!', time: '2m', unread: true },
            { user: 'music_lover', message: 'Ti ho inviato un regalo 🎁', time: '15m', unread: true },
            { user: 'chat_master', message: 'Ciao! Come stai?', time: '1h', unread: false },
            { user: 'artist_creative', message: 'Hai visto il mio ultimo stream?', time: '3h', unread: false }
        ];
        
        return `
            <div class="inbox-container">
                <div class="inbox-tabs">
                    <button class="inbox-tab active" data-tab="messages">💬 Messaggi</button>
                    <button class="inbox-tab" data-tab="notifications">🔔 Notifiche</button>
                </div>
                
                <div class="messages-list" id="messagesList">
                    ${messages.map(msg => `
                        <div class="message-item ${msg.unread ? 'unread' : ''}" onclick="TikTokModals.openMessage('${msg.user}')">
                            <div class="message-avatar">👤</div>
                            <div class="message-content">
                                <div class="message-header">
                                    <span class="message-user">@${msg.user}</span>
                                    <span class="message-time">${msg.time}</span>
                                </div>
                                <div class="message-text">${msg.message}</div>
                            </div>
                            ${msg.unread ? '<div class="unread-dot"></div>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    setupInboxListeners: function(modal) {
        const tabs = modal.querySelectorAll('.inbox-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.switchInboxTab(e.target.dataset.tab);
            });
        });
    },
    
    switchInboxTab: function(tab) {
        if (tab === 'notifications' && window.TikTokApp) {
            window.TikTokApp.showNotification('🔔 Notifiche in arrivo!');
        }
    },
    
    openMessage: function(user) {
        if (window.TikTokApp) {
            window.TikTokApp.showNotification(`💬 Aprendo chat con @${user}`);
        }
        this.closeModal('inbox-modal');
    }
};

// Export globally
window.TikTokModals = TikTokModals;

console.log('✅ TikTok Modals loaded');