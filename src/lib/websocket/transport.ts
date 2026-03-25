export type WebSocketLocationLike = Pick<Location, "protocol" | "host">;

export type WebSocketInitialConnectionState = "connecting" | "reconnecting";

export function createRealtimeWebSocketUrl(
  location: WebSocketLocationLike,
  overrideUrl?: string,
): string {
  if (overrideUrl) {
    return overrideUrl;
  }

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/api/realtime/ws`;
}

export function getInitialConnectionState({
  hasConnectedOnce,
  reconnectAttempts,
}: {
  hasConnectedOnce: boolean;
  reconnectAttempts: number;
}): WebSocketInitialConnectionState {
  return hasConnectedOnce || reconnectAttempts > 0 ? "reconnecting" : "connecting";
}

export function calculateReconnectDelay(
  reconnectInterval: number,
  reconnectAttempts: number,
): number {
  return reconnectInterval * Math.min(reconnectAttempts, 5);
}
