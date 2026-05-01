import { api } from './api';

function extractWidgets(res) {
  const body = res?.data ?? res;
  const widgets =
    body?.data?.widgets ??
    body?.widgets ??
    body?.layout?.widgets ??
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
    await api.post('/api/dashboard/layout/reset', {});
  },
};

