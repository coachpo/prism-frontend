import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULTS, type RequestLogPageState } from "../queryParams";
import { useRequestLogsPageData } from "../useRequestLogsPageData";

const api = vi.hoisted(() => ({
  endpoints: {
    connections: vi.fn(),
    list: vi.fn(),
  },
  models: {
    list: vi.fn(),
  },
  providers: {
    list: vi.fn(),
  },
  stats: {
    requests: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));

function createState(overrides: Partial<RequestLogPageState> = {}): RequestLogPageState {
  return {
    ingress_request_id: "",
    model_id: "",
    provider_type: "",
    connection_id: "",
    endpoint_id: "",
    time_range: DEFAULTS.time_range,
    status_family: DEFAULTS.status_family,
    search: "",
    outcome_filter: DEFAULTS.outcome_filter,
    stream_filter: DEFAULTS.stream_filter,
    latency_bucket: DEFAULTS.latency_bucket,
    token_min: "",
    token_max: "",
    priced_only: DEFAULTS.priced_only,
    billable_only: DEFAULTS.billable_only,
    special_token_filter: "",
    view: DEFAULTS.view,
    triage: DEFAULTS.triage,
    limit: DEFAULTS.limit,
    offset: DEFAULTS.offset,
    request_id: "",
    detail_tab: DEFAULTS.detail_tab,
    ...overrides,
  };
}

describe("useRequestLogsPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    api.models.list.mockResolvedValue([]);
    api.providers.list.mockResolvedValue([]);
    api.endpoints.list.mockResolvedValue([]);
    api.endpoints.connections.mockResolvedValue({ items: [] });
    api.stats.requests.mockResolvedValue({
      items: [],
      total: 0,
      limit: 1,
      offset: 0,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("sends only request_id and limit during exact-request mode", async () => {
    renderHook(() =>
      useRequestLogsPageData({
        revision: 1,
        state: createState({
          model_id: "gpt-5.4",
          provider_type: "openai",
          connection_id: "42",
          endpoint_id: "99",
          status_family: "5xx",
          request_id: "123",
          limit: 25,
          offset: 50,
        }),
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(api.stats.requests).toHaveBeenCalledWith({ request_id: 123, limit: 1 });
  });

  it("propagates ingress_request_id alongside other server-backed filters", async () => {
    renderHook(() =>
      useRequestLogsPageData({
        revision: 1,
        state: createState({
          ingress_request_id: "ingress_req_42",
          model_id: "gpt-5.4",
          provider_type: "openai",
          connection_id: "42",
          endpoint_id: "99",
          status_family: "5xx",
          limit: 25,
          offset: 50,
        }),
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(api.stats.requests).toHaveBeenCalledWith({
      ingress_request_id: "ingress_req_42",
      model_id: "gpt-5.4",
      provider_type: "openai",
      status_family: "5xx",
      connection_id: 42,
      endpoint_id: 99,
      from_time: expect.any(String),
      limit: 25,
      offset: 50,
    });
  });
});
