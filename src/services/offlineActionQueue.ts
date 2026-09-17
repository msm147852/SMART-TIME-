import type { SmartTimeAction } from './aiActionEngine';

/**
 * V9 offline queue contract.
 *
 * This first implementation is intentionally dependency-free. It keeps the
 * queue behind a tiny API so IndexedDB can replace localStorage later without
 * changing AI, UI or repository code.
 */
export interface QueuedAction {
  id: string;
  createdAt: string;
  attempts: number;
  action: SmartTimeAction;
}

const STORAGE_KEY = 'smart_time_v9_action_queue';

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const readQueue = (): QueuedAction[] => {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: QueuedAction[]) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage failures must never crash the application.
  }
};

export const OfflineActionQueue = {
  list(): QueuedAction[] {
    return readQueue();
  },

  enqueue(action: SmartTimeAction): QueuedAction {
    const item: QueuedAction = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      attempts: 0,
      action,
    };
    writeQueue([...readQueue(), item]);
    return item;
  },

  remove(id: string) {
    writeQueue(readQueue().filter((item) => item.id !== id));
  },

  markAttempt(id: string) {
    writeQueue(
      readQueue().map((item) => (item.id === id ? { ...item, attempts: item.attempts + 1 } : item))
    );
  },

  clear() {
    writeQueue([]);
  },
};
