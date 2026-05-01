import { appConfig, resolveApiUrl } from "@/config/appConfig";
import { userService } from "@/services/userService";

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
    if (appConfig.isLocal) {
      return userService.getCurrentUser();
    }

    const token = getStoredAuthToken();
    if (!token) {
      return null;
    }

    // Normaliza para manter o restante da aplicação usando uma única chave.
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
    if (appConfig.isLocal) {
      return;
    }

    const token = getStoredAuthToken();
    if (!token) {
      return;
    }

    await fetch(resolveApiUrl("/api/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  navigateToLogin() {
    if (appConfig.isLocal) {
      return;
    }

    window.location.href = appConfig.authLoginUrl;
  },

  subscribeAuthChanges() {
    return () => {};
  },
};
