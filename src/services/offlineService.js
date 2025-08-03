// Offline data management service for PWA

const DB_NAME = 'KoreaPromiseTracker';
const DB_VERSION = 1;

class OfflineService {
  constructor() {
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('promises')) {
          const promiseStore = db.createObjectStore('promises', { keyPath: 'id' });
          promiseStore.createIndex('region', 'region', { unique: false });
          promiseStore.createIndex('status', 'status', { unique: false });
          promiseStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('pending_ratings')) {
          db.createObjectStore('pending_ratings', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('pending_comments')) {
          db.createObjectStore('pending_comments', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('pending_reports')) {
          db.createObjectStore('pending_reports', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('user_preferences')) {
          db.createObjectStore('user_preferences', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('cached_data')) {
          const cacheStore = db.createObjectStore('cached_data', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.initDB();
    }
    return this.db;
  }

  // Cache promises data
  async cachePromises(promises) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['promises'], 'readwrite');
    const store = transaction.objectStore('promises');

    for (const promise of promises) {
      await store.put(promise);
    }

    // Also cache as a single entry for quick retrieval
    await this.setCachedData('all_promises', promises);
  }

  // Get cached promises
  async getCachedPromises(filter = {}) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['promises'], 'readonly');
    const store = transaction.objectStore('promises');

    let promises = [];

    if (filter.region) {
      const index = store.index('region');
      const request = index.getAll(filter.region);
      promises = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else if (filter.status) {
      const index = store.index('status');
      const request = index.getAll(filter.status);
      promises = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      const request = store.getAll();
      promises = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return promises;
  }

  // Save offline rating
  async saveOfflineRating(rating) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['pending_ratings'], 'readwrite');
    const store = transaction.objectStore('pending_ratings');
    
    rating.timestamp = new Date().toISOString();
    rating.synced = false;
    
    await store.add(rating);
    
    // Register for background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-ratings');
    }
  }

  // Save offline comment
  async saveOfflineComment(comment) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['pending_comments'], 'readwrite');
    const store = transaction.objectStore('pending_comments');
    
    comment.timestamp = new Date().toISOString();
    comment.synced = false;
    
    await store.add(comment);
    
    // Register for background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-comments');
    }
  }

  // Save offline report
  async saveOfflineReport(report) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['pending_reports'], 'readwrite');
    const store = transaction.objectStore('pending_reports');
    
    report.timestamp = new Date().toISOString();
    report.synced = false;
    
    // Convert File objects to base64 for storage
    if (report.media && report.media instanceof File) {
      report.mediaData = await this.fileToBase64(report.media);
      report.mediaName = report.media.name;
      report.mediaType = report.media.type;
      delete report.media;
    }
    
    await store.add(report);
    
    // Register for background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-reports');
    }
  }

  // Get pending items count
  async getPendingCount() {
    const db = await this.ensureDB();
    
    const stores = ['pending_ratings', 'pending_comments', 'pending_reports'];
    let totalCount = 0;
    
    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const countRequest = store.count();
      
      const count = await new Promise((resolve, reject) => {
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => reject(countRequest.error);
      });
      
      totalCount += count;
    }
    
    return totalCount;
  }

  // Get all pending items
  async getPendingItems() {
    const db = await this.ensureDB();
    const items = {
      ratings: [],
      comments: [],
      reports: []
    };
    
    // Get pending ratings
    const ratingsTransaction = db.transaction(['pending_ratings'], 'readonly');
    const ratingsStore = ratingsTransaction.objectStore('pending_ratings');
    items.ratings = await new Promise((resolve, reject) => {
      const request = ratingsStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Get pending comments
    const commentsTransaction = db.transaction(['pending_comments'], 'readonly');
    const commentsStore = commentsTransaction.objectStore('pending_comments');
    items.comments = await new Promise((resolve, reject) => {
      const request = commentsStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Get pending reports
    const reportsTransaction = db.transaction(['pending_reports'], 'readonly');
    const reportsStore = reportsTransaction.objectStore('pending_reports');
    items.reports = await new Promise((resolve, reject) => {
      const request = reportsStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return items;
  }

  // Clear synced items
  async clearSyncedItems(type, ids) {
    const db = await this.ensureDB();
    const storeName = `pending_${type}`;
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    for (const id of ids) {
      await store.delete(id);
    }
  }

  // User preferences
  async setUserPreference(key, value) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['user_preferences'], 'readwrite');
    const store = transaction.objectStore('user_preferences');
    
    await store.put({ key, value, timestamp: new Date().toISOString() });
  }

  async getUserPreference(key) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['user_preferences'], 'readonly');
    const store = transaction.objectStore('user_preferences');
    
    const request = store.get(key);
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return result?.value;
  }

  // Generic cached data
  async setCachedData(key, data, ttl = 3600000) { // Default TTL: 1 hour
    const db = await this.ensureDB();
    const transaction = db.transaction(['cached_data'], 'readwrite');
    const store = transaction.objectStore('cached_data');
    
    await store.put({
      key,
      data,
      timestamp: new Date().toISOString(),
      expiry: new Date(Date.now() + ttl).toISOString()
    });
  }

  async getCachedData(key) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['cached_data'], 'readonly');
    const store = transaction.objectStore('cached_data');
    
    const request = store.get(key);
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!result) return null;
    
    // Check if data has expired
    if (new Date(result.expiry) < new Date()) {
      // Delete expired data
      const deleteTransaction = db.transaction(['cached_data'], 'readwrite');
      await deleteTransaction.objectStore('cached_data').delete(key);
      return null;
    }
    
    return result.data;
  }

  // Clear old cached data
  async clearExpiredCache() {
    const db = await this.ensureDB();
    const transaction = db.transaction(['cached_data'], 'readwrite');
    const store = transaction.objectStore('cached_data');
    const index = store.index('timestamp');
    
    const now = new Date().toISOString();
    const range = IDBKeyRange.upperBound(now);
    
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (new Date(cursor.value.expiry) < new Date()) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }

  // Helper function to convert File to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Clear all offline data
  async clearAllData() {
    const db = await this.ensureDB();
    const stores = ['promises', 'pending_ratings', 'pending_comments', 'pending_reports', 'user_preferences', 'cached_data'];
    
    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    }
  }
}

// Export singleton instance
export default new OfflineService();