/**
 * Helper para fazer requisições autenticadas para a API
 * Inclui automaticamente o token JWT (ou token de impersonation) do localStorage
 */

const TOKEN_KEY = 'access_token';

/**
 * Busca token atual do localStorage
 */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Headers padrão para API autenticada
 */
function getAuthHeaders(customHeaders = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...customHeaders,
  };
}

/**
 * GET autenticado
 */
export async function apiGet(url, params = {}, options = {}) {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  const res = await fetch(fullUrl, {
    method: 'GET',
    headers: getAuthHeaders(options.headers),
    ...options,
  });
  return res.json();
}

/**
 * POST autenticado
 */
export async function apiPost(url, body = {}, options = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(options.headers),
    body: JSON.stringify(body),
    ...options,
  });
  return res.json();
}

/**
 * PUT autenticado
 */
export async function apiPut(url, body = {}, options = {}) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(options.headers),
    body: JSON.stringify(body),
    ...options,
  });
  return res.json();
}

/**
 * DELETE autenticado
 */
export async function apiDelete(url, options = {}) {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(options.headers),
    ...options,
  });
  return res.json();
}

/**
 * Alias para fetch completo (para casos especiais)
 */
export async function apiFetch(url, options = {}) {
  const mergedOptions = {
    ...options,
    headers: getAuthHeaders(options.headers),
  };
  return fetch(url, mergedOptions);
}

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  fetch: apiFetch,
};
