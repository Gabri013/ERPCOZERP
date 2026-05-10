import { api } from '@/services/api';

export async function fetchErrorQueue({ status, take = 100 } = {}) {
  const q = new URLSearchParams();
  if (status) q.set('status', status);
  q.set('take', String(take));
  const res = await api.get(`/api/error-monitor/queue?${q.toString()}`);
  return res?.data?.data ?? [];
}

export async function patchErrorQueueStatus(id, body) {
  const res = await api.patch(`/api/error-monitor/queue/${id}`, body);
  return res?.data?.data;
}

export async function analyzeErrorQueueItem(id) {
  const res = await api.post(`/api/error-monitor/queue/${id}/analyze`, {});
  return res?.data?.data;
}

export async function ingestClientError(payload) {
  const res = await api.post('/api/error-monitor/ingest', payload, { silent403: true });
  return res?.data;
}

