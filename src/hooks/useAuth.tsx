/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { applyTokenPair, clearSessionTokens, getRefreshToken } from "@/lib/auth";
import { api, ApiClientError } from "@/lib/api";
import type {
  AuthStatusResponse,
  EnableAuthRequest,
  LoginPasswordRequest,
  PasskeyLoginFinishRequest,
  TokenPairResponse,
} from "@/lib/types";

type AuthState = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  state: AuthState;
  authEnabled: boolean;
  hasPasskey: boolean;
  apiKeyCount: number;
  isAuthenticated: boolean;
  refreshStatus: () => Promise<void>;
  loginPassword: (body: LoginPasswordRequest) => Promise<void>;
  loginPasskey: (usernameOrEmail: string, credentialId: string) => Promise<void>;
  enableAuth: (body: EnableAuthRequest) => Promise<void>;
  applyTokenPair: (pair: TokenPairResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncAuthStatus() {
  const status = await api.auth.status();
  if (!status.auth_enabled) {
    clearSessionTokens();
    return {
      status,
      state: "unauthenticated" as AuthState,
    };
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return {
      status,
      state: "unauthenticated" as AuthState,
    };
  }

  try {
    const pair = await api.auth.refresh(refreshToken);
    applyTokenPair(pair);
    return {
      status,
      state: "authenticated" as AuthState,
    };
  } catch {
    clearSessionTokens();
    return {
      status,
      state: "unauthenticated" as AuthState,
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [status, setStatus] = useState<AuthStatusResponse>({
    auth_enabled: false,
    has_passkey: false,
    api_key_count: 0,
  });

  const refreshStatus = useCallback(async () => {
    setState("loading");
    const next = await syncAuthStatus();
    setStatus(next.status);
    setState(next.state);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const applyPair = useCallback((pair: TokenPairResponse) => {
    applyTokenPair(pair);
    setState("authenticated");
  }, []);

  const loginPassword = useCallback(async (body: LoginPasswordRequest) => {
    const pair = await api.auth.loginPassword(body);
    applyPair(pair);
    const latestStatus = await api.auth.status();
    setStatus(latestStatus);
  }, [applyPair]);

  const loginPasskey = useCallback(
    async (usernameOrEmail: string, credentialId: string) => {
      const begin = await api.auth.loginPasskeyBegin({ username_or_email: usernameOrEmail });
      const finishBody: PasskeyLoginFinishRequest = {
        challenge_id: begin.challenge_id,
        credential_id: credentialId,
      };
      const pair = await api.auth.loginPasskeyFinish(finishBody);
      applyPair(pair);
      const latestStatus = await api.auth.status();
      setStatus(latestStatus);
    },
    [applyPair],
  );

  const enableAuth = useCallback(
    async (body: EnableAuthRequest) => {
      const pair = await api.auth.setupEnable(body);
      applyPair(pair);
      const latestStatus = await api.auth.status();
      setStatus(latestStatus);
      toast.success("Authentication enabled");
    },
    [applyPair],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      if (error instanceof ApiClientError && error.status !== 401) {
        throw error;
      }
    } finally {
      clearSessionTokens();
      const latestStatus = await api.auth.status();
      setStatus(latestStatus);
      setState("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      authEnabled: status.auth_enabled,
      hasPasskey: status.has_passkey,
      apiKeyCount: status.api_key_count,
      isAuthenticated: state === "authenticated",
      refreshStatus,
      loginPassword,
      loginPasskey,
      enableAuth,
      applyTokenPair: applyPair,
      logout,
    }),
    [
      applyPair,
      loginPasskey,
      loginPassword,
      logout,
      refreshStatus,
      state,
      status.api_key_count,
      status.auth_enabled,
      status.has_passkey,
      enableAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
