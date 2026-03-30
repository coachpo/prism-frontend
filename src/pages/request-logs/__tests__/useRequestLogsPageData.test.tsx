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
  stats: {
    requests: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));

function createState(overrides: Partial<RequestLogPageState> = {}): RequestLogPageState {
  return {
    ingress_request_id: "",
    model_id: "",
    api_family: "",
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
    api.endpoints.list.mockResolvedValue([]);
    api.endpoints.connections.mockResolvedValue({ items: [] });
    api.stats.requests.mockResolvedValue({
      items: [],
      total: 0,
      limit: 100,
      offset: 0,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("does not send request_id to the list endpoint after the split", async () => {
    renderHook(() =>
      useRequestLogsPageData({
        revision: 1,
        state: createState({
          ingress_request_id: "ingress_req_42",
          model_id: "gpt-5.4",
          api_family: "openai",
          connection_id: "42",
          endpoint_id: "99",
          status_family: "5xx",
          request_id: "123",
          limit: 300,
          offset: 600,
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
      api_family: "openai",
      status_family: "5xx",
      connection_id: 42,
      endpoint_id: 99,
      from_time: expect.any(String),
      limit: 300,
      offset: 600,
    });
  });

  it("propagates ingress_request_id alongside other server-backed filters", async () => {
    renderHook(() =>
      useRequestLogsPageData({
        revision: 1,
        state: createState({
          ingress_request_id: "ingress_req_42",
          model_id: "gpt-5.4",
          api_family: "openai",
          connection_id: "42",
          endpoint_id: "99",
          status_family: "5xx",
          limit: 300,
          offset: 600,
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
      api_family: "openai",
      status_family: "5xx",
      connection_id: 42,
      endpoint_id: 99,
      from_time: expect.any(String),
      limit: 300,
      offset: 600,
    });
  });
});
