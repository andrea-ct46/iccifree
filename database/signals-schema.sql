-- ============================================
-- ICCI FREE - WebRTC Signaling Table
-- ============================================
-- Esegui questo script nello SQL Editor di Supabase

-- Estensione UUID (se non già attiva)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabella signals per WebRTC (offer/answer/ice)
CREATE TABLE IF NOT EXISTS public.signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('offer','answer','ice')),
    payload JSONB NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('broadcaster','viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Policy: lettura aperta (puoi restringere in seguito)
CREATE POLICY IF NOT EXISTS "Signals are viewable by everyone"
ON public.signals FOR SELECT USING (true);

-- Policy: insert consentito agli utenti autenticati
CREATE POLICY IF NOT EXISTS "Authenticated can insert signals"
ON public.signals FOR INSERT TO authenticated
WITH CHECK (true);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_signals_stream_id_created_at
ON public.signals(stream_id, created_at DESC);

-- Messaggio finale
DO $$
BEGIN
  RAISE NOTICE '✅ Tabella public.signals creata con policies.';
END $$;

