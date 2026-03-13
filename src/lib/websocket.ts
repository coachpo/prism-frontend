import type { LoadbalanceEvent, RequestLogEntry } from "@/lib/types";

export type RealtimeChannel =
  | "dashboard"
  | "request_logs"
  | "statistics"
  | "loadbalance_events";

export interface RealtimeChannelPayloadMap {
  dashboard: RequestLogEntry;
  request_logs: RequestLogEntry;
  statistics: RequestLogEntry;
  loadbalance_events: LoadbalanceEvent;
}

export type RealtimeMessage =
  | { type: "authenticated"; username: string }
  | { type: "unauthenticated"; message: string }
  | { type: "heartbeat" }
  | { type: "subscribed"; profile_id: number; channel: RealtimeChannel }
  | { type: "unsubscribed"; channel?: RealtimeChannel }
  | { type: "dashboard.update"; request_log: RequestLogEntry }
  | { type: "request_logs.new"; request_log: RequestLogEntry }
  | { type: "statistics.new"; request_log: RequestLogEntry }
  | { type: "loadbalance_events.new"; event: LoadbalanceEvent }
  | { type: "request_logs.audit_ready"; request_log_id: number; audit_log_id: number }
  | { type: "reconnected" }
  | { type: "dashboard.dirty" }
  | { type: "statistics.dirty" }
  | { type: "request_logs.dirty" }
  | { type: "loadbalance_events.dirty" }
  | { type: "error"; message: string }
  | { type: "pong" };

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type RealtimeEventHandler = (message: RealtimeMessage) => void;

export interface WebSocketClientOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly reconnectInterval: number;
  private readonly maxReconnectAttempts: number;
  private readonly heartbeatInterval: number;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly handlers: Set<RealtimeEventHandler> = new Set();
  private isIntentionallyClosed = false;
  private currentProfileId: number | null = null;
  private channelRefCounts = new Map<RealtimeChannel, number>();
  private connectionState: ConnectionState = "disconnected";
  private hasConnectedOnce = false;
  private shouldEmitReconnect = false;

  constructor(options: WebSocketClientOptions = {}) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.url = options.url || `${protocol}//${host}/api/realtime/ws`;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
  }

  connect(): void {
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setConnectionState(
      this.hasConnectedOnce || this.reconnectAttempts > 0
        ? "reconnecting"
        : "connecting"
    );

    try {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      ws.onopen = () => {
        if (this.ws !== ws) {
          return;
        }

        const isReconnect = this.shouldEmitReconnect;
        this.shouldEmitReconnect = false;
        this.hasConnectedOnce = true;
        this.reconnectAttempts = 0;
        this.setConnectionState("connected");
        this.startHeartbeat();
        this.resubscribeAll();

        if (isReconnect) {
          this.emit({ type: "reconnected" });
        }
      };

      ws.onmessage = (event) => {
        if (this.ws !== ws) {
          return;
        }

        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        if (this.ws !== ws) {
          return;
        }

        console.error("[WebSocket] Error:", error);
      };

      ws.onclose = () => {
        if (this.ws !== ws) {
          return;
        }

        console.log("[WebSocket] Disconnected");
        this.stopHeartbeat();
        this.ws = null;

        if (
          !this.isIntentionallyClosed &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.shouldEmitReconnect = this.hasConnectedOnce;
          this.setConnectionState("reconnecting");
          this.scheduleReconnect();
          return;
        }

        this.setConnectionState("disconnected");
      };
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error);
      this.shouldEmitReconnect = this.hasConnectedOnce;
      this.setConnectionState("reconnecting");
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.currentProfileId = null;
    this.channelRefCounts.clear();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();
    this.setConnectionState("disconnected");

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribeChannel(profileId: number, channel: RealtimeChannel): void {
    if (this.currentProfileId !== null && this.currentProfileId !== profileId) {
      this.setProfile(profileId);
    } else {
      this.currentProfileId = profileId;
    }

    const currentCount = this.channelRefCounts.get(channel) ?? 0;
    this.channelRefCounts.set(channel, currentCount + 1);

    if (currentCount === 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "subscribe", profile_id: profileId, channel });
    }
  }

  unsubscribeChannel(channel: RealtimeChannel): void {
    const currentCount = this.channelRefCounts.get(channel) ?? 0;
    if (currentCount === 0) {
      return;
    }

    if (currentCount === 1) {
      this.channelRefCounts.delete(channel);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: "unsubscribe_channel", channel });
      }
    } else {
      this.channelRefCounts.set(channel, currentCount - 1);
    }

    if (this.channelRefCounts.size === 0) {
      this.currentProfileId = null;
    }
  }

  unsubscribe(): void {
    this.channelRefCounts.clear();
    this.currentProfileId = null;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "unsubscribe" });
    }
  }

  setProfile(profileId: number): void {
    if (profileId === this.currentProfileId) {
      return;
    }

    const channels = [...this.channelRefCounts.keys()];
    const previousProfileId = this.currentProfileId;
    this.currentProfileId = profileId;

    if (this.ws?.readyState !== WebSocket.OPEN || previousProfileId === null) {
      return;
    }

    for (const channel of channels) {
      this.send({ type: "unsubscribe_channel", channel });
    }

    this.resubscribeAll();
  }

  on(handler: RealtimeEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  hasChannelSubscription(channel: RealtimeChannel, profileId: number | null): boolean {
    if (profileId === null || this.currentProfileId !== profileId) {
      return false;
    }

    return (this.channelRefCounts.get(channel) ?? 0) > 0;
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(message: RealtimeMessage): void {
    if (message.type === "heartbeat") {
      this.send({ type: "pong" });
    }

    this.emit(message);
  }

  private emit(message: RealtimeMessage): void {
    this.handlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error("[WebSocket] Handler error:", error);
      }
    });
  }

  private resubscribeAll(): void {
    if (this.currentProfileId === null || this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    for (const channel of this.channelRefCounts.keys()) {
      this.send({
        type: "subscribe",
        profile_id: this.currentProfileId,
        channel,
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectInterval * Math.min(this.reconnectAttempts, 5);

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "ping" });
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setConnectionState(nextState: ConnectionState): void {
    this.connectionState = nextState;
  }
}

let globalClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!globalClient) {
    globalClient = new WebSocketClient();
  }
  return globalClient;
}
