import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
            setAuthEnabled(session.auth_enabled);
            setAuthenticated(session.authenticated);
            setUsername(session.username);
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
  }, []);

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
      login: async (nextUsername: string, password: string) => {
        const session = await api.auth.login({ username: nextUsername, password });
        setAuthEnabled(session.auth_enabled);
        setAuthenticated(session.authenticated);
        setUsername(session.username);
      },
      logout: async () => {
        const session = await api.auth.logout();
        setAuthEnabled(session.auth_enabled);
        setAuthenticated(session.authenticated);
        setUsername(session.username);
      },
    }),
    [authEnabled, authenticated, loading, username, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
