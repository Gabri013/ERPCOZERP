import { resolveApiUrl } from '@/config/appConfig';

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

async function request(method, url, { data } = {}) {
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
    throw err;
  }

  return body;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, data) => request('POST', url, { data }),
  put: (url, data) => request('PUT', url, { data }),
  delete: (url) => request('DELETE', url),
};

