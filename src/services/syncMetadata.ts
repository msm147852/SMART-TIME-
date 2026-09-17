export type SyncState = 'synced' | 'pending' | 'failed' | 'conflict' | 'deleted';

export interface SyncMetadata {
  clientId: string;
  updatedAt: string;
  deletedAt?: string;
  syncState: SyncState;
  version: number;
}

const CLIENT_ID_KEY = 'smart_time_v9_client_id';

export function getClientId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const id = globalThis.crypto?.randomUUID?.() ?? `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}

export function createSyncMetadata(version = 1): SyncMetadata {
  return { clientId: getClientId(), updatedAt: new Date().toISOString(), syncState: 'pending', version };
}
