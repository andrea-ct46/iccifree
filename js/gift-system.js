// ============= GIFT SYSTEM V1.0 - GEMME & REGALI =============
// Sistema di monetizzazione stile TikTok per ICCI FREE

console.log('💎 Gift System loading...');

class GiftSystem {
    constructor() {
        this.userGems = 0;
        this.gifts = this.initGifts();
        this.activeAnimations = [];
    }
    
    // ============= INIT GIFTS CATALOG =============
    initGifts() {
        return [
            // Tier 1 - Economici
            {
                id: 'heart',
                name: '❤️ Cuore',
                cost: 1,
                animation: 'heart',
                tier: 1,
                color: '#ff6b9d'
            },
            {
                id: 'rose',
                name: '🌹 Rosa',
                cost: 5,
                animation: 'rose',
                tier: 1,
                color: '#ff1744'
            },
            {
                id: 'fire',
                name: '🔥 Fuoco',
                cost: 10,
                animation: 'fire',
                tier: 1,
                color: '#ff9800'
            },
            
            // Tier 2 - Medio
            {
                id: 'diamond',
                name: '💎 Diamante',
                cost: 50,
                animation: 'diamond',
                tier: 2,
                color: '#00bcd4'
            },
            {
                id: 'crown',
                name: '👑 Corona',
                cost: 100,
                animation: 'crown',
                tier: 2,
                color: '#ffd700'
            },
            {
                id: 'rocket',
                name: '🚀 Razzo',
                cost: 200,
                animation: 'rocket',
                tier: 2,
                color: '#2196f3'
            },
            
            // Tier 3 - Premium
            {
                id: 'gold_heart',
                name: '💛 Cuore d\'Oro',
                cost: 500,
                animation: 'gold_heart',
                tier: 3,
                color: '#ffd700'
            },
            {
                id: 'rainbow',
                name: '🌈 Arcobaleno',
                cost: 1000,
                animation: 'rainbow',
                tier: 3,
                color: '#ff00ff'
            },
            {
                id: 'galaxy',
                name: '🌌 Galassia',
                cost: 5000,
                animation: 'galaxy',
                tier: 3,
                color: '#9c27b0'
            },
            
            // Tier 4 - Ultra Premium
            {
                id: 'meteor',
                name: '☄️ Meteora',
                cost: 10000,
                animation: 'meteor',
                tier: 4,
                color: '#ff4081'
            }
        ];
    }
    
