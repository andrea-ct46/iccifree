# 🚀 GUIDA DEPLOY GITHUB PAGES - ICCI FREE

## 📋 SETUP COMPLETO GITHUB

### 1️⃣ **PREPARA IL REPOSITORY** (5 minuti)

#### A. Crea il repository GitHub
1. Vai su [github.com](https://github.com)
2. Clicca **"New repository"**
3. Nome: `iccifree` (o quello che preferisci)
4. Descrizione: "ICCI FREE - Streaming Platform senza censura"
5. ✅ Public (per GitHub Pages gratuito)
6. ✅ Add README
7. Clicca **"Create repository"**

#### B. Carica il progetto
```bash
# Nel tuo progetto locale
git init
git add .
git commit -m "Initial commit - ICCI FREE v2.0"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/iccifree.git
git push -u origin main
```

### 2️⃣ **CONFIGURA GITHUB PAGES** (3 minuti)

#### A. Abilita GitHub Pages
1. Nel tuo repository GitHub
2. Vai su **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `gh-pages` (o `main`)
5. **Folder**: `/ (root)`
6. Clicca **Save**

#### B. Il tuo sito sarà disponibile su:
```
https://TUO_USERNAME.github.io/iccifree
```

### 3️⃣ **AGGIORNA SUPABASE** (2 minuti)

#### A. Configura URL in Supabase
1. Vai nel tuo dashboard Supabase
2. **Authentication** → **URL Configuration**
3. **Site URL**: `https://TUO_USERNAME.github.io/iccifree`
4. **Redirect URLs**: `https://TUO_USERNAME.github.io/iccifree/**`
5. Salva

### 4️⃣ **CONFIGURA IL DOMAIN PERSONALIZZATO** (Opzionale - 10 minuti)

#### A. Registra un dominio
- Esempio: `iccifree.com`
- Costo: ~$10-15/anno

#### B. Configura DNS
Nel tuo registrar di domini, aggiungi:
```
Type: CNAME
Name: www
Value: TUO_USERNAME.github.io
```

#### C. Aggiungi il dominio a GitHub
1. Nel repository → **Settings** → **Pages**
2. **Custom domain**: `iccifree.com`
3. ✅ **Enforce HTTPS**

#### D. Crea file CNAME
```bash
# Nel tuo progetto, crea file CNAME
echo "iccifree.com" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push
```

### 5️⃣ **AUTOMAZIONE DEPLOY** (2 minuti)

Ho creato il file `.github/workflows/deploy.yml` che:
- ✅ Deploy automatico ad ogni push
- ✅ Test automatici
- ✅ Deploy solo dal branch main
- ✅ Supporto per dominio personalizzato

### 6️⃣ **TEST FINALE** (5 minuti)

#### A. Testa il sito
1. Vai su `https://TUO_USERNAME.github.io/iccifree`
2. Testa login
3. Testa streaming
4. Testa sistema regali
5. Testa mobile

#### B. Verifica funzionalità
```javascript
// Nel browser console del sito live
runTests()        // Test completo
testWebRTC()      // Test WebRTC
testPerformance() // Test performance
```

## 🔧 CONFIGURAZIONI SPECIFICHE

### File `_redirects` (per SPA routing)
```
/*    /index.html   200
```

### File `.github/workflows/deploy.yml`
- Deploy automatico
- Test automatici
- Supporto dominio personalizzato

### File `CNAME` (per dominio personalizzato)
```
iccifree.com
```

## 🎯 VANTAGGI GITHUB PAGES

✅ **Gratuito** - Hosting illimitato  
✅ **HTTPS** - SSL automatico  
✅ **CDN** - Distribuzione globale  
✅ **Deploy automatico** - Ad ogni push  
✅ **Dominio personalizzato** - Supportato  
✅ **Version control** - Git integrato  
✅ **Collaborazione** - Team facilmente  

## 🚨 TROUBLESHOOTING

### Il sito non si aggiorna?
```bash
# Forza il deploy
git commit --allow-empty -m "Force deploy"
git push
```

### Errori di routing?
- Verifica che il file `_redirects` sia presente
- Controlla che GitHub Pages sia abilitato

### Supabase non funziona?
- Verifica Site URL in Supabase
- Controlla che sia `https://` e non `http://`

### WebRTC non funziona?
- GitHub Pages serve su HTTPS (richiesto per WebRTC)
- Verifica permessi camera/microfono

## 📊 MONITORING

### GitHub Insights
- **Traffic**: Visite e cloni
- **Contributors**: Collaboratori
- **Commits**: Cronologia modifiche

### Analytics interno
- È già configurato nel codice
- Traccia automaticamente tutte le interazioni

## 🎉 RISULTATO FINALE

**Avrai:**
- ✅ Sito live su GitHub Pages
- ✅ Deploy automatico
- ✅ Dominio personalizzato (opzionale)
- ✅ HTTPS automatico
- ✅ CDN globale
- ✅ Version control completo

## 📞 PROSSIMI PASSI

1. **Testa tutto** in locale prima del deploy
2. **Aggiorna database** Supabase con gli script
3. **Configura GitHub Pages**
4. **Testa il sito live**
5. **Configura dominio personalizzato** (opzionale)

---

## 🚀 PRONTO PER IL LANCIO!

Il tuo progetto ICCI FREE sarà live su GitHub Pages in pochi minuti!

**URL finale**: `https://TUO_USERNAME.github.io/iccifree`

**Buona fortuna! 🔥**
