import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import type { RequestLogEntry } from "@/lib/types";
import type { RealtimeMessage } from "@/lib/websocket";

type MockHandler = (message: RealtimeMessage) => void;

const handlers = new Set<MockHandler>();
const channelCounts = new Map<string, number>();

let mockConnected = true;
let mockConnectionState: "connected" | "reconnecting" | "connecting" | "disconnected" =
  "connected";

const mockClient = {
  connect: vi.fn(),
  subscribeChannel: vi.fn((profileId: number, channel: string) => {
    if (profileId <= 0) {
      return;
    }

    channelCounts.set(channel, (channelCounts.get(channel) ?? 0) + 1);
  }),
  unsubscribeChannel: vi.fn((channel: string) => {
    const nextCount = Math.max(0, (channelCounts.get(channel) ?? 0) - 1);
    if (nextCount === 0) {
      channelCounts.delete(channel);
      return;
    }

    channelCounts.set(channel, nextCount);
  }),
  on: vi.fn((handler: MockHandler) => {
    handlers.add(handler);
    return () => handlers.delete(handler);
  }),
  isConnected: vi.fn(() => mockConnected),
  getConnectionState: vi.fn(() => mockConnectionState),
  hasChannelSubscription: vi.fn((channel: string, profileId: number | null) => {
    return profileId !== null && (channelCounts.get(channel) ?? 0) > 0;
  }),
};

vi.mock("@/lib/websocket", async () => {
  const actual = await vi.importActual<typeof import("@/lib/websocket")>(
    "@/lib/websocket"
  );

  return {
    ...actual,
    getWebSocketClient: () => mockClient,
  };
});

function emit(message: RealtimeMessage) {
  act(() => {
    handlers.forEach((handler) => handler(message));
  });
}

function makeRequestLog(overrides: Partial<RequestLogEntry> = {}): RequestLogEntry {
  return {
    id: 101,
    model_id: "gpt-4o-mini",
    profile_id: 1,
    provider_type: "openai",
    endpoint_id: 2,
    connection_id: 3,
    endpoint_base_url: "https://api.openai.com/v1",
    endpoint_description: "Primary endpoint",
    status_code: 200,
    response_time_ms: 120,
    is_stream: false,
    input_tokens: 10,
    output_tokens: 15,
    total_tokens: 25,
    success_flag: true,
    billable_flag: true,
    priced_flag: true,
    unpriced_reason: null,
    cache_read_input_tokens: null,
    cache_creation_input_tokens: null,
    reasoning_tokens: null,
    input_cost_micros: 10,
    output_cost_micros: 15,
    cache_read_input_cost_micros: null,
    cache_creation_input_cost_micros: null,
    reasoning_cost_micros: null,
    total_cost_original_micros: 25,
    total_cost_user_currency_micros: 25,
    currency_code_original: "USD",
    report_currency_code: "USD",
    report_currency_symbol: "$",
    fx_rate_used: null,
    fx_rate_source: null,
    pricing_snapshot_unit: null,
    pricing_snapshot_input: null,
    pricing_snapshot_output: null,
    pricing_snapshot_cache_read_input: null,
    pricing_snapshot_cache_creation_input: null,
    pricing_snapshot_reasoning: null,
    pricing_snapshot_missing_special_token_price_policy: null,
    pricing_config_version_used: 1,
    request_path: "/v1/chat/completions",
    error_detail: null,
    created_at: "2026-03-13T12:00:00Z",
    ...overrides,
  };
}

describe("useRealtimeData", () => {
  beforeEach(() => {
    mockConnected = true;
    mockConnectionState = "connected";
    handlers.clear();
    channelCounts.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("fires onData for pushed payload messages", () => {
    const onData = vi.fn();
    const requestLog = makeRequestLog();

    const { result } = renderHook(() =>
      useRealtimeData({
        profileId: 1,
        channel: "dashboard",
        onData,
      })
    );

    emit({ type: "dashboard.update", request_log: requestLog });

    expect(onData).toHaveBeenCalledWith(requestLog);
    expect(result.current.lastData).toEqual(requestLog);
  });

  it("fires onDirty for dashboard dirty fallback messages", () => {
    const onDirty = vi.fn();

    renderHook(() =>
      useRealtimeData({
        profileId: 1,
        channel: "dashboard",
        onDirty,
      })
    );

    emit({ type: "dashboard.dirty" });

    expect(onDirty).toHaveBeenCalledTimes(1);
  });

  it("fires onReconnect for synthetic reconnect messages", () => {
    const onReconnect = vi.fn();
    const { result } = renderHook(() =>
      useRealtimeData({
        profileId: 1,
        channel: "dashboard",
        onReconnect,
      })
    );

    emit({ type: "reconnected" });

    expect(onReconnect).toHaveBeenCalledTimes(1);
    expect(result.current.isSyncing).toBe(true);
  });

  it("buffers pushed payloads during sync until markSyncComplete is called", () => {
    const onData = vi.fn();
    const requestLog = makeRequestLog({ id: 202 });

    const { result } = renderHook(() =>
      useRealtimeData({
        profileId: 1,
        channel: "dashboard",
        onData,
        onReconnect: vi.fn(),
      })
    );

    emit({ type: "reconnected" });
    emit({ type: "dashboard.update", request_log: requestLog });

    expect(onData).not.toHaveBeenCalled();

    act(() => {
      result.current.markSyncComplete();
    });

    expect(onData).toHaveBeenCalledWith(requestLog);
    expect(result.current.isSyncing).toBe(false);
  });

  it("keeps a shared channel subscribed while another hook instance remains mounted", () => {
    const firstHook = renderHook(() =>
      useRealtimeData({
        profileId: 1,
        channel: "dashboard",
      })
    );
    const secondHook = renderHook(() =>
      useRealtimeData({
        profileId: 1,
        channel: "dashboard",
      })
    );

    expect(channelCounts.get("dashboard")).toBe(2);

    firstHook.unmount();

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(channelCounts.get("dashboard")).toBe(1);
    expect(secondHook.result.current.isSubscribed).toBe(true);
  });
});
