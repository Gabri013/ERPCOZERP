const backendProvider = import.meta.env.VITE_BACKEND_PROVIDER || "api";
const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

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
  if (!appConfig.backendUrl) return path;
  return `${appConfig.backendUrl}${path}`;
}

export function validateRuntimeConfig() {
  return true;
}
