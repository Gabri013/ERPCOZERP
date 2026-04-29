const backendProvider = import.meta.env.VITE_BACKEND_PROVIDER || "api";

export const appConfig = {
  backendProvider,
  authLoginUrl: import.meta.env.VITE_AUTH_LOGIN_URL || "/login",
  isApi: backendProvider === "api",
  isLocal: backendProvider === "local",
};

export function validateRuntimeConfig() {
  return true;
}
