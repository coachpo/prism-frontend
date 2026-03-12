import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import type { LoginSessionDuration, SessionResponse } from "@/lib/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

const PROACTIVE_REFRESH_MS = 12 * 60 * 1000; // 12 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applySessionState = useCallback((session: SessionResponse) => {
    setAuthEnabled(session.auth_enabled);
    setAuthenticated(session.authenticated);
    setUsername(session.username);
  }, []);

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    refreshTimerRef.current = setInterval(() => {
      void api.auth.refresh().then(applySessionState).catch(() => {});
    }, PROACTIVE_REFRESH_MS);
  }, [applySessionState]);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    try {
      const status = await api.auth.status();
      setAuthEnabled(status.auth_enabled);
      if (!status.auth_enabled) {
        setAuthenticated(false);
        setUsername(null);
        return;
      }
      try {
        const session = await api.auth.session();
        setAuthEnabled(session.auth_enabled);
        setAuthenticated(session.authenticated);
        setUsername(session.username);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          try {
            const session = await api.auth.refresh();
            applySessionState(session);
          } catch (refreshError) {
            if (refreshError instanceof ApiError && refreshError.status === 401) {
              setAuthenticated(false);
              setUsername(null);
            } else {
              throw refreshError;
            }
          }
        } else {
          throw error;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [applySessionState]);

  // Start/stop proactive refresh timer based on auth state
  useEffect(() => {
    if (authenticated && authEnabled) {
      startRefreshTimer();
    } else {
      stopRefreshTimer();
    }
    return () => stopRefreshTimer();
  }, [authenticated, authEnabled, startRefreshTimer, stopRefreshTimer]);

  // Refresh session when user returns to the tab after being away
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && authenticated && authEnabled) {
        void api.auth.refresh().then(applySessionState).catch(() => {});
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [authenticated, authEnabled, applySessionState]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authEnabled,
      authenticated,
      loading,
      username,
      refreshAuth,
      login: async (
        nextUsername: string,
        password: string,
        sessionDuration: LoginSessionDuration
      ) => {
        const session = await api.auth.login({
          username: nextUsername,
          password,
          session_duration: sessionDuration,
        });
        applySessionState(session);
      },
      logout: async () => {
        const session = await api.auth.logout();
        applySessionState(session);
      },
    }),
    [authEnabled, authenticated, loading, username, refreshAuth, applySessionState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
