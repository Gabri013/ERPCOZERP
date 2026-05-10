// Hook para acessar a loja de metadados
import { useStore } from 'zustand';
import { useMetadataStore } from '@/stores/metadataStore';

export function useMetadata() {
  const store = useMetadataStore();
  return {
    entities: store.entities,
    loading: store.loading,
    error: store.error,
    loadEntities: store.loadEntities,
    getEntity: store.getEntity,
    invalidate: store.invalidate
  };
}

// Hook para acessar a loja de dados
import { useDataStore } from '@/stores/dataStore';

export function useDynamicData() {
  const store = useDataStore();
  return {
    records: store.records,
    filters: store.filters,
    loading: store.loading,
    error: store.error,
    setRecords: store.setRecords,
    getRecords: store.getRecords,
    setFilter: store.setFilter,
    clearEntityCache: store.clearEntityCache,
  };
}
