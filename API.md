# 🔌 ICCI FREE - API DOCUMENTATION

> **Complete API reference for ICCI FREE platform**

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Supabase Client](#supabase-client)
- [WebRTC API](#webrtc-api)
- [Analytics API](#analytics-api)
- [Error Handler API](#error-handler-api)
- [Performance API](#performance-api)
- [Testing API](#testing-api)

---

## 🌐 Overview

### Base Configuration

```javascript
// Supabase Configuration
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Global Objects

```javascript
window.supabaseClient        // Supabase client instance
window.WebRTCStreaming       // WebRTC class
window.Analytics             // Analytics instance
window.ErrorHandler          // Error handler instance
window.PerformanceOptimizer  // Performance optimizer
window.TestingUtils          // Testing utilities
```

---

## 🔐 Authentication

### Sign Up

```javascript
async function signUp(email, password, username) {
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { username: username }
    }
  });
  
  if (error) throw error;
  return data;
}
```

### Sign In

```javascript
async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (error) throw error;
  return data;
}
```

### OAuth Sign In

```javascript
async function signInWithOAuth(provider) {
  // provider: 'google', 'discord', 'github'
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: window.location.origin + '/dashboard.html'
    }
  });
  
  if (error) throw error;
  return data;
}
```

### Get Current User

```javascript
async function getCurrentUser() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  
  if (error) throw error;
  return user;
}
```

### Sign Out

```javascript
async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  
  if (error) throw error;
  window.location.href = '/';
}
```

---

## 📊 Supabase Client

### Database Operations

#### Select

```javascript
// Get all streams
const { data, error } = await supabaseClient
  .from('streams')
  .select('*');

// Get specific stream
const { data, error } = await supabaseClient
  .from('streams')
  .select('*')
  .eq('id', streamId)
  .single();

// Get with relations
const { data, error } = await supabaseClient
  .from('streams')
  .select(`
    *,
    users (username, avatar_url)
  `);
```

#### Insert

```javascript
const { data, error } = await supabaseClient
  .from('streams')
  .insert({
    user_id: userId,
    title: 'My Stream',
    description: 'Description here',
    is_live: true
  })
  .select()
  .single();
```

#### Update

```javascript
const { data, error } = await supabaseClient
  .from('streams')
  .update({ 
    viewer_count: 42,
    is_live: true 
  })
  .eq('id', streamId);
```

#### Delete

```javascript
const { error } = await supabaseClient
  .from('streams')
  .delete()
  .eq('id', streamId);
```

### Real-time Subscriptions

```javascript
// Subscribe to stream changes
const subscription = supabaseClient
  .channel('streams')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'streams' 
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

### Storage Operations

```javascript
// Upload file
const { data, error } = await supabaseClient.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file);

// Get public URL
const { data } = supabaseClient.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`);

// Delete file
const { error } = await supabaseClient.storage
  .from('avatars')
  .remove([`${userId}/avatar.jpg`]);
```

### RPC Functions

```javascript
// Call RPC function
const { data, error } = await supabaseClient.rpc('add_ice_candidate', {
  stream_id_param: streamId,
  candidate_param: JSON.stringify(candidate)
});
```

---

## 🎥 WebRTC API

### Initialize WebRTC

```javascript
// Create instance
const webrtc = new WebRTCStreaming(streamId, mode);
// mode: 'broadcaster' or 'viewer'

// With callbacks
const webrtc = new WebRTCStreaming(streamId, 'broadcaster');
webrtc.onLocalStream = (stream) => {
  videoElement.srcObject = stream;
};
webrtc.onRemoteStream = (stream) => {
  videoElement.srcObject = stream;
};
webrtc.onConnectionSuccess = () => {
  console.log('Connected!');
};
webrtc.onConnectionFailed = () => {
  console.log('Failed!');
};

// Initialize
await webrtc.init();
```

### WebRTC Methods

```javascript
// Start streaming (broadcaster)
await webrtc.init();

// Watch stream (viewer)
await webrtc.init();

// Toggle audio
const isEnabled = webrtc.toggleAudio();
webrtc.toggleAudio(true);  // Force enable
webrtc.toggleAudio(false); // Force disable

// Toggle video
const isEnabled = webrtc.toggleVideo();

// Send data via data channel
webrtc.dataChannel?.send(JSON.stringify({ 
  type: 'chat',
  message: 'Hello!' 
}));

// Get connection stats
const stats = await webrtc.getStats();
console.log(stats);

// Disconnect
webrtc.disconnect();
```

### WebRTC Events

```javascript
webrtc.onLocalStream = (stream) => {
  // Local stream received (broadcaster)
};

webrtc.onRemoteStream = (stream) => {
  // Remote stream received (viewer)
};

webrtc.onConnectionSuccess = () => {
  // Connection established
};

webrtc.onConnectionFailed = () => {
  // Connection failed
};

webrtc.onDataMessage = (message) => {
  // Data channel message received
  console.log(JSON.parse(message));
};

webrtc.onStatsUpdate = (stats) => {
  // Connection stats updated
  console.log(stats);
};
```

---

## 📈 Analytics API

### Track Events

```javascript
// Track custom event
Analytics.track('event_name', {
  key1: 'value1',
  key2: 'value2'
});

// Predefined events
Analytics.trackStreamStart(streamId);
Analytics.trackStreamEnd(streamId, duration);
Analytics.trackStreamView(streamId);
Analytics.trackChatMessage(streamId, messageLength);
Analytics.trackFollow(targetUserId);
Analytics.trackUnfollow(targetUserId);
Analytics.trackSignup('google');
Analytics.trackLogin('email');
Analytics.trackLogout();
Analytics.trackError('type', 'message');
```

### Get Analytics Data

```javascript
// Get all analytics
const data = Analytics.getAnalyticsData();
console.log(data);

