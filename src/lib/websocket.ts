/**
 * WebSocket client for realtime dashboard updates.
 * Handles connection, reconnection, and message routing.
 */

export type RealtimeMessage =
  | { type: 'authenticated'; username: string }
  | { type: 'unauthenticated'; message: string }
  | { type: 'heartbeat' }
  | { type: 'subscribed'; profile_id: number; channel: string }
  | { type: 'unsubscribed' }
  | { type: 'dashboard.dirty'; sections: string[] }
  | { type: 'error'; message: string }
  | { type: 'pong' };

export type RealtimeEventHandler = (message: RealtimeMessage) => void;

export interface WebSocketClientOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private heartbeatInterval: number;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private handlers: Set<RealtimeEventHandler> = new Set();
  private isIntentionallyClosed = false;
  private currentProfileId: number | null = null;
  private currentChannel: string | null = null;

  constructor(options: WebSocketClientOptions = {}) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = options.url || `${protocol}//${host}/api/realtime/ws`;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        // Re-subscribe if we were subscribed before
        if (this.currentProfileId && this.currentChannel) {
          this.subscribe(this.currentProfileId, this.currentChannel);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.stopHeartbeat();

        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.currentProfileId = null;
    this.currentChannel = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(profileId: number, channel: string = 'dashboard'): void {
    this.currentProfileId = profileId;
    this.currentChannel = channel;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        profile_id: profileId,
        channel,
      });
    }
  }

  unsubscribe(): void {
    this.currentProfileId = null;
    this.currentChannel = null;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'unsubscribe' });
    }
  }

  on(handler: RealtimeEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(message: RealtimeMessage): void {
    // Handle heartbeat internally
    if (message.type === 'heartbeat') {
      this.send({ type: 'pong' });
    }

    // Notify all handlers
    this.handlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('[WebSocket] Handler error:', error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.min(this.reconnectAttempts, 5);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Global WebSocket client instance
let globalClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!globalClient) {
    globalClient = new WebSocketClient();
  }
  return globalClient;
}
