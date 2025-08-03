# PWA Implementation - Korea Promise Tracker

## Overview
This document outlines the Progressive Web App (PWA) features implemented for the Korea Promise Tracker application as part of Phase 6.

## Implemented Features

### 1. Service Worker
- **File**: `/public/service-worker.js`
- **Features**:
  - Static asset caching for offline access
  - Dynamic content caching with network-first and cache-first strategies
  - Background sync for offline actions (ratings, comments, reports)
  - Push notification handling
  - Update management

### 2. Offline Functionality
- **Offline Page**: `/public/offline.html` - Custom offline page with Korean content
- **Offline Service**: `/src/services/offlineService.js` - IndexedDB management for offline data
- **Features**:
  - Cache promises data for offline viewing
  - Queue user actions when offline (ratings, comments, reports)
  - Automatic sync when connection restored
  - Offline indicator in UI

### 3. App Manifest
- **File**: `/public/manifest.json`
- **Features**:
  - App name and description in Korean
  - Icon definitions for all platforms
  - Theme colors matching app design
  - App shortcuts for quick actions
  - Display mode set to standalone

### 4. Install Prompts
- **Component**: `/src/components/pwa/InstallPrompt.jsx`
- **Features**:
  - Auto-detect installable state
  - Platform-specific instructions (iOS vs Android/Chrome)
  - Dismissible with localStorage persistence
  - Native install prompt integration

### 5. Update Management
- **Component**: `/src/components/pwa/UpdatePrompt.jsx`
- **Features**:
  - Detect new service worker versions
  - Prompt users to update
  - Graceful update with page reload

### 6. Push Notifications Infrastructure
- **Service Worker**: Push event handling implemented
- **Registration**: `/src/utils/serviceWorkerRegistration.js`
- **Features**:
  - VAPID key support
  - Notification permission requests
  - Click handling to open app

## Technical Implementation

### Caching Strategy
1. **Static Assets**: Cached on install (HTML, CSS, JS, images)
2. **API Requests**: Network-first with fallback to cache
3. **User Data**: Stored in IndexedDB for offline access

### Background Sync
- Implemented for three main actions:
  1. Promise ratings (`sync-ratings`)
  2. Comments (`sync-comments`)
  3. Citizen reports (`sync-reports`)

### IndexedDB Schema
```javascript
// Object Stores:
- promises: Cached promise data
- pending_ratings: Offline ratings queue
- pending_comments: Offline comments queue
- pending_reports: Offline reports queue
- user_preferences: Local user settings
- cached_data: Generic cache with TTL
```

## Usage Instructions

### For Users
1. **Install the App**:
   - Chrome/Edge: Click install button when prompted
   - iOS: Use Safari > Share > Add to Home Screen

2. **Offline Usage**:
   - Previously viewed content remains accessible
   - Actions are queued and synced when online
   - Offline indicator shows connection status

3. **Updates**:
   - App checks for updates automatically
   - Users prompted to refresh for new version

### For Developers

1. **Test Service Worker**:
```bash
# Start development server
npm start

# Service worker only works in production build
npm run build
serve -s build
```

2. **Generate Icons** (placeholder script):
```bash
node scripts/generate-icons.js
```

3. **Test Offline Mode**:
- Chrome DevTools > Network > Offline
- Check IndexedDB in Application tab

4. **Push Notifications Setup**:
- Generate VAPID keys
- Set `REACT_APP_VAPID_PUBLIC_KEY` in `.env`
- Implement server-side push logic

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari/iOS: Partial support (no background sync)
- Samsung Internet: Full support

## Performance Impact
- Initial load: +~50KB for service worker
- Subsequent loads: Faster due to caching
- Offline capability improves perceived performance

## Security Considerations
- Service worker only works over HTTPS
- Content Security Policy headers recommended
- Input sanitization for offline data

## Future Enhancements
1. Implement actual push notification server
2. Add periodic background sync for data updates
3. Implement app badging for unread notifications
4. Add offline analytics tracking
5. Optimize cache size management

## Maintenance
- Update service worker version when deploying
- Monitor cache storage usage
- Clean up old IndexedDB data periodically
- Test on various devices and browsers

## Troubleshooting

### Service Worker Not Registering
- Ensure HTTPS or localhost
- Check console for errors
- Clear browser cache and retry

### Icons Not Showing
- Generate actual PNG icons (current are placeholders)
- Verify manifest.json paths
- Check icon file permissions

### Offline Not Working
- Verify service worker is active
- Check cache storage in DevTools
- Ensure offline.html is cached

### Update Not Triggering
- Increment cache version in service worker
- Clear browser cache
- Check registration code