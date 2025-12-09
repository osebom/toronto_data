/**
 * IndexedDB utility for caching events
 * Provides fast local storage and retrieval of event data
 */

const DB_NAME = 'toronto_events_db';
const STORE_NAME = 'events';
const DB_VERSION = 1;

interface EventCache {
  events: any[];
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function getCachedEvents(): Promise<any[] | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('events');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as EventCache | undefined;
        if (result && result.events) {
          resolve(result.events);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Error reading from IndexedDB:', error);
    return null;
  }
}

export async function setCachedEvents(events: any[]): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const cache: EventCache = {
        events,
        timestamp: Date.now(),
      };
      const request = store.put(cache, 'events');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error writing to IndexedDB:', error);
  }
}

export async function clearCache(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete('events');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error clearing IndexedDB cache:', error);
  }
}



