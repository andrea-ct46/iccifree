// ============= GIFT SYSTEM MOBILE - COMPLETE IMPLEMENTATION =============
// Sistema completo per regali e gems su mobile

console.log('🎁 Gift System Mobile loading...');

const GiftSystem = {
    // ============= CONFIGURATION =============
    gifts: {
        Food: [
            { id: 1, name: 'Pizza Party', icon: '🍕', cost: 400, tier: 1, animation: 'bounce' },
            { id: 2, name: 'Hamburger', icon: '🍔', cost: 200, tier: 1, animation: 'shake' },
            { id: 3, name: 'Sushi Set', icon: '🍣', cost: 600, tier: 2, animation: 'spin' },
            { id: 4, name: 'Champagne', icon: '🍾', cost: 800, tier: 2, animation: 'pop' },
            { id: 5, name: 'Birthday Cake', icon: '🎂', cost: 1000, tier: 3, animation: 'celebrate' }
        ],
        Animals: [
            { id: 11, name: 'Cute Cat', icon: '🐱', cost: 300, tier: 1, animation: 'bounce' },
            { id: 12, name: 'Puppy Love', icon: '🐶', cost: 350, tier: 1, animation: 'wiggle' },
            { id: 13, name: 'Panda Hug', icon: '🐼', cost: 500, tier: 2, animation: 'hug' },
            { id: 14, name: 'Unicorn Magic', icon: '🦄', cost: 1200, tier: 3, animation: 'sparkle' },
            { id: 15, name: 'Dragon Fire', icon: '🐉', cost: 1500, tier: 3, animation: 'fire' }
        ],
        Cars: [
            { id: 21, name: 'Sports Car', icon: '🏎️', cost: 2000, tier: 3, animation: 'race' },
            { id: 22, name: 'Motorcycle', icon: '🏍️', cost: 1000, tier: 2, animation: 'speed' },
            { id: 23, name: 'Helicopter', icon: '🚁', cost: 3000, tier: 4, animation: 'fly' },
            { id: 24, name: 'Rocket Ship', icon: '🚀', cost: 5000, tier: 4, animation: 'launch' },
            { id: 25, name: 'Private Jet', icon: '✈️', cost: 10000, tier: 5, animation: 'soar' }
        ],
        Nature: [
            { id: 31, name: 'Rose Bouquet', icon: '🌹', cost: 250, tier: 1, animation: 'bloom' },
            { id: 32, name: 'Sunflower', icon: '🌻', cost: 150, tier: 1, animation: 'grow' },
            { id: 33, name: 'Rainbow', icon: '🌈', cost: 800, tier: 2, animation: 'arc' },
            { id: 34, name: 'Lightning', icon: '⚡', cost: 600, tier: 2, animation: 'zap' },
            { id: 35, name: 'Galaxy', icon: '🌌', cost: 2500, tier: 4, animation: 'cosmic' }
        ],
        Fantasy: [
            { id: 41, name: 'Magic Wand', icon: '🪄', cost: 700, tier: 2, animation: 'magic' },
            { id: 42, name: 'Crystal Ball', icon: '🔮', cost: 900, tier: 2, animation: 'mystical' },
            { id: 43, name: 'Crown Royal', icon: '👑', cost: 1800, tier: 3, animation: 'royal' },
            { id: 44, name: 'Diamond Ring', icon: '💍', cost: 3500, tier: 4, animation: 'shine' },
            { id: 45, name: 'Golden Throne', icon: '🪑', cost: 8000, tier: 5, animation: 'majestic' }
        ]
    },
    
    // ============= GEM PACKAGES =============
    gemPackages: [
        { gems: 500, price: 4.99, bonus: null, id: 'starter' },
        { gems: 1200, price: 9.99, bonus: '+10%', id: 'popular', popular: true },
        { gems: 2500, price: 19.99, bonus: '+15%', id: 'value' },
        { gems: 5500, price: 39.99, bonus: '+20%', id: 'premium' },
        { gems: 12000, price: 79.99, bonus: '+25%', id: 'ultimate' },
        { gems: 25000, price: 149.99, bonus: '+30%', id: 'legendary' }
    ],
    
    // ============= STATE =============
    currentCategory: 'Food',
    selectedGift: null,
    userGems: 0,
    targetStreamer: null,
    targetStream: null,
    
    // ============= INIT =============
    init: function() {
        console.log('🎁 Gift System initializing...');
        
        // Load user gems
        this.loadUserGems();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ Gift System ready');
    },
    
    // ============= LOAD USER GEMS =============
    loadUserGems: async function() {
        try {
            if (window.MobileApp && window.MobileApp.currentUser && window.SupabaseMobile) {
                const result = await window.SupabaseMobile.getUserGems(window.MobileApp.currentUser.id);
                if (result.success) {
                    this.userGems = result.data || 0;
                    if (window.MobileApp) {
                        window.MobileApp.userGems = this.userGems;
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error loading user gems:', error);
        }
    },
    
    // ============= SHOW GIFT MODAL =============
    showGiftModal: function(streamerId = null, streamId = null) {
        console.log('🎁 Showing gift modal...');
        
        if (!window.MobileApp || !window.MobileApp.currentUser) {
            window.MobileApp.showNotification('Devi effettuare il login per inviare regali', 'error');
            return;
        }
        
        this.targetStreamer = streamerId;
        this.targetStream = streamId;
        
        const modalHTML = this.getGiftModalHTML();
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'gift-modal-container';
        modalContainer.className = 'modal-overlay';
        modalContainer.innerHTML = modalHTML;
        
        document.body.appendChild(modalContainer);
        
        // Add event listeners
        this.setupGiftModalListeners();
        
        // Animate in
        setTimeout(() => {
            modalContainer.classList.add('active');
        }, 10);
    },
    
    // ============= GIFT MODAL HTML =============
    getGiftModalHTML: function() {
        return `
            <div class="gift-modal">
                <!-- Header -->
                <div class="gift-modal-header">
                    <h2>🎁 Invia un Regalo</h2>
                    <button class="modal-close-btn" onclick="GiftSystem.hideGiftModal()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <!-- User Gems Display -->
                <div class="user-gems-display">
                    <div class="gems-info">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span class="gems-count">${this.userGems} gems</span>
                    </div>
                    <button class="buy-gems-btn-small" onclick="GiftSystem.showBuyGemsModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        Compra
                    </button>
                </div>
                
                <!-- Categories -->
                <div class="gift-categories">
                    ${Object.keys(this.gifts).map(category => `
                        <button class="category-btn ${category === this.currentCategory ? 'active' : ''}" 
                                data-category="${category}" 
                                onclick="GiftSystem.selectCategory('${category}')">
                            ${this.getCategoryIcon(category)} ${category}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Gifts Grid -->
                <div class="gifts-grid" id="gifts-grid">
                    ${this.renderGifts(this.currentCategory)}
                </div>
                
                <!-- Send Button -->
                <div class="gift-modal-footer">
                    <button class="send-gift-btn" id="send-gift-btn" onclick="GiftSystem.sendSelectedGift()" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                        <span>Seleziona un regalo</span>
                    </button>
                </div>
            </div>
        `;
    },
    
    // ============= RENDER GIFTS =============
    renderGifts: function(category) {
        const gifts = this.gifts[category] || [];
        
        return gifts.map(gift => `
            <div class="gift-item ${this.userGems < gift.cost ? 'disabled' : ''} ${this.selectedGift?.id === gift.id ? 'selected' : ''}" 
                 data-gift-id="${gift.id}" 
                 data-animation="${gift.animation}"
                 onclick="GiftSystem.selectGift(${gift.id})">
                <div class="gift-icon">${gift.icon}</div>
                <div class="gift-name">${gift.name}</div>
                <div class="gift-cost">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    ${gift.cost}
                </div>
                <div class="gift-tier tier-${gift.tier}"></div>
            </div>
        `).join('');
    },
    
    // ============= CATEGORY FUNCTIONS =============
    selectCategory: function(category) {
        console.log('📂 Selecting category:', category);
        
        this.currentCategory = category;
        this.selectedGift = null;
        
        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        // Update gifts grid
        const giftsGrid = document.getElementById('gifts-grid');
        if (giftsGrid) {
            giftsGrid.innerHTML = this.renderGifts(category);
        }
        
        // Reset send button
        this.updateSendButton();
    },
    
    getCategoryIcon: function(category) {
        const icons = {
            'Food': '🍕',
            'Animals': '🐱',
            'Cars': '🏎️',
            'Nature': '🌹',
            'Fantasy': '🪄'
        };
        return icons[category] || '🎁';
    },
    
    // ============= GIFT SELECTION =============
    selectGift: function(giftId) {
        console.log('🎁 Selecting gift:', giftId);
        
        // Find gift in current category
        const gift = this.gifts[this.currentCategory].find(g => g.id === giftId);
        if (!gift) return;
        
        // Check if user has enough gems
        if (this.userGems < gift.cost) {
            window.MobileApp.showNotification('Gems insufficienti per questo regalo', 'error');
            return;
        }
        
        // Update selection
        this.selectedGift = gift;
        
        // Update UI
        document.querySelectorAll('.gift-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.giftId == giftId) {
                item.classList.add('selected');
                // Trigger preview animation
                this.triggerPreviewAnimation(item, gift.animation);
            }
        });
        
        // Update send button
        this.updateSendButton();
    },
    
    // ============= SEND GIFT =============
    sendSelectedGift: async function() {
        if (!this.selectedGift) return;
        
        console.log('📤 Sending gift:', this.selectedGift);
        
        try {
            // Disable button during send
            const sendBtn = document.getElementById('send-gift-btn');
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.innerHTML = `
                    <div class="spinner-small"></div>
                    <span>Inviando...</span>
                `;
            }
            
            // Send gift via Supabase
            if (window.SupabaseMobile) {
                const giftData = {
                    from_user_id: window.MobileApp.currentUser.id,
                    to_user_id: this.targetStreamer,
                    stream_id: this.targetStream,
                    gift_id: this.selectedGift.id,
                    gift_name: this.selectedGift.name,
                    gift_icon: this.selectedGift.icon,
                    gems_cost: this.selectedGift.cost,
                    animation: this.selectedGift.animation
                };
                
                const result = await window.SupabaseMobile.sendGift(giftData);
                
                if (result.success) {
                    // Update user gems
                    this.userGems -= this.selectedGift.cost;
                    if (window.MobileApp) {
                        window.MobileApp.userGems = this.userGems;
                        window.MobileApp.updateGemsDisplay();
                    }
                    
                    // Trigger animation
                    this.triggerGiftAnimation(this.selectedGift);
                    
                    // Show success message
                    window.MobileApp.showNotification(`Regalo "${this.selectedGift.name}" inviato!`, 'success');
                    
                    // Close modal
                    this.hideGiftModal();
                    
                } else {
                    throw new Error(result.error);
                }
            }
            
        } catch (error) {
            console.error('❌ Error sending gift:', error);
            window.MobileApp.showNotification('Errore invio regalo: ' + error.message, 'error');
            
            // Re-enable button
            this.updateSendButton();
        }
    },
    
    // ============= ANIMATIONS =============
    triggerPreviewAnimation: function(element, animationType) {
        element.classList.add(`gift-preview-${animationType}`);
        setTimeout(() => {
            element.classList.remove(`gift-preview-${animationType}`);
        }, 600);
    },
    
    triggerGiftAnimation: function(gift) {
        console.log('🎬 Triggering gift animation:', gift.animation);
        
        // Create flying gift animation
        const flyingGift = document.createElement('div');
        flyingGift.className = 'flying-gift';
        flyingGift.innerHTML = `
            <div class="flying-gift-icon" data-animation="${gift.animation}">
                ${gift.icon}
            </div>
        `;
        
        document.body.appendChild(flyingGift);
        
        // Animate
        setTimeout(() => {
            flyingGift.classList.add('animate');
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            flyingGift.remove();
            this.createParticleEffect(gift);
        }, 2000);
    },
    
    createParticleEffect: function(gift) {
        const particles = ['✨', '💫', '⭐', '🌟', '💖'];
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'gift-particle';
                particle.textContent = particles[Math.floor(Math.random() * particles.length)];
                particle.style.left = Math.random() * 100 + 'vw';
                particle.style.animationDelay = Math.random() * 0.5 + 's';
                
                document.body.appendChild(particle);
                
                setTimeout(() => particle.remove(), 3000);
            }, i * 100);
        }
    },
    
    // ============= BUY GEMS MODAL =============
    showBuyGemsModal: function() {
        console.log('💎 Showing buy gems modal...');
        
        const modalHTML = this.getBuyGemsModalHTML();
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'buy-gems-modal-container';
        modalContainer.className = 'modal-overlay';
        modalContainer.innerHTML = modalHTML;
        
        document.body.appendChild(modalContainer);
        
        // Add event listeners
        this.setupBuyGemsModalListeners();
        
        // Animate in
        setTimeout(() => {
            modalContainer.classList.add('active');
        }, 10);
    },
    
    // ============= BUY GEMS MODAL HTML =============
    getBuyGemsModalHTML: function() {
        return `
            <div class="buy-gems-modal">
                <!-- Header -->
                <div class="buy-gems-header">
                    <h2>💎 Compra Gems</h2>
                    <button class="modal-close-btn" onclick="GiftSystem.hideBuyGemsModal()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Current Balance -->
                <div class="current-balance">
                    <div class="balance-card">
                        <div class="balance-icon">💎</div>
                        <div class="balance-info">
                            <div class="balance-label">Saldo Attuale</div>
                            <div class="balance-amount">${this.userGems} gems</div>
                        </div>
                    </div>
                </div>
                
                <!-- Gem Packages -->
                <div class="gem-packages">
                    ${this.gemPackages.map(pkg => `
                        <div class="gem-package ${pkg.popular ? 'popular' : ''}" 
                             data-package-id="${pkg.id}"
                             onclick="GiftSystem.selectGemPackage('${pkg.id}')">
                            ${pkg.popular ? '<div class="popular-badge">PIÙ POPOLARE</div>' : ''}
                            
                            <div class="package-gems">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFD700">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span class="gems-amount">${pkg.gems.toLocaleString()}</span>
                                ${pkg.bonus ? `<div class="bonus-badge">${pkg.bonus}</div>` : ''}
                            </div>
                            
                            <div class="package-price">€${pkg.price}</div>
                            
                            <button class="buy-package-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                                Acquista
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Payment Methods -->
                <div class="payment-methods">
                    <h3>Metodi di Pagamento</h3>
                    <div class="payment-options">
                        <div class="payment-option">
                            <div class="payment-icon">💳</div>
                            <span>Carta di Credito</span>
                        </div>
                        <div class="payment-option">
                            <div class="payment-icon">📱</div>
                            <span>PayPal</span>
                        </div>
                        <div class="payment-option">
                            <div class="payment-icon">🍎</div>
                            <span>Apple Pay</span>
                        </div>
                        <div class="payment-option">
                            <div class="payment-icon">🤖</div>
                            <span>Google Pay</span>
                        </div>
                    </div>
                </div>
                
                <!-- Security Notice -->
                <div class="security-notice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#4CAF50">
                        <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                    </svg>
                    <span>Pagamenti sicuri e protetti</span>
                </div>
            </div>
        `;
    },
    
    // ============= GEM PACKAGE SELECTION =============
    selectGemPackage: function(packageId) {
        console.log('💎 Selecting gem package:', packageId);
        
        const pkg = this.gemPackages.find(p => p.id === packageId);
        if (!pkg) return;
        
        // Update UI selection
        document.querySelectorAll('.gem-package').forEach(element => {
            element.classList.remove('selected');
            if (element.dataset.packageId === packageId) {
                element.classList.add('selected');
            }
        });
        
        // Show purchase confirmation
        this.showPurchaseConfirmation(pkg);
    },
    
    // ============= PURCHASE CONFIRMATION =============
    showPurchaseConfirmation: function(pkg) {
        const confirmHTML = `
            <div class="purchase-confirmation">
                <div class="confirmation-content">
                    <h3>Conferma Acquisto</h3>
                    <div class="purchase-details">
                        <div class="purchase-item">
                            <span>${pkg.gems.toLocaleString()} gems</span>
                            <span>€${pkg.price}</span>
                        </div>
                        ${pkg.bonus ? `<div class="purchase-bonus">Bonus: ${pkg.bonus}</div>` : ''}
                    </div>
                    <div class="confirmation-buttons">
                        <button class="confirm-btn" onclick="GiftSystem.buyGems('${pkg.id}')">
                            Conferma Acquisto
                        </button>
                        <button class="cancel-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                            Annulla
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const confirmContainer = document.createElement('div');
        confirmContainer.className = 'confirmation-overlay';
        confirmContainer.innerHTML = confirmHTML;
        
        document.body.appendChild(confirmContainer);
        
        setTimeout(() => {
            confirmContainer.classList.add('active');
        }, 10);
    },
    
    // ============= BUY GEMS =============
    buyGems: async function(packageId) {
        console.log('💳 Buying gems package:', packageId);
        
        const pkg = this.gemPackages.find(p => p.id === packageId);
        if (!pkg) return;
        
        try {
            // In a real implementation, this would integrate with Stripe/PayPal
            // For now, we'll simulate the purchase
            
            // Show loading
            window.MobileApp.showNotification('Processando pagamento...', 'info');
            
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Calculate final gems (with bonus)
            let finalGems = pkg.gems;
            if (pkg.bonus) {
                const bonusPercent = parseInt(pkg.bonus.replace(/[^0-9]/g, '')) / 100;
                finalGems = Math.floor(pkg.gems * (1 + bonusPercent));
            }
            
            // Update gems in database
            if (window.SupabaseMobile && window.MobileApp.currentUser) {
                const result = await window.SupabaseMobile.addGems(window.MobileApp.currentUser.id, finalGems);
                
                if (result.success) {
                    // Update local gems
                    this.userGems += finalGems;
                    if (window.MobileApp) {
                        window.MobileApp.userGems = this.userGems;
                        window.MobileApp.updateGemsDisplay();
                    }
                    
                    // Show success
                    window.MobileApp.showNotification(`Acquistato! +${finalGems.toLocaleString()} gems`, 'success');
                    
                    // Close modals
                    this.hideBuyGemsModal();
                    document.querySelectorAll('.confirmation-overlay').forEach(el => el.remove());
                    
                } else {
                    throw new Error(result.error);
                }
            }
            
        } catch (error) {
            console.error('❌ Error buying gems:', error);
            window.MobileApp.showNotification('Errore acquisto: ' + error.message, 'error');
        }
    },
    
    // ============= MODAL MANAGEMENT =============
    hideGiftModal: function() {
        const modal = document.getElementById('gift-modal-container');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    hideBuyGemsModal: function() {
        const modal = document.getElementById('buy-gems-modal-container');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // ============= EVENT LISTENERS =============
    setupEventListeners: function() {
        // Global event listeners for gift system
        document.addEventListener('click', (e) => {
            // Close modals when clicking outside
            if (e.target.classList.contains('modal-overlay')) {
                if (e.target.id === 'gift-modal-container') {
                    this.hideGiftModal();
                } else if (e.target.id === 'buy-gems-modal-container') {
                    this.hideBuyGemsModal();
                }
            }
        });
    },
    
    setupGiftModalListeners: function() {
        // Gift modal specific listeners are handled by onclick attributes
        console.log('🎁 Gift modal listeners setup');
    },
    
    setupBuyGemsModalListeners: function() {
        // Buy gems modal specific listeners are handled by onclick attributes
        console.log('💎 Buy gems modal listeners setup');
    },
    
    // ============= UPDATE SEND BUTTON =============
    updateSendButton: function() {
        const sendBtn = document.getElementById('send-gift-btn');
        if (!sendBtn) return;
        
        if (this.selectedGift) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                <span>Invia ${this.selectedGift.name} (${this.selectedGift.cost} gems)</span>
            `;
        } else {
            sendBtn.disabled = true;
            sendBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                <span>Seleziona un regalo</span>
            `;
        }
    },
    
    // ============= UTILITY FUNCTIONS =============
    updateUserGems: async function(amount) {
        try {
            if (window.SupabaseMobile && window.MobileApp.currentUser) {
                if (amount > 0) {
                    await window.SupabaseMobile.addGems(window.MobileApp.currentUser.id, amount);
                } else {
                    await window.SupabaseMobile.subtractGems(window.MobileApp.currentUser.id, Math.abs(amount));
                }
                
                // Update local state
                this.userGems += amount;
                if (window.MobileApp) {
                    window.MobileApp.userGems = this.userGems;
                    window.MobileApp.updateGemsDisplay();
                }
            }
        } catch (error) {
            console.error('❌ Error updating gems:', error);
        }
    }
};

// ============= AUTO INIT =============
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎁 DOM loaded, initializing Gift System...');
    GiftSystem.init();
});

// Export globally
window.GiftSystem = GiftSystem;

console.log('✅ Gift System Mobile script loaded');