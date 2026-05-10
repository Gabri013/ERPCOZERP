import { api } from './api';

function extractWidgets(res) {
  const body = res?.data ?? res;
  if (!body || typeof body !== 'object') return [];
  const widgets =
    body.data?.widgets ??
    body.widgets ??
    body.layout?.widgets ??
    (Array.isArray(body.data) ? body.data : null) ??
    [];
  return Array.isArray(widgets) ? widgets : [];
}

export const dashboardLayoutServiceApi = {
  async getLayout() {
    const res = await api.get('/api/dashboard/layout');
    return extractWidgets(res);
  },

  async saveLayout(widgetIds) {
    const res = await api.put('/api/dashboard/layout', { widgets: widgetIds });
    return extractWidgets(res);
  },

  async resetLayout() {
    const res = await api.post('/api/dashboard/layout/reset', {});
    return extractWidgets(res);
  },
};

