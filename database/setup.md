# 🗄️ DATABASE SETUP - ICCI FREE TIKTOK APP

## 📋 **SETUP COMPLETO DATABASE SUPABASE**

### 🚀 **STEP 1: CREA PROGETTO SUPABASE**

1. Vai su [supabase.com](https://supabase.com)
2. Crea nuovo progetto
3. Scegli nome: `iccifree-tiktok`
4. Scegli password forte
5. Scegli regione: `Europe West (London)`

### 🗄️ **STEP 2: ESEGUI SCHEMA SQL**

1. Vai su **SQL Editor** in Supabase Dashboard
2. Copia e incolla tutto il contenuto di `database/schema.sql`
3. Clicca **Run** per eseguire lo schema
4. Verifica che tutte le tabelle siano create

### ⚙️ **STEP 3: ESEGUI FUNZIONI SQL**

1. Nel **SQL Editor**, copia e incolla tutto il contenuto di `database/functions.sql`
2. Clicca **Run** per eseguire le funzioni
3. Verifica che tutte le funzioni siano create

### 🔐 **STEP 4: CONFIGURA AUTHENTICATION**

1. Vai su **Authentication > Settings**
2. Abilita **Email** provider
3. Configura **Site URL**: `https://andrea-ct46.github.io`
4. Configura **Redirect URLs**:
   - `https://andrea-ct46.github.io/iccifree/`
   - `https://andrea-ct46.github.io/iccifree/auth.html`
   - `https://andrea-ct46.github.io/iccifree/mobile-tiktok.html`

### 🔑 **STEP 5: OTTIENI CREDENZIALI**

1. Vai su **Settings > API**
2. Copia:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 📝 **STEP 6: AGGIORNA CONFIGURAZIONE**

Aggiorna i file con le tue credenziali:

**`js/supabase.js`:**
```javascript
const supabaseUrl = 'https://YOUR-PROJECT.supabase.co';
const supabaseKey = 'YOUR-ANON-KEY';
```

**`js/supabase-mobile.js`:**
```javascript
const supabaseUrl = 'https://YOUR-PROJECT.supabase.co';
const supabaseKey = 'YOUR-ANON-KEY';
```

### 🧪 **STEP 7: TEST DATABASE**

1. Apri `test-mobile.html`
2. Testa tutte le funzionalità
3. Verifica che i dati vengano salvati nel database

### 📊 **STEP 8: VERIFICA TABELLE**

Nel **Table Editor** di Supabase, verifica che esistano:

- ✅ `profiles` - Profili utenti
- ✅ `streams` - Stream live
- ✅ `stream_viewers` - Viewers attivi
- ✅ `likes` - Like sui stream
- ✅ `comments` - Commenti
- ✅ `gifts` - Tipi di regali
- ✅ `gift_transactions` - Transazioni regali
- ✅ `gem_transactions` - Transazioni gems
- ✅ `follows` - Follow tra utenti
- ✅ `notifications` - Notifiche
- ✅ `categories` - Categorie stream
- ✅ `hashtags` - Hashtag trending

### 🔄 **STEP 9: REALTIME SETUP**

1. Vai su **Database > Replication**
2. Abilita **Realtime** per tutte le tabelle
3. Configura **Row Level Security (RLS)**

### 🚀 **STEP 10: DEPLOY**

1. Commit e push del codice
2. Verifica che l'app funzioni con il database
3. Testa tutte le funzionalità

## 🎯 **FUNZIONALITÀ DATABASE COMPLETE**

### 📺 **STREAM MANAGEMENT:**
- ✅ Creazione stream live
- ✅ Lista stream attivi
- ✅ Dettagli stream
- ✅ Chiusura stream

### ❤️ **INTERAZIONI:**
- ✅ Like/Unlike stream
- ✅ Commenti real-time
- ✅ Sistema regali completo
- ✅ Follow/Unfollow utenti

### 👤 **PROFILI:**
- ✅ Creazione profilo utente
- ✅ Aggiornamento profilo
- ✅ Stats utente (followers, following, stream)
- ✅ Sistema gems/regali

### 🔍 **DISCOVERY:**
- ✅ Categorie trending
- ✅ Ricerca stream
- ✅ Hashtag popolari
- ✅ Filtri per categoria

### 🔔 **NOTIFICHE:**
- ✅ Notifiche real-time
- ✅ Mark as read
- ✅ Tipi notifiche (like, comment, gift, follow)

### 📊 **ANALYTICS:**
- ✅ Analytics stream
- ✅ Analytics utente
- ✅ Statistiche real-time

## 🛠️ **TROUBLESHOOTING**

### ❌ **Errori Comuni:**

1. **"Invalid API key"**
   - Verifica che le credenziali siano corrette
   - Controlla che il progetto sia attivo

2. **"Permission denied"**
   - Verifica che RLS sia configurato correttamente
   - Controlla le policies di sicurezza

3. **"Function not found"**
   - Verifica che le funzioni SQL siano state eseguite
   - Controlla che i nomi delle funzioni siano corretti

4. **"Realtime not working"**
   - Verifica che Realtime sia abilitato
   - Controlla le subscription

### 🔧 **Debug:**

1. Apri **Developer Tools > Console**
2. Verifica errori JavaScript
3. Controlla **Network** per chiamate API
4. Verifica **Supabase Dashboard > Logs**

## 📱 **TESTING COMPLETO**

### 🧪 **Test Funzionalità:**

1. **Registrazione/Login** ✅
2. **Creazione Stream** ✅
3. **Like/Commenti** ✅
4. **Sistema Regali** ✅
5. **Follow/Unfollow** ✅
6. **Notifiche** ✅
7. **Discovery** ✅
8. **Profilo Utente** ✅

### 📊 **Test Performance:**

1. **Caricamento Stream** < 2s
2. **Like Response** < 500ms
3. **Commenti Real-time** < 200ms
4. **Regali Animations** < 100ms

## 🎉 **RISULTATO FINALE**

**Database completamente funzionale con:**
- ✅ 12 Tabelle create
- ✅ 20+ Funzioni SQL
- ✅ RLS Security configurata
- ✅ Realtime subscriptions
- ✅ Analytics complete
- ✅ Mobile-optimized queries

**L'app TikTok è ora completamente integrata con Supabase!** 🚀📱