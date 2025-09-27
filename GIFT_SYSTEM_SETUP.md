# 💎 GIFT SYSTEM - Guida Setup

## 🎁 Sistema di Regali e Gemme - Stile TikTok

Il sistema di regali permette agli utenti di supportare i loro streamer preferiti con regali virtuali pagati con gemme.

---

## 📋 Indice

1. [Setup Database](#setup-database)
2. [Configurazione PayPal](#configurazione-paypal)
3. [Configurazione Stripe](#configurazione-stripe)
4. [Integrazione nell'App](#integrazione-nellapp)
5. [Come Funziona](#come-funziona)
6. [Personalizzazione](#personalizzazione)

---

## 🗄️ Setup Database

### 1. Esegui lo script SQL

Vai nel tuo Supabase Dashboard → SQL Editor e esegui:

```bash
database/gift-system-schema.sql
```

Questo creerà:
- ✅ Tabelle (user_gems, gift_transactions, gem_purchases, gem_withdrawals)
- ✅ Funzioni RPC (7 funzioni)
- ✅ Policies RLS (sicurezza)
- ✅ Views (statistiche)
- ✅ Triggers (timestamp automatici)

### 2. Verifica

```sql
-- Verifica che le tabelle siano create
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%gem%';

-- Dovrebbe mostrare:
-- user_gems
-- gift_transactions
-- gem_purchases
-- gem_withdrawals
```

---

## 💳 Configurazione PayPal

### 1. Crea Account Business PayPal

1. Vai su [PayPal Developer](https://developer.paypal.com)
2. Login con il tuo account PayPal
3. Vai in Dashboard → My Apps & Credentials

### 2. Ottieni le Credenziali

**Sandbox (Test):**
```javascript
const PAYPAL_CLIENT_ID = "YOUR_SANDBOX_CLIENT_ID";
const PAYPAL_MODE = "sandbox";
```

**Production:**
```javascript
const PAYPAL_CLIENT_ID = "YOUR_LIVE_CLIENT_ID";
const PAYPAL_MODE = "live";
```

### 3. Aggiungi SDK PayPal

In `golive.html` e pagine dove serve:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=EUR"></script>
```

### 4. Configura Webhook (per conferme pagamento)

1. Dashboard PayPal → Webhooks
2. Crea nuovo webhook: `https://your-app.com/api/paypal-webhook`
3. Eventi da ascoltare:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`

---

## 💳 Configurazione Stripe

### 1. Crea Account Stripe

1. Vai su [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Completa registrazione
3. Attiva il tuo account

### 2. Ottieni le API Keys

In Dashboard → Developers → API Keys:

**Test Mode:**
```javascript
const STRIPE_PUBLIC_KEY = "pk_test_...";
const STRIPE_SECRET_KEY = "sk_test_..."; // Solo backend!
```

**Live Mode:**
```javascript
const STRIPE_PUBLIC_KEY = "pk_live_...";
const STRIPE_SECRET_KEY = "sk_live_...";
```

### 3. Aggiungi Stripe.js

```html
<script src="https://js.stripe.com/v3/"></script>
```

### 4. Crea Prodotti Stripe

Dashboard → Products → Add Product:

```javascript
// Esempio pacchetti
{
  "pack_small": {
    "name": "100 Gemme",
    "price": 0.99,
    "price_id": "price_xxx"
  },
  "pack_medium": {
    "name": "500 Gemme + 50 Bonus",
    "price": 4.99,
    "price_id": "price_yyy"
  }
}
```

---

## 🔗 Integrazione nell'App

### 1. Aggiungi File JS

In `index.html`, `dashboard.html`, `golive.html`:

```html
<!-- Gift System -->
<script src="js/gift-system.js"></script>
<link rel="stylesheet" href="css/gift-system.css">
```

### 2. Aggiungi Container Animazioni

In ogni pagina dove vuoi animazioni:

```html
<!-- Gift Animation Container -->
<div id="gift-animation-container"></div>
```

### 3. Aggiungi Bottone Regalo (per streamers)

Nella pagina stream:

```html
<!-- Gift Button -->
<button class="gift-button" 
        onclick="giftSystem.showSendGiftModal('STREAM_ID', 'STREAMER_ID')">
    🎁
</button>
```

### 4. Mostra Saldo Gemme (per users)

Nel header/navbar:

```html
<div class="gems-display" onclick="giftSystem.showBuyGemsModal()">
    <span id="user-gems-balance">0</span> 💎
</div>
```

### 5. Inizializza

```javascript
// Carica saldo gemme utente
document.addEventListener('DOMContentLoaded', async () => {
    const user = await getCurrentUser();
    if (user) {
        const gems = await giftSystem.getUserGems(user.id);
        document.getElementById('user-gems-balance').textContent = gems;
    }
});
```

---

## 🎮 Come Funziona

### Flow Utente

#### 1️⃣ Comprare Gemme

```javascript
// Utente clicca "Compra Gemme"
giftSystem.showBuyGemsModal();

// Sceglie pacchetto e metodo pagamento
// PayPal o Stripe

// Dopo pagamento completato:
// - Gemme aggiunte al saldo
// - Transaction registrata in DB
```

#### 2️⃣ Inviare Regalo

```javascript
// Durante uno stream, utente clicca bottone regalo
giftSystem.showSendGiftModal(streamId, streamerId);

// Sceglie regalo
giftSystem.sendGift(giftId, streamId, fromUserId, toUserId);

// Sistema:
// - Verifica saldo gemme
// - Deduce gemme da mittente
// - Aggiunge gemme a destinatario
// - Mostra animazione
// - Registra transaction
```

#### 3️⃣ Ritirare Soldi (Streamer)

```javascript
// Streamer va in dashboard
// Vede saldo gemme guadagnate
// Richiede prelievo

// Backend:
// - Converte gemme in EUR (1 gemma = €0.01)
// - Crea withdrawal request
// - Admin approva
// - Invia pagamento
```

### Conversione

```
1 Gemma = €0.01
100 Gemme = €1.00
1000 Gemme = €10.00
```

---

## 🎨 Personalizzazione

### Aggiungere Nuovi Regali

In `js/gift-system.js`, nel metodo `initGifts()`:

```javascript
{
    id: 'new_gift',
    name: '🌟 Nuovo Regalo',
    cost: 100,
    animation: 'sparkle',
    tier: 2,
    color: '#ff00ff'
}
```

### Creare Nuova Animazione

In `css/gift-system.css`:

```css
.gift-animation.gift-sparkle {
    /* Stili custom */
}

@keyframes sparkle-animation {
    /* Animazione custom */
}
```

### Modificare Pacchetti Gemme

In `js/gift-system.js`, metodo `getGemPackages()`:

```javascript
{
    id: 'pack_custom',
    gems: 2000,
    price: 15.99,
    bonus: 300,
    popular: true
}
```

---

## 🧪 Testing

### Test in Sandbox

1. **PayPal Sandbox:**
   - Usa account test PayPal
   - Carte test: vedi [PayPal Test Cards](https://developer.paypal.com/tools/sandbox/card-testing/)

2. **Stripe Test:**
   - Carta test: `4242 4242 4242 4242`
   - Qualsiasi CVV e data futura
   - Vedi [Stripe Test Cards](https://stripe.com/docs/testing)

### Test Flow Completo

```javascript
// 1. Compra gemme
await giftSystem.buyGemsPayPal(package, userId);

// 2. Verifica saldo
const gems = await giftSystem.getUserGems(userId);
console.log('Gemme:', gems);

// 3. Invia regalo
await giftSystem.sendGift('heart', streamId, fromUserId, toUserId);

// 4. Verifica transaction
const stats = await supabaseClient.rpc('get_user_gift_stats', {
    user_id_param: userId
});
console.log('Stats:', stats);
```

---

## 🔒 Security Checklist

- [ ] ✅ RLS Policies attive su tutte le tabelle
- [ ] ✅ Validazione saldo gemme server-side
- [ ] ✅ Webhook signature verification (PayPal/Stripe)
- [ ] ✅ Rate limiting su API gemme
- [ ] ✅ Logging di tutte le transazioni
- [ ] ✅ Monitoring anomalie (es. troppe gemme comprate)
- [ ] ✅ API keys in env variables (mai in codice)

---

## 📊 Monitoring & Analytics

### Query Utili

```sql
-- Top spenders (ultimi 30 giorni)
SELECT 
    u.username,
    SUM(gt.gems_amount) as total_spent
FROM gift_transactions gt
JOIN users u ON u.id = gt.from_user_id
WHERE gt.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.username
ORDER BY total_spent DESC
LIMIT 10;

-- Revenue giornaliero
SELECT 
    DATE(created_at) as date,
    SUM(price_amount) as revenue,
    COUNT(*) as purchases
FROM gem_purchases
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Regali più popolari
SELECT 
    gift_id,
    COUNT(*) as count,
    SUM(gems_amount) as total_gems
FROM gift_transactions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY gift_id
ORDER BY count DESC;
```

### Dashboard Metrics

Crea dashboard con:
- 💰 Revenue totale
- 💎 Gemme vendute
- 🎁 Regali inviati
- 👥 Utenti attivi
- 📈 Trend giornaliero

---

## 🐛 Troubleshooting

### Problema: PayPal non carica

**Soluzione:**
```javascript
// Verifica che SDK sia caricato
if (!window.paypal) {
    console.error('PayPal SDK non caricato!');
    // Ricarica script
}
```

### Problema: Gemme non aggiunte dopo pagamento

**Soluzione:**
```javascript
// Verifica webhook ricevuto
// Check payment_id in gem_purchases
// Manualmente completa purchase se necessario
await supabaseClient.rpc('complete_gem_purchase', {
    purchase_id_param: 'xxx',
    payment_id_param: 'paypal_xxx'
});
```

### Problema: Animazione non appare

**Soluzione:**
```javascript
// Verifica container esiste
const container = document.getElementById('gift-animation-container');
if (!container) {
    console.error('Gift container mancante!');
}

// Verifica CSS caricato
```

---

## 📞 Support

Per aiuto:
- 📧 Email: support@iccifree.com
- 💬 Discord: [Join Server]
- 📚 Docs completi: [API.md](API.md)

---

## ✅ Checklist Finale

Prima del lancio:

- [ ] Database schema eseguito
- [ ] PayPal configurato (live keys)
- [ ] Stripe configurato (live keys)
- [ ] Webhook configurati e testati
- [ ] Gift system integrato in tutte le pagine
- [ ] Test acquisto gemme (sandbox)
- [ ] Test invio regali
- [ ] Animazioni funzionanti
- [ ] Withdrawal system testato
- [ ] Monitoring configurato
- [ ] Security audit completato

---

<div align="center">

## 🎉 Sistema Regalo Pronto!

**Inizia a guadagnare con ICCI FREE** 💎

</div>
