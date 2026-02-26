import type { TokenPairResponse } from "@/lib/types";

const REFRESH_TOKEN_STORAGE_KEY = "prism_v1_refresh_token";

let accessToken: string | null = null;

function hasWindow() {
  return typeof window !== "undefined";
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getRefreshToken() {
  if (!hasWindow()) {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setRefreshToken(token: string | null) {
  if (!hasWindow()) {
    return;
  }
  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    return;
  }
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function applyTokenPair(tokenPair: TokenPairResponse) {
  setAccessToken(tokenPair.access_token);
  setRefreshToken(tokenPair.refresh_token);
}

export function clearSessionTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}

export function getRefreshTokenStorageKey() {
  return REFRESH_TOKEN_STORAGE_KEY;
}
