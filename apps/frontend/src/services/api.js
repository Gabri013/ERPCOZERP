import { resolveApiUrl } from '@/config/appConfig';
import { toast } from 'sonner';

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  }
  return null;
}

async function parseJsonSafely(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(method, url, { data, silent403 } = {}) {
  const token = getToken();
  const headers = {};

  if (data !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(resolveApiUrl(url), {
    method,
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
  });

  const body = await parseJsonSafely(res);

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && (body.error || body.message)) ||
      (typeof body === 'string' && body) ||
      `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    if (typeof window !== 'undefined') {
      if (res.status === 403 && !silent403) {
        toast.error('Sem permissão para esta ação (403).');
      } else if (res.status === 401 && !message.toLowerCase().includes('auth')) {
        toast.error(message);
      }
    }
    throw err;
  }

  return {
    data: body,
    status: res.status,
    headers: res.headers,
  };
}

export const api = {
  get: (url, opts) => request('GET', url, opts),
  post: (url, data, opts) => request('POST', url, { data, ...opts }),
  put: (url, data) => request('PUT', url, { data }),
  patch: (url, data) => request('PATCH', url, { data }),
  delete: (url) => request('DELETE', url),
};

