import { appConfig } from "@/config/appConfig";
import { userService } from "@/services/userService";

const TOKEN_KEY = "access_token";

export const authService = {
  async getCurrentUser() {
    if (appConfig.isLocal) {
      return userService.getCurrentUser();
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }

    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    return response.json();
  },

  async logout() {
    if (appConfig.isLocal) {
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return;
    }

    await fetch("/api/auth/logout", {
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
