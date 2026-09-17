import type { SmartTimeAction } from './aiActionEngine';
import { OfflineActionQueue } from './offlineActionQueue';
import { createSyncMetadata, getClientId } from './syncMetadata';
import { apiUrl } from './apiConfig';

export interface SyncEnvelope {
  id: string;
  clientId: string;
  updatedAt: string;
  action: SmartTimeAction;
  version: number;
}

export interface SyncResult { accepted: string[]; rejected: string[]; conflicts: string[]; }

export async function syncPendingActions(): Promise<SyncResult> {
  const queued = OfflineActionQueue.list();
  if (!queued.length || typeof navigator !== 'undefined' && !navigator.onLine) {
    return { accepted: [], rejected: [], conflicts: [] };
  }

  const envelopes: SyncEnvelope[] = queued.map((item) => ({
    id: item.id, clientId: getClientId(), updatedAt: createSyncMetadata().updatedAt, action: item.action, version: item.attempts + 1,
  }));

  try {
    const response = await fetch(apiUrl('/api/sync/actions'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: getClientId(), actions: envelopes }),
    });
    if (!response.ok) throw new Error(`Sync failed (${response.status})`);
    const result = await response.json() as SyncResult;
    for (const id of result.accepted || []) OfflineActionQueue.remove(id);
    return result;
  } catch (error) {
    console.warn('[SMART TIME V9] sync deferred:', error);
    for (const item of queued) OfflineActionQueue.markAttempt(item.id);
    return { accepted: [], rejected: [], conflicts: [] };
  }
}

export function startSyncLifecycle(): () => void {
  const run = () => { void syncPendingActions(); };
  window.addEventListener('online', run);
  const timer = window.setInterval(run, 30_000);
  run();
  return () => { window.removeEventListener('online', run); window.clearInterval(timer); };
}
