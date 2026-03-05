import NetInfo from '@react-native-community/netinfo';
import {AppState, AppStateStatus} from 'react-native';
import {database} from '../db/database';
import QueuedAssignment from '../db/models/QueuedAssignment';
import QueuedSkip from '../db/models/QueuedSkip';
import {submitAssignment, submitSkip} from '../api/sites';
import {useSyncStore} from '../store/syncStore';

const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2000;
const MAX_RETRY_DELAY_MS = 300000;

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncRunning = false;

const getRetryDelay = (retryCount: number) =>
  Math.min(RETRY_BASE_MS * Math.pow(2, retryCount), MAX_RETRY_DELAY_MS);

export const enqueueAssignment = async (params: {
  uploadId: string;
  siteId: string;
  unitId: string;
  devEuiRaw: string;
  devEuiNormalized: string;
  timestampLocal: string;
}): Promise<QueuedAssignment> => {
  return database.write(async () =>
    database.get<QueuedAssignment>('queued_assignments').create(record => {
      record.uploadId = params.uploadId;
      record.siteId = params.siteId;
      record.unitId = params.unitId;
      record.devEuiRaw = params.devEuiRaw;
      record.devEuiNormalized = params.devEuiNormalized;
      record.timestampLocal = params.timestampLocal;
      record.status = 'PENDING';
      record.retryCount = 0;
      record.lastError = null;
    })
  );
};

export const enqueueSkip = async (params: {
  uploadId: string;
  siteId: string;
  unitId: string;
  reasonId?: string;
  timestampLocal: string;
}): Promise<QueuedSkip> => {
  return database.write(async () =>
    database.get<QueuedSkip>('queued_skips').create(record => {
      record.uploadId = params.uploadId;
      record.siteId = params.siteId;
      record.unitId = params.unitId;
      record.reasonId = params.reasonId || null;
      record.timestampLocal = params.timestampLocal;
      record.status = 'PENDING';
      record.retryCount = 0;
    })
  );
};

const syncAssignments = async () => {
  const pending = await database
    .get<QueuedAssignment>('queued_assignments')
    .query()
    .fetch()
    .then(all => all.filter(a => a.status === 'PENDING'));

  for (const item of pending) {
    try {
      await submitAssignment(item.uploadId, {
        site_id: item.siteId,
        unit_id: item.unitId,
        dev_eui_raw: item.devEuiRaw,
        timestamp_local: item.timestampLocal,
      });
      await database.write(async () => item.update(r => { r.status = 'SENT'; }));
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409) {
        await database.write(async () => item.update(r => { r.status = 'CONFLICT'; r.lastError = JSON.stringify(error.response.data); }));
      } else {
        const newRetry = item.retryCount + 1;
        const newStatus = newRetry >= MAX_RETRIES ? 'ERROR' : 'PENDING';
        await database.write(async () => item.update(r => { r.retryCount = newRetry; r.status = newStatus; r.lastError = error?.message; }));
        if (newStatus === 'PENDING') {
          scheduleRetry(getRetryDelay(newRetry));
          return;
        }
      }
    }
  }
};

const syncSkips = async () => {
  const pending = await database
    .get<QueuedSkip>('queued_skips')
    .query()
    .fetch()
    .then(all => all.filter(s => s.status === 'PENDING'));

  for (const item of pending) {
    try {
      await submitSkip(item.uploadId, {site_id: item.siteId, unit_id: item.unitId, reason_id: item.reasonId || undefined});
      await database.write(async () => item.update(r => { r.status = 'SENT'; }));
    } catch (error: any) {
      const newRetry = item.retryCount + 1;
      await database.write(async () => item.update(r => { r.retryCount = newRetry; r.status = newRetry >= MAX_RETRIES ? 'ERROR' : 'PENDING'; }));
    }
  }
};

export const runSync = async () => {
  if (isSyncRunning) return;
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  isSyncRunning = true;
  useSyncStore.getState().setIsSyncing(true);
  try {
    await syncAssignments();
    await syncSkips();
    await updateCounts();
    useSyncStore.getState().setLastSync(new Date());
  } finally {
    isSyncRunning = false;
    useSyncStore.getState().setIsSyncing(false);
  }
};

const scheduleRetry = (delayMs: number) => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(runSync, delayMs);
};

export const updateCounts = async () => {
  const assignments = await database.get<QueuedAssignment>('queued_assignments').query().fetch();
  useSyncStore.getState().setPendingCount(assignments.filter(a => a.status === 'PENDING').length);
  useSyncStore.getState().setConflictCount(assignments.filter(a => a.status === 'CONFLICT').length);
};

export const initSyncService = () => {
  // Sync on network reconnect
  NetInfo.addEventListener(state => {
    if (state.isConnected) runSync();
  });

  // Sync when app comes to foreground
  AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') runSync();
  });

  updateCounts();
  runSync();
};
