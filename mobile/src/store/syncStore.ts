import {create} from 'zustand';

interface SyncState {
  pendingCount: number;
  conflictCount: number;
  lastSyncAt: Date | null;
  isSyncing: boolean;
  setPendingCount: (count: number) => void;
  setConflictCount: (count: number) => void;
  setLastSync: (date: Date) => void;
  setIsSyncing: (syncing: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  pendingCount: 0,
  conflictCount: 0,
  lastSyncAt: null,
  isSyncing: false,
  setPendingCount: count => set({pendingCount: count}),
  setConflictCount: count => set({conflictCount: count}),
  setLastSync: date => set({lastSyncAt: date}),
  setIsSyncing: syncing => set({isSyncing: syncing}),
}));
