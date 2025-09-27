# 🗄️ DATABASE - SPIEGAZIONE SEMPLICE

## 🎯 COSA DEVI FARE (5 minuti)

### 1️⃣ **APRI SUPABASE**
1. Vai su [supabase.com](https://supabase.com)
2. Fai login con il tuo account
3. Clicca sul tuo progetto esistente

### 2️⃣ **VAI NEL SQL EDITOR**
1. Nel menu laterale, clicca **"SQL Editor"**
2. Clicca **"New query"** (pulsante verde in alto)

### 3️⃣ **COPIA E INCOLLA QUESTO CODICE**
Copia tutto il testo qui sotto e incollalo nel SQL Editor:

```sql
-- ============================================
-- AGGIORNAMENTO SEMPLICE DATABASE ICCI FREE
-- ============================================

-- 1. Aggiungi tabelle mancanti
CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_live BOOLEAN DEFAULT false,
    viewer_count INT DEFAULT 0,
    offer TEXT,
    answer TEXT,
    ice_candidates TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Aggiungi sistema regali
CREATE TABLE IF NOT EXISTS user_gems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    balance BIGINT DEFAULT 0,
    lifetime_earned BIGINT DEFAULT 0,
    lifetime_spent BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS gift_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_id TEXT NOT NULL,
    stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
    from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    gems_amount BIGINT NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Aggiungi funzioni utili
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION transfer_gems(
    from_user_id_param UUID,
    to_user_id_param UUID,
    gems_amount_param BIGINT,
    gift_id_param TEXT,
    stream_id_param UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_balance BIGINT;
    transaction_id UUID;
BEGIN
    -- Controlla se ha abbastanza gemme
    SELECT balance INTO current_balance
    FROM user_gems
    WHERE user_id = from_user_id_param;
    
    IF current_balance IS NULL OR current_balance < gems_amount_param THEN
        RETURN jsonb_build_object('success', false, 'error', 'Gemme insufficienti');
    END IF;
    
    -- Togli gemme dal mittente
    UPDATE user_gems
    SET balance = balance - gems_amount_param,
        lifetime_spent = lifetime_spent + gems_amount_param
    WHERE user_id = from_user_id_param;
    
    -- Aggiungi gemme al ricevente
    INSERT INTO user_gems (user_id, balance, lifetime_earned)
    VALUES (to_user_id_param, gems_amount_param, gems_amount_param)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = user_gems.balance + gems_amount_param,
        lifetime_earned = user_gems.lifetime_earned + gems_amount_param;
    
    -- Registra la transazione
    INSERT INTO gift_transactions (
        gift_id, stream_id, from_user_id, to_user_id, gems_amount
    ) VALUES (
        gift_id_param, stream_id_param, from_user_id_param, to_user_id_param, gems_amount_param
    ) RETURNING id INTO transaction_id;
    
    RETURN jsonb_build_object('success', true, 'transaction_id', transaction_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attiva sicurezza
ALTER TABLE user_gems ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Regole di sicurezza
CREATE POLICY "Users can view own gems" ON user_gems
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their gifts" ON gift_transactions
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send gifts" ON gift_transactions
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- 6. Permessi
GRANT EXECUTE ON FUNCTION add_ice_candidate TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_gems TO authenticated;
```

### 4️⃣ **ESEGUI LO SCRIPT**
1. Incolla tutto il codice sopra nel SQL Editor
2. Clicca **"Run"** (pulsante verde in basso a destra)
3. Aspetta che finisca (dovrebbe dire "Success" in verde)

### 5️⃣ **VERIFICA CHE FUNZIONI**
1. Nel menu laterale, clicca **"Table Editor"**
2. Dovresti vedere le nuove tabelle:
   - ✅ `streams`
   - ✅ `messages` 
   - ✅ `user_gems`
   - ✅ `gift_transactions`

## 🎉 **FATTO!**

Il tuo database è ora aggiornato con:
- ✅ **Tabelle streaming** (streams, messages)
- ✅ **Sistema regali** (user_gems, gift_transactions)
- ✅ **Funzioni utili** (per WebRTC e regali)
- ✅ **Sicurezza** (ogni utente vede solo i suoi dati)

## 🚨 **SE CI SONO ERRORI**

### Errore "profiles table doesn't exist"?
```sql
-- Esegui questo PRIMA dello script principale
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Errore di permessi?
- Assicurati di essere loggato come admin del progetto
- Controlla che il progetto Supabase sia attivo

## 📊 **COSA SIGNIFICA OGNI TABELLA**

### `streams` - Gli stream live
- `title` - Titolo dello stream
- `is_live` - Se è in diretta o no
- `viewer_count` - Quante persone stanno guardando
- `offer/answer` - Dati WebRTC per la connessione

### `messages` - Chat degli stream
- `content` - Il messaggio scritto
- `stream_id` - A quale stream appartiene
- `user_id` - Chi ha scritto il messaggio

### `user_gems` - Gemme degli utenti
- `balance` - Quante gemme ha ora
- `lifetime_earned` - Quante ne ha guadagnate in totale
- `lifetime_spent` - Quante ne ha spese in totale

### `gift_transactions` - Regali inviati
- `from_user_id` - Chi ha mandato il regalo
- `to_user_id` - Chi ha ricevuto il regalo
- `gems_amount` - Quante gemme
- `gift_id` - Che tipo di regalo (es. "heart", "star")

## 🎯 **PROSSIMO PASSO**

Una volta che il database è aggiornato, puoi:
1. ✅ Testare l'app in locale
2. ✅ Fare il deploy su GitHub
3. ✅ Aggiornare le URL in Supabase

**Il database è la parte più importante - una volta fatto questo, tutto il resto è facile! 🚀**
