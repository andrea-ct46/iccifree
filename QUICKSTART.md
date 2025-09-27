# 🚀 ICCI FREE - QUICK START GUIDE

> **Get your streaming platform running in 5 minutes!**

## ⚡ Fast Track Setup

### 1️⃣ Clone & Open (30 seconds)

```bash
# Clone repository
git clone https://github.com/yourusername/iccifree.git
cd iccifree-complete

# Open in VS Code
code .
```

### 2️⃣ Configure Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. Open `js/supabase.js` and update:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

4. In Supabase, run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create streams table
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  is_live BOOLEAN DEFAULT false,
  offer TEXT,
  answer TEXT,
  ice_candidates TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create RPC function
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
$$ LANGUAGE plpgsql;
```

### 3️⃣ Start Server (30 seconds)

Pick one method:

```bash
# Method 1: Python (if installed)
python -m http.server 8000

# Method 2: Node.js
npx serve

# Method 3: VS Code Live Server
# Click "Go Live" button in bottom-right
```

### 4️⃣ Open Browser (10 seconds)

```
http://localhost:8000
```

### 5️⃣ Test (1 minute)

1. Click "Login" → Use test email
2. Go to Dashboard
3. Click "Go Live"
4. Allow camera/mic
5. Start streaming! 🎉

---

## 🎯 What You Get

- ✅ **WebRTC P2P Streaming** - Low latency (<1s)
- ✅ **Real-time Chat** - Live messaging
- ✅ **User Auth** - Google OAuth ready
- ✅ **Responsive Design** - Works on all devices
- ✅ **PWA** - Installable app
- ✅ **Offline Support** - Works without internet

---

## 🔧 Quick Commands

### Development
```bash
npm start              # Start dev server
npm run lighthouse     # Check performance
npm run test          # Run tests
```

### Testing
```javascript
// In browser console
runTests()            // Run all tests
testWebRTC()          // Test WebRTC only
testReport()          // Get detailed report
```

### Deployment
```bash
npm run deploy:netlify    # Deploy to Netlify
npm run deploy:vercel     # Deploy to Vercel
```

---

## 🐛 Troubleshooting

### WebRTC Not Connecting?
1. Allow camera/mic permissions
2. Try different browser (Chrome recommended)
3. Check console for errors
4. Test with `testWebRTC()`

### Auth Not Working?
1. Verify Supabase credentials
2. Check browser console
3. Clear cache and cookies
4. Try incognito mode

### Slow Performance?
1. Run `testPerformance()`
2. Check network with `testNetwork()`
3. Enable lazy loading
4. Optimize images

---

## 📚 Next Steps

1. **Customize Design**: Edit `css/style.css`
2. **Add OAuth**: Configure Google/Discord in Supabase
3. **Deploy**: Use Netlify/Vercel one-click deploy
4. **Monitor**: Setup analytics and error tracking

---

## 🔗 Important Links

- 📖 [Full Documentation](README.md)
- 🚀 [Deployment Guide](DEPLOYMENT_CHECKLIST.md)
- 🤝 [Contributing](CONTRIBUTING.md)
- 🔒 [Security](SECURITY.md)
- 📝 [Changelog](CHANGELOG.md)

---

## 💡 Pro Tips

1. **Use Chrome DevTools** for debugging WebRTC
2. **Test on mobile** early and often
3. **Monitor performance** with Lighthouse
4. **Check security** with `npm audit`
5. **Read the docs** - they're comprehensive!

---

## 🎉 You're Ready!

Your streaming platform is set up! Now:

1. ✅ Customize it
2. ✅ Add features
3. ✅ Test thoroughly
4. ✅ Deploy to production
5. ✅ Start streaming! 🔥

---

<div align="center">
  <strong>Happy Streaming! 🚀</strong>
  <br>
  <sub>Built with 🔥 by ICCI FREE Team</sub>
</div>
