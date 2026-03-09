import { createContext } from "react";

export type AuthContextValue = {
  authEnabled: boolean;
  authenticated: boolean;
  loading: boolean;
  username: string | null;
  refreshAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
