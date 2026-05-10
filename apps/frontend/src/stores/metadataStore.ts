import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveApiUrl } from '@/config/appConfig';

// Helper para obter headers de autenticação
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Tipos para entidades
interface Entity {
  code: string;
  [key: string]: any;
}

// Tipos para o metadata store
interface MetadataState {
  entities: Entity[];
  loading: boolean;
  error: string | null;
  loadEntities: () => Promise<void>;
  getEntity: (code: string) => Entity | undefined;
  invalidate: () => void;
}

// Store centralizada para metadados (cache no frontend)
export const useMetadataStore = create<MetadataState>(
  persist(
    (set, get) => ({
      entities: [],
      loading: false,
      error: null,

      // Carrega todas entidades
      loadEntities: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(resolveApiUrl('/api/entities'), {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            }
          });
          const json = await res.json();
          if (json.success) {
            set({ entities: json.data, loading: false });
          } else {
            throw new Error(json.error);
          }
        } catch (err) {
          set({ error: err.message, loading: false });
        }
      },

      // Busca uma entidade por código
      getEntity: (code: string) => {
        return get().entities.find(e => e.code === code);
      },

      // Invalida cache
      invalidate: () => set({ entities: [] }),
    }),
    {
      name: 'metadata-storage',
      version: 1,
      migrate: (persistedState) => {
        return persistedState;
      },
    }
  )
);

// Tipos para o data store
interface DataState {
  records: Record<string, any[]>;
  filters: Record<string, any>;
  loading: boolean;
  error: string | null;
  setRecords: (entityCode: string, records: any[]) => void;
  getRecords: (entityCode: string) => any[];
  setFilter: (entityCode: string, filters: any) => void;
  clearEntityCache: (entityCode: string) => void;
}

// Store para dados dinâmicos
export const useDataStore = create<DataState>((set, get) => ({
  records: {},
  filters: {},
  loading: false,
  error: null,

  setRecords: (entityCode: string, records: any[]) => set((state) => ({
    records: { ...state.records, [entityCode]: records }
  })),

  getRecords: (entityCode: string) => {
    return get().records[entityCode] || [];
  },

  setFilter: (entityCode: string, filters: any) => set((state) => ({
    filters: { ...state.filters, [entityCode]: filters }
  })),

  clearEntityCache: (entityCode: string) => set((state) => {
    const newRecords = { ...state.records };
    delete newRecords[entityCode];
    return { records: newRecords };
  }),
}));
