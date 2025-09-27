# ❓ ICCI FREE - FAQ (Frequently Asked Questions)

## 📋 Table of Contents

- [General](#general)
- [Technical](#technical)
- [Streaming](#streaming)
- [Account & Privacy](#account--privacy)
- [Monetization](#monetization)
- [Troubleshooting](#troubleshooting)

---

## 🌟 General

### What is ICCI FREE?

ICCI FREE is a **WebRTC-based live streaming platform** that allows you to broadcast and watch streams with **ultra-low latency** (<1 second) without censorship. It's built with privacy and freedom of expression as core values.

### Is ICCI FREE really free?

**Yes, 100% free!** There are no hidden costs, no premium tiers, and no subscription fees. You can stream and watch unlimited content forever.

### How is it different from Twitch/YouTube?

| Feature | ICCI FREE | Twitch | YouTube Live |
|---------|-----------|--------|--------------|
| **Latency** | <1s (WebRTC) | 2-8s | 10-30s |
| **Censorship** | None | Heavy | Heavy |
| **Cost** | Free | Free* | Free* |
| **P2P** | Yes | No | No |
| **Privacy** | High | Low | Low |

*Twitch/YouTube take 50% of revenue

### What devices are supported?

- ✅ **Desktop**: Windows, macOS, Linux
- ✅ **Mobile**: iOS, Android (PWA)
- ✅ **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Do I need to download anything?

**No!** ICCI FREE works entirely in your browser. However, you can install it as a PWA (Progressive Web App) for a native app experience.

---

## 🔧 Technical

### What is WebRTC?

**WebRTC** (Web Real-Time Communication) is a technology that enables peer-to-peer audio, video, and data sharing directly between browsers without a server in the middle. This results in:
- Ultra-low latency (<1 second)
- Better quality
- Lower costs
- More privacy

### What are the system requirements?

**Minimum:**
- Modern browser (see supported browsers)
- 2 Mbps upload speed (for streaming)
- 1 Mbps download speed (for viewing)
- Webcam & microphone (for streaming)

**Recommended:**
- 5+ Mbps upload speed
- 3+ Mbps download speed
- HD webcam (1080p)
- Good microphone

### Does ICCI FREE work on mobile?

**Yes!** ICCI FREE is fully responsive and works great on mobile devices. You can:
- ✅ Watch streams
- ✅ Chat in real-time
- ✅ Follow streamers
- ✅ Stream from mobile (limited by device capabilities)

### Can I use it offline?

The PWA version has **offline support** for basic features:
- ✅ View cached content
- ✅ Access your profile
- ✅ See offline page
- ❌ Cannot stream or watch live (requires internet)

### What technology stack is used?

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Streaming**: WebRTC API
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (OAuth 2.0)
- **Storage**: Supabase Storage (S3-compatible)
- **Hosting**: Static (Netlify/Vercel)
- **CDN**: Cloudflare

---

## 🎥 Streaming

### How do I start streaming?

1. **Login** to your account
2. Go to **Dashboard**
3. Click **"Go Live"**
4. Set your **title** and **description**
5. Allow **camera & microphone** access
6. Click **"Start Streaming"**
7. Share your stream link! 🎉

### What's the maximum stream duration?

Currently, there's **no hard limit** on stream duration. However, we recommend:
- Regular streams: Up to 8 hours
- Marathon streams: Up to 24 hours
- Plan breaks every few hours

### Can I stream without a webcam?

**Not at the moment.** WebRTC requires at least one media track (video or audio). Future versions will support:
- Audio-only streams
- Screen sharing
- Pre-recorded content

### How many viewers can I have?

**P2P limitations**: Since ICCI FREE uses P2P technology, there are practical limits:
- **Optimal**: 1-50 viewers
- **Good**: 50-100 viewers
- **Limited**: 100+ viewers (may need relay servers)

For large audiences (1000+), we recommend:
- Using our upcoming **CDN mode** (v2.1)
- Implementing **viewer relays**
- Upgrading to **Enterprise plan**

### Can I save my streams (VOD)?

**Not yet**, but it's coming in **v2.1**! You'll be able to:
- Record streams automatically
- Download recordings
- Share VODs
- Create clips

### What bitrate should I use?

**Recommended bitrates:**

| Quality | Resolution | Bitrate | Upload Speed |
|---------|------------|---------|--------------|
| Low | 480p | 1 Mbps | 2 Mbps |
| Medium | 720p | 2.5 Mbps | 4 Mbps |
| High | 1080p | 5 Mbps | 7 Mbps |
| Ultra | 1440p+ | 8+ Mbps | 12+ Mbps |

**Auto-detect**: ICCI FREE automatically adjusts based on your connection.

---

## 👤 Account & Privacy

### How do I create an account?

1. Go to **iccifree.com**
2. Click **"Login"**
3. Choose your method:
   - Email & Password
   - Google OAuth
   - Discord OAuth
4. Complete registration
5. Verify email (if using email/password)

### Is my data safe?

**Yes!** We take privacy seriously:
- ✅ End-to-end encryption for P2P streams
- ✅ Minimal data collection
- ✅ No data selling
- ✅ GDPR compliant
- ✅ Secure authentication (OAuth 2.0)
- ✅ Regular security audits

### What data do you collect?

**We only collect:**
- Email address (for login)
- Username (public)
- Profile information (optional)
- Stream metadata (title, description)
- Analytics (anonymous, aggregate only)

**We DO NOT collect:**
- Stream content (P2P, not stored)
- Private messages (encrypted)
- Browsing history
- Third-party cookies

### Can I delete my account?

**Yes**, anytime! 
1. Go to **Settings** → **Account**
2. Click **"Delete Account"**
3. Confirm deletion
4. All your data is permanently removed

### How do you make money if it's free?

Our business model:
1. **Transaction fees** (3% on tips/donations)
2. **Premium features** (optional, coming soon)
3. **Enterprise plans** (white-label)
4. We keep costs low with serverless architecture

**We never sell your data.**

---

## 💰 Monetization

### Can I make money streaming?

**Yes!** Multiple ways:
- ✅ Direct tips from viewers (0% fee)
- ✅ Subscriptions (coming v2.1)
- ✅ Sponsorships (your own deals)
- 🔄 Ad revenue sharing (coming v2.2)

### How do tips work?

1. Viewers click **"Tip"** button
2. Enter amount (min $1)
3. Payment processed (Stripe)
4. You receive **97%** (we take 3%)
5. Instant payout to your account

**We take minimal fees** compared to:
- Twitch: 50%
- YouTube: 30%
- Patreon: 12%

### When can I withdraw money?

- **Minimum**: $10
- **Processing**: 1-3 business days
- **Methods**: Bank transfer, PayPal, Stripe

### Are there any hidden fees?

**No hidden fees!**
- Tips: 3% platform fee
- Payment processing: ~2.9% + $0.30 (Stripe)
- Withdrawal: Free (bank) or $1 (PayPal)
- Everything else: FREE

---

## 🔧 Troubleshooting

### Stream won't start - "Permission Denied"

**Solution:**
1. Allow camera/microphone in browser
2. Check browser settings
3. Try different browser (Chrome recommended)
4. Restart browser
5. Check antivirus/firewall

**Chrome**: Settings → Privacy & Security → Site Settings → Camera/Microphone

### Viewers can't see my stream

**Possible causes:**
1. **Firewall blocking WebRTC**
   - Check router settings
   - Try different network
   - Enable STUN/TURN servers

2. **Connection issues**
   - Run `testWebRTC()` in console
   - Check both users' connections
   - Verify ICE candidates

3. **Browser compatibility**
   - Update to latest browser
   - Try Chrome (best WebRTC support)

### Poor video quality / Lag

**Solutions:**
1. **Check internet speed**: speedtest.net
2. **Lower bitrate**: Settings → Quality → Lower
3. **Close other apps** using bandwidth
4. **Use wired connection** instead of WiFi
5. **Update browser** to latest version

### Audio issues (echo, noise)

**Solutions:**
1. **Use headphones** (prevents echo)
2. **Enable noise suppression**: Settings → Audio
3. **Adjust microphone gain**
4. **Check for interference**
5. **Update audio drivers**

### Can't login / Auth errors

**Solutions:**
1. **Clear browser cache & cookies**
2. **Try incognito mode**
3. **Check email/password** carefully
4. **Reset password** if forgotten
5. **Try different OAuth provider**

### PWA won't install

**Solutions:**
1. **Use HTTPS** (required for PWA)
2. **Update browser** to latest
3. **Check manifest.json** is accessible
4. **Clear cache** and retry
5. **Try different browser**

### "Failed to connect" error

**Solutions:**
1. Run diagnostics: `testNetwork()`
2. Check firewall settings
3. Verify Supabase credentials
4. Check browser console for errors
5. Contact support with error details

---

## 📞 Still Need Help?

### Support Channels

- 📧 **Email**: support@iccifree.com
- 💬 **Discord**: [Join Server](https://discord.gg/iccifree)
- 🐛 **GitHub**: [Report Issue](https://github.com/yourusername/iccifree/issues)
- 📚 **Docs**: [Read Documentation](README.md)

### Response Times

- Email: 24-48 hours
- Discord: Real-time (community)
- Critical issues: <4 hours

### Community Resources

- 📖 [Full Documentation](README.md)
- 🚀 [Quick Start Guide](QUICKSTART.md)
- 🔒 [Security Policy](SECURITY.md)
- 🤝 [Contributing Guide](CONTRIBUTING.md)

---

## 🔄 Suggest a Question

Don't see your question here? 

1. **Email**: faq@iccifree.com
2. **Subject**: "FAQ Suggestion"
3. **Include**: Your question + context

We'll add popular questions in the next update!

---

<div align="center">
  <strong>Questions Answered? Start Streaming! 🎥</strong>
  <br>
  <sub>Updated: September 26, 2025</sub>
</div>
