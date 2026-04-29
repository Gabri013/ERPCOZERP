const backendProvider = import.meta.env.VITE_BACKEND_PROVIDER || "api";
const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3001").replace(/\/$/, "");

export const appConfig = {
  backendProvider,
  backendUrl,
  authLoginUrl: import.meta.env.VITE_AUTH_LOGIN_URL || "/login",
  isApi: backendProvider === "api",
  isLocal: backendProvider === "local",
};

export function resolveApiUrl(path) {
  if (!path?.startsWith('/api')) return path;
  if (!appConfig.isApi) return path;
  return `${appConfig.backendUrl}${path}`;
}

export function validateRuntimeConfig() {
  return true;
}
