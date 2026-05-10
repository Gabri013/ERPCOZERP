import { appConfig, resolveApiUrl } from "@/config/appConfig";

const TOKEN_KEY = "access_token";

function getStoredAuthToken() {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('impersonation_token')
  );
}

function clearStoredAuthTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('impersonation_token');
}

export const authService = {
  async getCurrentUser() {
    const token = getStoredAuthToken();
    if (!token) {
      return null;
    }

    if (!appConfig.isApi) {
      return null;
    }

    localStorage.setItem(TOKEN_KEY, token);

    const response = await fetch(resolveApiUrl("/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      clearStoredAuthTokens();
      return null;
    }

    return response.json();
  },

  async logout() {
    const token = getStoredAuthToken();
    if (!token || !appConfig.isApi) {
      return;
    }

    await fetch(resolveApiUrl("/api/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    clearStoredAuthTokens();
  },

  navigateToLogin() {
    if (!appConfig.isApi) return;
    window.location.href = appConfig.authLoginUrl;
  },

  subscribeAuthChanges(_cb) {
    return () => {};
  },
};
