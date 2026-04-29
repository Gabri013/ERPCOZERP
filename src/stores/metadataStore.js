import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveApiUrl } from '@/config/appConfig';

// Helper para obter headers de autenticação
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Store centralizada para metadados (cache no frontend)
export const useMetadataStore = create(
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
      getEntity: (code) => {
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

// Store para dados dinâmicos
export const useDataStore = create((set, get) => ({
  records: {},
  filters: {},
  loading: false,
  error: null,

  setRecords: (entityCode, records) => set((state) => ({
    records: { ...state.records, [entityCode]: records }
  })),

  getRecords: (entityCode) => {
    return get().records[entityCode] || [];
  },

  setFilter: (entityCode, filters) => set((state) => ({
    filters: { ...state.filters, [entityCode]: filters }
  })),

  clearEntityCache: (entityCode) => set((state) => {
    const newRecords = { ...state.records };
    delete newRecords[entityCode];
    return { records: newRecords };
  }),
}));
