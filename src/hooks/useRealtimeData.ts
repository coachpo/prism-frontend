import { useCallback, useEffect, useRef, useState } from "react";
import {
  getWebSocketClient,
  type ConnectionState,
  type RealtimeChannel,
  type RealtimeChannelPayloadMap,
  type RealtimeMessage,
} from "@/lib/websocket";

type BufferedEvent<TData> = { type: "data"; payload: TData };

const DIRTY_MESSAGE_TYPES: Record<RealtimeChannel, RealtimeMessage["type"]> = {
  dashboard: "dashboard.dirty",
  statistics: "statistics.dirty",
};

const CHANNEL_PAYLOAD_EXTRACTORS: {
  [K in RealtimeChannel]: (
    message: RealtimeMessage
  ) => RealtimeChannelPayloadMap[K] | null;
} = {
  dashboard: (message) =>
    message.type === "dashboard.update" ? message.request_log : null,
  statistics: (message) =>
    message.type === "statistics.new" ? message.request_log : null,
};

export interface UseRealtimeDataOptions<
  TChannel extends RealtimeChannel = "dashboard",
> {
  profileId: number | null;
  channel?: TChannel;
  enabled?: boolean;
  onDirty?: () => void;
  onData?: (payload: RealtimeChannelPayloadMap[TChannel]) => void;
  onReconnect?: () => void;
}

export interface UseRealtimeDataReturn<TData> {
  isConnected: boolean;
  isSubscribed: boolean;
  isSyncing: boolean;
  connectionState: ConnectionState;
  lastMessage: RealtimeMessage | null;
  lastData: TData | null;
  markSyncComplete: () => void;
}

export function useRealtimeData<TChannel extends RealtimeChannel = "dashboard">(
  options: UseRealtimeDataOptions<TChannel>
): UseRealtimeDataReturn<RealtimeChannelPayloadMap[TChannel]> {
  const { profileId, channel = "dashboard" as TChannel, enabled = true, onDirty, onData, onReconnect } = options;
  const client = getWebSocketClient();
  const onDirtyRef = useRef(onDirty);
  const onDataRef = useRef(onData);
  const onReconnectRef = useRef(onReconnect);
  const isSyncingRef = useRef(false);
  const pendingDirtyRef = useRef(false);
  const pendingEventsRef = useRef<
    BufferedEvent<RealtimeChannelPayloadMap[TChannel]>[]
  >([]);

  const [isConnected, setIsConnected] = useState(client.isConnected());
  const [isSubscribed, setIsSubscribed] = useState(
    client.hasChannelSubscription(channel, profileId)
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionState, setConnectionState] = useState(client.getConnectionState());
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [lastData, setLastData] = useState<
    RealtimeChannelPayloadMap[TChannel] | null
  >(null);

  useEffect(() => {
    onDirtyRef.current = onDirty;
  }, [onDirty]);

  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  const markSyncComplete = useCallback(() => {
    isSyncingRef.current = false;
    setIsSyncing(false);

    const pendingEvents = pendingEventsRef.current;
    pendingEventsRef.current = [];

    for (const pendingEvent of pendingEvents) {
      onDataRef.current?.(pendingEvent.payload);
    }

    if (pendingDirtyRef.current) {
      pendingDirtyRef.current = false;
      onDirtyRef.current?.();
    }
  }, [setIsSyncing]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleMessage = (message: RealtimeMessage) => {
      setLastMessage(message);
      setIsConnected(client.isConnected());
      setConnectionState(client.getConnectionState());

      if (
        message.type === "subscribed" &&
        message.channel === channel &&
        message.profile_id === profileId
      ) {
        setIsSubscribed(true);
        return;
      }

      if (
        message.type === "unsubscribed" &&
        (message.channel === undefined || message.channel === channel)
      ) {
        setIsSubscribed(false);
        return;
      }

      if (message.type === "reconnected") {
        isSyncingRef.current = true;
        setIsSyncing(true);
        onReconnectRef.current?.();
        return;
      }

      if (message.type === DIRTY_MESSAGE_TYPES[channel]) {
        if (isSyncingRef.current) {
          pendingDirtyRef.current = true;
        } else {
          onDirtyRef.current?.();
        }
        return;
      }

      const payload = CHANNEL_PAYLOAD_EXTRACTORS[channel](message);
      if (payload !== null) {
        setLastData(payload);

        if (isSyncingRef.current) {
          pendingEventsRef.current.push({ type: "data", payload });
          return;
        }

        onDataRef.current?.(payload);
      }
    };

    const unsubscribeHandler = client.on(handleMessage);
    client.connect();

    const statusTimer = setInterval(() => {
      setIsConnected(client.isConnected());
      setConnectionState(client.getConnectionState());
      setIsSubscribed(client.hasChannelSubscription(channel, profileId));
    }, 500);

    if (profileId !== null) {
      client.subscribeChannel(profileId, channel);
    }

    return () => {
      clearInterval(statusTimer);
      unsubscribeHandler();
      isSyncingRef.current = false;
      pendingDirtyRef.current = false;
      pendingEventsRef.current = [];
      setIsSyncing(false);

      if (profileId !== null) {
        client.unsubscribeChannel(channel);
      }
    };
  }, [channel, client, enabled, markSyncComplete, profileId]);

  return {
    isConnected,
    isSubscribed: enabled ? isSubscribed : false,
    isSyncing,
    connectionState,
    lastMessage,
    lastData,
    markSyncComplete,
  };
}
