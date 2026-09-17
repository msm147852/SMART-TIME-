import type { SmartTimeAction } from './aiActionEngine';
import type { QueuedAction } from './offlineActionQueue';

const DB_NAME = 'smart-time-v9';
const STORE_NAME = 'actions';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });
}

export const IndexedDbActionQueue = {
  async list(): Promise<QueuedAction[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as QueuedAction[]);
      request.onerror = () => reject(request.error);
    });
  },
  async enqueue(action: SmartTimeAction): Promise<QueuedAction> {
    const item: QueuedAction = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(), attempts: 0, action,
    };
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(item);
      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  },
  async remove(id: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
      request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
    });
  },
};