// Clear analytics
Analytics.clearAnalytics();

// Manual flush
await Analytics.flush();
```

### Analytics Configuration

```javascript
// Set user ID
Analytics.userId = 'user-123';

// Set batch size
Analytics.batchSize = 20;

// Set flush interval (ms)
// Modified via startAutoFlush()
```

---

## 🐛 Error Handler API

### Error Tracking

```javascript
// Errors are automatically captured
// But you can manually log:

ErrorHandler.handleError({
  type: 'Custom Error',
  message: 'Something went wrong',
  stack: new Error().stack
});
```

### Get Errors

```javascript
// Get all errors
const errors = ErrorHandler.getErrors();

// Get error report
const report = ErrorHandler.getErrorReport();
console.log(report);
/*
{
  totalErrors: 10,
  errorsByType: {
    "JavaScript Error": 5,
    "Promise Rejection": 3,
    "Network Error": 2
  },
  recentErrors: [...],
  timestamp: "2025-09-26T..."
}
*/

// Clear errors
ErrorHandler.clearErrors();

// Download error log
ErrorHandler.downloadErrorLog();
```

---

## ⚡ Performance API

### Image Optimization

```javascript
// Optimize image URL
const optimizedUrl = PerformanceOptimizer.optimizeImage(
  originalUrl,
  width = 400,
  quality = 80
);
```

### Utilities

```javascript
// Debounce function
const debouncedFn = PerformanceOptimizer.debounce(
  myFunction,
  wait = 200
);

// Throttle function
const throttledFn = PerformanceOptimizer.throttle(
  myFunction,
  limit = 100
);

// Request idle callback
PerformanceOptimizer.requestIdleCallback(() => {
  // Low priority task
});
```

### Metrics

```javascript
// Get performance metrics
const metrics = PerformanceOptimizer.getMetrics();
console.log(metrics);
```

---

## 🧪 Testing API

### Run Tests

```javascript
// Run all tests
const results = await TestingUtils.runAllTests();

// Run specific tests
await TestingUtils.testWebRTC();
await TestingUtils.testPerformance();
await TestingUtils.testNetwork();
TestingUtils.testStorage();
await TestingUtils.testMedia();
TestingUtils.testBrowser();
```

### Get Reports

```javascript
// Console report
TestingUtils.consoleReport();

// Generate report
const report = TestingUtils.generateReport();
console.log(report);

// Download report
TestingUtils.downloadReport();
```

### Performance Marking

```javascript
// Mark performance point
TestingUtils.mark('operation-start');

// ... do something ...

TestingUtils.mark('operation-end');

// Measure duration
const duration = TestingUtils.measure(
  'operation-duration',
  'operation-start',
  'operation-end'
);
// Logs: ⏱️ operation-duration: 123.45ms
```

---

## 🎯 Console Commands

### Quick Access Commands

```javascript
// Global commands available in browser console

// Testing
runTests()              // Run all tests
testWebRTC()           // Test WebRTC only
testPerformance()      // Test performance
testNetwork()          // Test network
testReport()           // Show report
downloadReport()       // Download JSON

// Analytics
getAnalytics()         // Get analytics data
clearAnalytics()       // Clear analytics

// Errors
getErrorReport()       // Get error report
downloadErrorLog()     // Download errors

// Performance
PerformanceOptimizer.getMetrics()  // Get metrics
```

---

## 📝 Examples

### Complete Stream Setup

```javascript
// 1. Check authentication
const user = await getCurrentUser();
if (!user) {
  window.location.href = '/auth.html';
  return;
}

// 2. Create stream in database
const { data: stream } = await supabaseClient
  .from('streams')
  .insert({
    user_id: user.id,
    title: 'My Stream',
    is_live: true
  })
  .select()
  .single();

// 3. Initialize WebRTC
const webrtc = new WebRTCStreaming(stream.id, 'broadcaster');

webrtc.onLocalStream = (localStream) => {
  document.getElementById('preview').srcObject = localStream;
};

webrtc.onConnectionSuccess = () => {
  console.log('Streaming started!');
  Analytics.trackStreamStart(stream.id);
};

await webrtc.init();

// 4. Handle cleanup
window.addEventListener('beforeunload', () => {
  webrtc.disconnect();
  supabaseClient
    .from('streams')
    .update({ is_live: false })
    .eq('id', stream.id);
});
```

### Complete Viewer Setup

```javascript
// 1. Get stream info
const { data: stream } = await supabaseClient
  .from('streams')
  .select('*')
  .eq('id', streamId)
  .single();

// 2. Initialize WebRTC
const webrtc = new WebRTCStreaming(streamId, 'viewer');

webrtc.onRemoteStream = (remoteStream) => {
  document.getElementById('player').srcObject = remoteStream;
};

webrtc.onConnectionSuccess = () => {
  console.log('Watching stream!');
  Analytics.trackStreamView(streamId);
};

await webrtc.init();

// 3. Subscribe to chat
const chatSubscription = supabaseClient
  .channel(`stream:${streamId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      displayMessage(payload.new);
    }
  )
  .subscribe();
```

---

## 🔗 Related Documentation

- [README](README.md) - Main documentation
- [QUICKSTART](QUICKSTART.md) - Quick start guide
- [FAQ](FAQ.md) - Frequently asked questions
- [CONTRIBUTING](CONTRIBUTING.md) - Contributor guide

---

<div align="center">
  <strong>API Documentation Complete!</strong>
  <br>
  <sub>Last Updated: September 26, 2025</sub>
</div>
