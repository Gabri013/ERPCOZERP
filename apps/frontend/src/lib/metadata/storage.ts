import { DEFAULT_METADATA_VERSION, DEFAULT_ENTITIES, DEFAULT_RULES, DEFAULT_WORKFLOWS } from './defaults';

const PREFIX = 'nomus_erp_meta_';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
};

export const metadataStore = {
  getVersion: () => readJson('version', DEFAULT_METADATA_VERSION),
  setVersion: (version) => writeJson('version', version),
  getEntities: () => readJson('entities', DEFAULT_ENTITIES),
  setEntities: (entities) => writeJson('entities', entities),
  getRules: () => readJson('rules', DEFAULT_RULES),
  setRules: (rules) => writeJson('rules', rules),
  getWorkflows: () => readJson('workflows', DEFAULT_WORKFLOWS),
  setWorkflows: (workflows) => writeJson('workflows', workflows),
  getSnapshots: () => readJson('snapshots', []),
  saveSnapshot: (snapshot) => {
    const all = metadataStore.getSnapshots();
    const next = [{ ...snapshot, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...all];
    writeJson('snapshots', next);
    return next[0];
  },
  rollbackSnapshot: (snapshotId) => {
    const snapshot = metadataStore.getSnapshots().find((item) => item.id === snapshotId);
    if (!snapshot) return false;
    metadataStore.setEntities(snapshot.entities || DEFAULT_ENTITIES);
    metadataStore.setRules(snapshot.rules || DEFAULT_RULES);
    metadataStore.setWorkflows(snapshot.workflows || DEFAULT_WORKFLOWS);
    metadataStore.setVersion(snapshot.version || DEFAULT_METADATA_VERSION);
    return true;
  },
};