    // ============= GET USER GEMS BALANCE =============
    async getUserGems(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('user_gems')
                .select('balance')
                .eq('user_id', userId)
                .limit(1);

            if (error) {
                console.error('Error getting gems:', error);
            }

            const row = Array.isArray(data) ? data[0] : null;
            if (!row) {
                await this.createUserGems(userId);
                this.userGems = 0;
                return 0;
            }
            
            this.userGems = row.balance || 0;
            return this.userGems;
        } catch (e) {
            console.error('Error getting gems:', e);
            return 0;
        }
    }
    
    // ============= CREATE USER GEMS ACCOUNT =============
    async createUserGems(userId) {
        const { error } = await supabaseClient
            .from('user_gems')
            .upsert(
                { user_id: userId, balance: 0 },
                { onConflict: 'user_id', ignoreDuplicates: true, returning: 'minimal' }
            );
        if (error) console.error('Error creating gems account:', error);
    }
    
    // ============= SEND GIFT =============
    async sendGift(giftId, streamId, fromUserId, toUserId) {
        const gift = this.gifts.find(g => g.id === giftId);
        if (!gift) {
            throw new Error('Regalo non trovato');
        }
        
        // Check balance
        const balance = await this.getUserGems(fromUserId);
        if (balance < gift.cost) {
            throw new Error('Gemme insufficienti');
        }
        
        try {
            // Deduct gems
            const { error: deductError } = await supabaseClient
                .from('user_gems')
                .update({ 
                    balance: balance - gift.cost 
                })
                .eq('user_id', fromUserId);
            
            if (deductError) throw deductError;
            
            // Add to streamer
            await this.addGemsToUser(toUserId, gift.cost);
            
            // Record transaction
            const { error: txError } = await supabaseClient
                .from('gift_transactions')
                .insert({
                    gift_id: giftId,
                    stream_id: streamId,
                    from_user_id: fromUserId,
                    to_user_id: toUserId,
                    gems_amount: gift.cost
                });
            
            if (txError) throw txError;
            
            // Trigger animation
            this.triggerGiftAnimation(gift, fromUserId);
            
            // Update balance
            this.userGems = balance - gift.cost;
            
            console.log(`💎 Gift sent: ${gift.name} (${gift.cost} gems)`);
            
            return {
                success: true,
                gift: gift,
                newBalance: this.userGems
            };
            
        } catch (error) {
            console.error('Error sending gift:', error);
            throw error;
        }
    }
    
    // ============= ADD GEMS TO USER =============
    async addGemsToUser(userId, amount) {
        const { data } = await supabaseClient
            .from('user_gems')
            .select('balance')
            .eq('user_id', userId)
            .single();
        
        const currentBalance = data?.balance || 0;
        
        await supabaseClient
            .from('user_gems')
            .upsert({ 
                user_id: userId, 
                balance: currentBalance + amount 
            });
    }
    
    // ============= BUY GEMS WITH PAYPAL =============
    async buyGemsPayPal(gemPackage, userId) {
        try {
            // Initialize PayPal
            if (!window.paypal) {
                throw new Error('PayPal SDK non caricato');
            }
            
            const { data: orderId } = await supabaseClient.rpc('create_paypal_order', {
                user_id_param: userId,
                gems_amount: gemPackage.gems,
                price_amount: gemPackage.price
            });
            
            return orderId;
            
        } catch (error) {
            console.error('PayPal error:', error);
            throw error;
        }
    }
    
    // ============= BUY GEMS WITH STRIPE =============
    async buyGemsStripe(gemPackage, userId) {
        try {
            if (!window.Stripe) {
                throw new Error('Stripe SDK non caricato');
            }
            
            const { data } = await supabaseClient.rpc('create_stripe_session', {
                user_id_param: userId,
                gems_amount: gemPackage.gems,
                price_amount: gemPackage.price
            });
            
            const stripe = window.Stripe(STRIPE_PUBLIC_KEY);
            await stripe.redirectToCheckout({ sessionId: data.session_id });
            
        } catch (error) {
            console.error('Stripe error:', error);
            throw error;
        }
    }
    
    // ============= TRIGGER GIFT ANIMATION =============
    triggerGiftAnimation(gift, fromUserId) {
        const container = document.getElementById('gift-animation-container');
        if (!container) return;
        
        const animationElement = document.createElement('div');
        animationElement.className = `gift-animation gift-${gift.animation} tier-${gift.tier}`;
        animationElement.innerHTML = `
            <div class="gift-icon">${gift.name.split(' ')[0]}</div>
            <div class="gift-text">
                <div class="gift-name">${gift.name}</div>
                <div class="gift-cost">${gift.cost} gemme</div>
            </div>
        `;
        
        container.appendChild(animationElement);
        
        // Animate
        setTimeout(() => {
            animationElement.classList.add('animate-in');
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            animationElement.classList.add('animate-out');
            setTimeout(() => {
                animationElement.remove();
            }, 500);
        }, 3000);
        
        // Sound effect
        this.playGiftSound(gift.tier);
        
        // Particle effects
        if (gift.tier >= 3) {
            this.createParticleEffect(gift);
        }
    }
    
    // ============= CREATE PARTICLE EFFECT =============
    createParticleEffect(gift) {
        const container = document.getElementById('gift-animation-container');
        const particleCount = gift.tier * 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'gift-particle';
            particle.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: 10px;
                height: 10px;
                background: ${gift.color};
                border-radius: 50%;
                pointer-events: none;
                animation: particle-explosion ${0.5 + Math.random()}s ease-out forwards;
                transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
            `;
            
            container.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    // ============= PLAY GIFT SOUND =============
    playGiftSound(tier) {
        const audio = new Audio();
        
        switch(tier) {
            case 1:
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe57OinURQOT6fn8LdjHAU7k9f0ynUsRSh5yO7ekEAJFF+16+upVRQKRJ/k8r5uIAUs';
                break;
            case 2:
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe57OinURQOT6fn8LdjHAU7k9f0ynUsRSh5yO7ekEAJFF+16+upVRQKRJ/k8r5uIAUs';
                break;
            case 3:
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe57OinURQOT6fn8LdjHAU7k9f0ynUsRSh5yO7ekEAJFF+16+upVRQKRJ/k8r5uIAUs';
                break;
            default:
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe57OinURQOT6fn8LdjHAU7k9f0ynUsRSh5yO7ekEAJFF+16+upVRQKRJ/k8r5uIAUs';
        }
        
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore autoplay errors
    }
    
    // ============= GET GEM PACKAGES =============
    getGemPackages() {
        return [
            {
                id: 'pack_small',
                gems: 100,
                price: 0.99,
                bonus: 0,
                popular: false
            },
            {
                id: 'pack_medium',
                gems: 500,
                price: 4.99,
                bonus: 50,
                popular: false
            },
            {
                id: 'pack_large',
                gems: 1200,
                price: 9.99,
                bonus: 200,
                popular: true
            },
            {
                id: 'pack_mega',
                gems: 2500,
                price: 19.99,
                bonus: 500,
                popular: false
            },
            {
                id: 'pack_ultra',
                gems: 6500,
                price: 49.99,
                bonus: 1500,
                popular: false
            },
            {
                id: 'pack_ultimate',
                gems: 15000,
                price: 99.99,
                bonus: 5000,
                popular: false
            }
        ];
    }
    
    // ============= SHOW BUY GEMS MODAL =============
    showBuyGemsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'buy-gems-modal';
        
        const packages = this.getGemPackages();
        
        modal.innerHTML = `
            <div class="modal-content buy-gems-modal">
                <button class="modal-close" onclick="document.getElementById('buy-gems-modal').remove()">×</button>
                
                <h2>💎 Compra Gemme</h2>
                <p class="gems-subtitle">Supporta i tuoi streamer preferiti!</p>
                
                <div class="gems-balance">
                    <span>Il tuo saldo:</span>
                    <span class="gems-amount">${this.userGems} 💎</span>
                </div>
                
                <div class="gems-packages">
                    ${packages.map(pkg => `
                        <div class="gem-package ${pkg.popular ? 'popular' : ''}" data-package-id="${pkg.id}">
                            ${pkg.popular ? '<div class="popular-badge">PIÙ POPOLARE</div>' : ''}
                            <div class="package-gems">${pkg.gems + pkg.bonus} 💎</div>
                            ${pkg.bonus > 0 ? `<div class="package-bonus">+${pkg.bonus} bonus</div>` : ''}
                            <div class="package-price">€${pkg.price.toFixed(2)}</div>
                            <button class="package-buy-btn" onclick="giftSystem.buyGems('${pkg.id}')">
                                Acquista
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <div class="payment-methods">
                    <h3>Metodi di pagamento</h3>
                    <div class="payment-buttons">
                        <button class="payment-method paypal">
                            <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal">
                            PayPal
                        </button>
                        <button class="payment-method stripe">
                            <svg width="40" height="17" viewBox="0 0 60 25" fill="currentColor">
                                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z"></path>
                            </svg>
                            Carta
                        </button>
                    </div>
                </div>
                
                <div class="gems-disclaimer">
                    <p>💡 Le gemme vengono convertite 1:1 in crediti per lo streamer</p>
                    <p>🔒 Pagamenti sicuri tramite PayPal e Stripe</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // ============= SHOW SEND GIFT MODAL =============
    showSendGiftModal(streamId, streamerId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'send-gift-modal';
        
        modal.innerHTML = `
            <div class="modal-content send-gift-modal">
                <button class="modal-close" onclick="document.getElementById('send-gift-modal').remove()">×</button>
                
                <h2>🎁 Invia Regalo</h2>
                
                <div class="gems-balance-header">
                    <span>Il tuo saldo:</span>
                    <span class="gems-amount">${this.userGems} 💎</span>
                    <button class="buy-more-btn" onclick="giftSystem.showBuyGemsModal()">+</button>
                </div>
                
                <div class="gifts-grid">
                    ${this.gifts.map(gift => `
                        <div class="gift-item tier-${gift.tier}" data-gift-id="${gift.id}">
                            <div class="gift-icon-large">${gift.name.split(' ')[0]}</div>
                            <div class="gift-name">${gift.name.split(' ').slice(1).join(' ')}</div>
                            <div class="gift-cost">${gift.cost} 💎</div>
                            <button class="send-gift-btn" 
                                onclick="giftSystem.sendGiftFromModal('${gift.id}', '${streamId}', '${streamerId}')"
                                ${this.userGems < gift.cost ? 'disabled' : ''}>
                                ${this.userGems < gift.cost ? 'Gemme insufficienti' : 'Invia'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // ============= SEND GIFT FROM MODAL =============
    async sendGiftFromModal(giftId, streamId, streamerId) {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            alert('Devi essere loggato per inviare regali');
            return;
        }
        
        try {
            const result = await this.sendGift(giftId, streamId, currentUser.id, streamerId);
            
            // Update UI
            document.querySelectorAll('.gems-amount').forEach(el => {
                el.textContent = `${result.newBalance} 💎`;
            });
            
            // Close modal
            document.getElementById('send-gift-modal')?.remove();
            
            // Show success
            showNotification(`Regalo inviato! 🎁`, 'success');
            
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }
    
    // ============= BUY GEMS =============
    async buyGems(packageId) {
        const pkg = this.getGemPackages().find(p => p.id === packageId);
        if (!pkg) return;
        
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            alert('Devi essere loggato');
            return;
        }
        
        // Show payment method selection
        const paymentModal = document.createElement('div');
        paymentModal.className = 'modal-overlay';
        paymentModal.innerHTML = `
            <div class="modal-content payment-modal">
                <h3>Scegli metodo di pagamento</h3>
                <p>Pacchetto: ${pkg.gems + pkg.bonus} gemme - €${pkg.price}</p>
                
                <button onclick="giftSystem.processPayPalPayment('${packageId}', '${currentUser.id}')" class="payment-btn paypal-btn">
                    <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg">
                    Paga con PayPal
                </button>
                
                <button onclick="giftSystem.processStripePayment('${packageId}', '${currentUser.id}')" class="payment-btn stripe-btn">
                    💳 Paga con Carta
                </button>
                
                <button onclick="this.parentElement.parentElement.remove()" class="cancel-btn">Annulla</button>
            </div>
        `;
        
        document.body.appendChild(paymentModal);
    }
    
    // ============= PROCESS PAYPAL PAYMENT =============
    async processPayPalPayment(packageId, userId) {
        const pkg = this.getGemPackages().find(p => p.id === packageId);
        try {
            await this.buyGemsPayPal(pkg, userId);
            showNotification('Pagamento in corso...', 'info');
        } catch (e) {
            showNotification('Errore PayPal: ' + e.message, 'error');
        }
    }
    
    // ============= PROCESS STRIPE PAYMENT =============
    async processStripePayment(packageId, userId) {
        const pkg = this.getGemPackages().find(p => p.id === packageId);
        try {
            await this.buyGemsStripe(pkg, userId);
        } catch (e) {
            showNotification('Errore pagamento: ' + e.message, 'error');
        }
    }
}

// ============= INIT GIFT SYSTEM =============
const giftSystem = new GiftSystem();
window.giftSystem = giftSystem;

// ============= LOAD USER GEMS ON AUTH =============
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        const user = await getCurrentUser();
        if (user) {
            await giftSystem.getUserGems(user.id);
        }
    });
} else {
    (async () => {
        const user = await getCurrentUser();
        if (user) {
            await giftSystem.getUserGems(user.id);
        }
    })();
}

console.log('✅ Gift System loaded');
