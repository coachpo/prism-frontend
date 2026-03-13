/**
 * React hook for realtime dashboard updates via WebSocket.
 * Automatically connects, subscribes to profile, and handles reconnection.
 */

import { useEffect, useRef, useState } from 'react';
import { getWebSocketClient, type RealtimeMessage } from '@/lib/websocket';

export interface UseRealtimeDataOptions {
  profileId: number | null;
  channel?: string;
  enabled?: boolean;
  onDirty?: () => void;
}

export interface UseRealtimeDataReturn {
  isConnected: boolean;
  isSubscribed: boolean;
  lastMessage: RealtimeMessage | null;
}

export function useRealtimeData(options: UseRealtimeDataOptions): UseRealtimeDataReturn {
  const { profileId, channel = 'dashboard', enabled = true, onDirty } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const clientRef = useRef(getWebSocketClient());
  const onDirtyRef = useRef(onDirty);

  // Keep onDirty ref up to date
  useEffect(() => {
    onDirtyRef.current = onDirty;
  }, [onDirty]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const client = clientRef.current;

    // Message handler
    const handleMessage = (message: RealtimeMessage) => {
      setLastMessage(message);

      if (message.type === 'subscribed') {
        setIsSubscribed(true);
      } else if (message.type === 'unsubscribed') {
        setIsSubscribed(false);
      } else if (message.type === `${channel}.dirty` && onDirtyRef.current) {
        onDirtyRef.current();
      }
    };

    // Register handler
    const unsubscribe = client.on(handleMessage);

    // Connect and subscribe
    client.connect();

    // Update connection status
    const checkConnection = setInterval(() => {
      setIsConnected(client.isConnected());
    }, 1000);

    // Subscribe to profile if provided
    if (profileId) {
      client.subscribe(profileId, channel);
    }

    // Cleanup
    return () => {
      clearInterval(checkConnection);
      unsubscribe();
      if (profileId) {
        client.unsubscribe();
      }
    };
  }, [profileId, channel, enabled]);

  return {
    isConnected,
    isSubscribed,
    lastMessage,
  };
}
