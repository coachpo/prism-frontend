import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import type { LoginSessionDuration, SessionResponse } from "@/lib/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

const PROACTIVE_REFRESH_MS = 12 * 60 * 1000; // 12 minutes

interface AuthBootstrapState {
  authEnabled: boolean;
  authenticated: boolean;
  username: string | null;
}

type AuthBootstrapMode = "full" | "public";

const authBootstrapPromises = new Map<AuthBootstrapMode, Promise<AuthBootstrapState>>();

async function loadAuthBootstrapState(
  mode: AuthBootstrapMode,
  reuseInFlight = false,
): Promise<AuthBootstrapState> {
  const inFlight = authBootstrapPromises.get(mode);
  if (reuseInFlight && inFlight) {
    return inFlight;
  }

  const loadPromise = (async (): Promise<AuthBootstrapState> => {
    if (mode === "public") {
      const session = await api.auth.publicBootstrap();
      return {
        authEnabled: session.auth_enabled,
        authenticated: session.authenticated,
        username: session.username,
      };
    }

    const status = await api.auth.status();
    if (!status.auth_enabled) {
      return {
        authEnabled: false,
        authenticated: false,
        username: null,
      };
    }

    try {
      const session = await api.auth.session();
      return {
        authEnabled: session.auth_enabled,
        authenticated: session.authenticated,
        username: session.username,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const session = await api.auth.refresh();
          return {
            authEnabled: session.auth_enabled,
            authenticated: session.authenticated,
            username: session.username,
          };
        } catch (refreshError) {
          if (refreshError instanceof ApiError && refreshError.status === 401) {
            return {
              authEnabled: true,
              authenticated: false,
              username: null,
            };
          }
          throw refreshError;
        }
      }
      throw error;
    }
  })();

  if (reuseInFlight) {
    authBootstrapPromises.set(mode, loadPromise);
    void loadPromise.finally(() => {
      if (authBootstrapPromises.get(mode) === loadPromise) {
        authBootstrapPromises.delete(mode);
      }
    });
  }

  return loadPromise;
}

export function AuthProvider({
  bootstrapMode = "full",
  children,
}: {
  bootstrapMode?: AuthBootstrapMode;
  children: ReactNode;
}) {
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const authStateVersionRef = useRef(0);
  const authMutationInFlightRef = useRef(false);

  const applySessionState = useCallback((session: SessionResponse) => {
    setAuthEnabled(session.auth_enabled);
    setAuthenticated(session.authenticated);
    setUsername(session.username);
  }, []);

  const applyBootstrapState = useCallback((state: AuthBootstrapState) => {
    setAuthEnabled(state.authEnabled);
    setAuthenticated(state.authenticated);
    setUsername(state.username);
  }, []);

  const runPassiveSessionRefresh = useCallback(async () => {
    if (authMutationInFlightRef.current) {
      return;
    }

    const requestVersion = authStateVersionRef.current;

    try {
      const session = await api.auth.refresh();
      if (
        authMutationInFlightRef.current ||
        requestVersion !== authStateVersionRef.current
      ) {
        return;
      }
      applySessionState(session);
    } catch {
      // Ignore background refresh failures; bootstrap/manual flows handle state recovery.
    }
  }, [applySessionState]);

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    refreshTimerRef.current = setInterval(() => {
      void runPassiveSessionRefresh();
    }, PROACTIVE_REFRESH_MS);
  }, [runPassiveSessionRefresh]);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const runAuthBootstrap = useCallback(async (reuseInFlight = false) => {
    const requestVersion = ++authStateVersionRef.current;
    setLoading(true);
    try {
      const state = await loadAuthBootstrapState(bootstrapMode, reuseInFlight);
      if (requestVersion !== authStateVersionRef.current) {
        return;
      }
      applyBootstrapState(state);
    } finally {
      if (requestVersion === authStateVersionRef.current) {
        setLoading(false);
      }
    }
  }, [applyBootstrapState, bootstrapMode]);

  const refreshAuth = useCallback(async () => {
    await runAuthBootstrap(false);
  }, [runAuthBootstrap]);

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
        void runPassiveSessionRefresh();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [authenticated, authEnabled, runPassiveSessionRefresh]);

  useEffect(() => {
    void runAuthBootstrap(true);
  }, [runAuthBootstrap]);

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
        authMutationInFlightRef.current = true;
        authStateVersionRef.current += 1;
        try {
          const session = await api.auth.login({
            username: nextUsername,
            password,
            session_duration: sessionDuration,
          });
          setLoading(false);
          applySessionState(session);
        } finally {
          authMutationInFlightRef.current = false;
        }
      },
      logout: async () => {
        authMutationInFlightRef.current = true;
        authStateVersionRef.current += 1;
        try {
          const session = await api.auth.logout();
          setLoading(false);
          applySessionState(session);
        } finally {
          authMutationInFlightRef.current = false;
        }
      },
    }),
    [authEnabled, authenticated, loading, username, refreshAuth, applySessionState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
