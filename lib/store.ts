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
  uhtd1?: number | null;
  uhtd2?: number | null;
  uhtd3?: number | null;
  i1?: number | null;
  i2?: number | null;
  i3?: number | null;
  ihtd1?: number | null;
  ihtd2?: number | null;
  ihtd3?: number | null;
  pf?: number | null;
  pqName?: string | null;
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
  uhtd1?: number | null;
  uhtd2?: number | null;
  uhtd3?: number | null;
  i1?: number | null;
  i2?: number | null;
  i3?: number | null;
  ihtd1?: number | null;
  ihtd2?: number | null;
  ihtd3?: number | null;
  pf?: number | null;
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

type AppState = {
  profile: CompanyProfile | null;
  zones: ZoneTag[];
  areas: AreaTag[];
  entries: Entry[];
  
  setProfile: (profile: CompanyProfile) => void;
  addZone: (zone: ZoneTag) => void;
  updateZone: (id: string, zone: Partial<ZoneTag>) => void;
  deleteZone: (id: string) => void;
  
  addArea: (area: AreaTag) => void;
  updateArea: (id: string, area: Partial<AreaTag>) => void;
  deleteArea: (id: string) => void;
  
  addEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  
  wipeData: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      zones: [],
      areas: [],
      entries: [],

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
      deleteEntry: (id) => set((state) => ({
        entries: state.entries.filter(e => e.id !== id)
      })),

      wipeData: () => set({ profile: null, zones: [], areas: [], entries: [] }),
    }),
    {
      name: 'fox-kisen-offline-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
