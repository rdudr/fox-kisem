import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { StarterType } from '@prisma/client';

// IndexedDB storage adapter for Zustand
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export type CompanyProfile = {
  id: string;
  companyName: string;
  area: string;
  district: string;
  state: string;
  pincode: string;
  overallConsumption: number;
  updatedAt: string;
};

export type ZoneTag = {
  id: string;
  name: string;
  v1?: number | null;
  v2?: number | null;
  v3?: number | null;
  uthd1?: number | null;
  uthd2?: number | null;
  uthd3?: number | null;
  i1?: number | null;
  i2?: number | null;
  i3?: number | null;
  ithd1?: number | null;
  ithd2?: number | null;
  ithd3?: number | null;
  pf?: number | null;
  pqName?: string | null;
  recordingNameId?: string | null;
  description?: string | null;
  kvarD?: number | null;
  kvarQ?: number | null;
  kvarLeadLag?: string | null;
  totalPower?: number | null;
  createdAt: string;
};

export type AreaTag = {
  id: string;
  zoneId: string;
  name: string;
  pqName?: string | null;
  v1?: number | null;
  v2?: number | null;
  v3?: number | null;
  uthd1?: number | null;
  uthd2?: number | null;
  uthd3?: number | null;
  i1?: number | null;
  i2?: number | null;
  i3?: number | null;
  ithd1?: number | null;
  ithd2?: number | null;
  ithd3?: number | null;
  pf?: number | null;
  recordingNameId?: string | null;
  kvarD?: number | null;
  kvarQ?: number | null;
  kvarLeadLag?: string | null;
  totalPower?: number | null;
  description?: string | null;
  createdAt: string;
};

export type Entry = {
  id: string;
  areaId: string;
  machineTag: string;
  starterType: StarterType;
  vfdFrequency?: number | null;
  ratedKw: number;
  ratedHp?: number | null;
  voltage?: number | null;
  current?: number | null;
  kva?: number | null;
  pf?: number | null;
  kvar?: number | null;
  measuredKw: number;
  calculatedPower: number;
  loadFactor: number;
  description?: string | null;
  createdAt: string;
  createdById: string;
};

export type ApfcTag = {
  id: string;
  stage?: number | null;
  ratedCapacitorValue?: number | null;
  voltage?: number | null;
  iR?: number | null;
  iY?: number | null;
  iB?: number | null;
  remark?: string | null;
  description?: string | null;
  createdAt: string;
};

export type SyncJob = {
  jobId: string;
  status: 'pending' | 'synced';
  createdAt: number;
  reporterName: string;
  payload: {
    profile: CompanyProfile | null;
    zones: ZoneTag[];
    areas: AreaTag[];
    entries: Entry[];
    apfcs?: ApfcTag[];
  };
};

type AppState = {
  profile: CompanyProfile | null;
  zones: ZoneTag[];
  areas: AreaTag[];
  entries: Entry[];
  apfcs: ApfcTag[];
  syncQueue: SyncJob[];
  
  setProfile: (profile: CompanyProfile) => void;
  addZone: (zone: ZoneTag) => void;
  updateZone: (id: string, zone: Partial<ZoneTag>) => void;
  deleteZone: (id: string) => void;
  
  addArea: (area: AreaTag) => void;
  updateArea: (id: string, area: Partial<AreaTag>) => void;
  deleteArea: (id: string) => void;
  
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, entry: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  
  addApfc: (apfc: ApfcTag) => void;
  updateApfc: (id: string, apfc: Partial<ApfcTag>) => void;
  deleteApfc: (id: string) => void;
  
  wipeData: () => void;

  addJobToQueue: (job: SyncJob) => void;
  updateJobStatus: (jobId: string, status: 'pending' | 'synced') => void;
  pruneQueue: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      zones: [],
      areas: [],
      entries: [],
      apfcs: [],
      syncQueue: [],

      setProfile: (profile) => set({ profile }),

      addZone: (zone) => set((state) => ({ zones: [...state.zones, zone] })),
      updateZone: (id, updatedZone) => set((state) => ({
        zones: state.zones.map(z => z.id === id ? { ...z, ...updatedZone } : z)
      })),
      deleteZone: (id) => set((state) => ({
        zones: state.zones.filter(z => z.id !== id),
        areas: state.areas.filter(a => a.zoneId !== id),
        entries: state.entries.filter(e => {
          const area = state.areas.find(a => a.id === e.areaId);
          return area?.zoneId !== id;
        })
      })),

      addArea: (area) => set((state) => ({ areas: [...state.areas, area] })),
      updateArea: (id, updatedArea) => set((state) => ({
        areas: state.areas.map(a => a.id === id ? { ...a, ...updatedArea } : a)
      })),
      deleteArea: (id) => set((state) => ({
        areas: state.areas.filter(a => a.id !== id),
        entries: state.entries.filter(e => e.areaId !== id)
      })),

      addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),
      updateEntry: (id, updatedEntry) => set((state) => ({
        entries: state.entries.map(e => e.id === id ? { ...e, ...updatedEntry } : e)
      })),
      deleteEntry: (id) => set((state) => ({
        entries: state.entries.filter(e => e.id !== id)
      })),

      addApfc: (apfc) => set((state) => ({ apfcs: [...(state.apfcs || []), apfc] })),
      updateApfc: (id, updatedApfc) => set((state) => ({
        apfcs: (state.apfcs || []).map(a => a.id === id ? { ...a, ...updatedApfc } : a)
      })),
      deleteApfc: (id) => set((state) => ({
        apfcs: (state.apfcs || []).filter(a => a.id !== id)
      })),

      wipeData: () => set({ profile: null, zones: [], areas: [], entries: [], apfcs: [], syncQueue: [] }),

      addJobToQueue: (job) => set((state) => {
        // Hard cap at 50 to prevent IndexedDB bloat
        const newQueue = [job, ...state.syncQueue];
        if (newQueue.length > 50) newQueue.length = 50;
        return { syncQueue: newQueue };
      }),
      
      updateJobStatus: (jobId, status) => set((state) => ({
        syncQueue: state.syncQueue.map(job => job.jobId === jobId ? { ...job, status } : job)
      })),
      
      pruneQueue: () => set((state) => {
        const now = Date.now();
        const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
        return {
          syncQueue: state.syncQueue.filter(job => 
            // Keep pending jobs OR synced jobs younger than 48 hours
            job.status === 'pending' || (now - job.createdAt < FORTY_EIGHT_HOURS)
          )
        };
      })
    }),
    {
      name: 'fox-kisem-offline-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
