// supabaseClient.js

// 1️⃣ Configurazione Supabase
const supabaseUrl = "https://TUO-PROGETTO.supabase.co"; // sostituisci con il tuo URL
const supabaseKey = "TUO-ANON-KEY";                     // sostituisci con la tua chiave anon
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 2️⃣ Funzione per controllare l'utente loggato
async function checkUser() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return data.session?.user || null;
    } catch (err) {
        console.error("Errore checkUser:", err.message);
        return null;
    }
}

// 3️⃣ Funzione per ottenere il profilo dell’utente
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Errore getUserProfile:", err.message);
        return null;
    }
}
