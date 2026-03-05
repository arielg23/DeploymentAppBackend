import {create} from 'zustand';
import type {ActiveUpload, AppMode, Site, Unit} from '../types';

interface SessionState {
  selectedSite: Site | null;
  activeUpload: ActiveUpload | null;
  units: Unit[] | null;
  currentMode: AppMode | null;
  setSite: (site: Site) => void;
  setUpload: (upload: ActiveUpload) => void;
  setUnits: (units: Unit[]) => void;
  setMode: (mode: AppMode) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  selectedSite: null,
  activeUpload: null,
  units: null,
  currentMode: null,
  setSite: site => set({selectedSite: site}),
  setUpload: upload => set({activeUpload: upload}),
  setUnits: units => set({units}),
  setMode: mode => set({currentMode: mode}),
  reset: () => set({selectedSite: null, activeUpload: null, units: null, currentMode: null}),
}));
