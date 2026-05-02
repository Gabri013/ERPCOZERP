import { api } from '@/services/api';

export async function getPlatformSettings() {
  const res = await api.get('/api/platform/settings');
  return res?.data?.data;
}

export async function putPlatformSettings(patch) {
  const res = await api.put('/api/platform/settings', patch);
  return res?.data?.data;
}
