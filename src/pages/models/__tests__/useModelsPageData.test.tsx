import { StrictMode, type ReactNode } from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useModelsPageData } from "../useModelsPageData";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const api = vi.hoisted(() => ({
  models: {
    create: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  },
  providers: {
    list: vi.fn(),
  },
  stats: {
    modelMetrics: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function StrictWrapper({ children }: { children: ReactNode }) {
  return <StrictMode>{children}</StrictMode>;
}

describe("useModelsPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.models.list.mockResolvedValue([
      {
        id: 1,
        provider_id: 10,
        provider: { id: 10, provider_type: "openai", audit_enabled: false, created_at: "", updated_at: "" },
        model_id: "gpt-5.4",
        display_name: "GPT-5.4",
        model_type: "native",
        redirect_to: null,
        lb_strategy: "single",
        is_enabled: true,
        failover_recovery_enabled: true,
        failover_recovery_cooldown_seconds: 60,
        connection_count: 1,
        active_connection_count: 1,
        health_success_rate: 100,
        health_total_requests: 10,
        created_at: "",
        updated_at: "",
      },
    ]);
    api.providers.list.mockResolvedValue([
      { id: 10, provider_type: "openai", audit_enabled: false, created_at: "", updated_at: "" },
    ]);
    api.stats.modelMetrics.mockResolvedValue({
      items: [
        {
          model_id: "gpt-5.4",
          success_rate: 99.5,
          request_count_24h: 12,
          p95_latency_ms: 880,
          spend_30d_micros: 123456,
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("deduplicates StrictMode bootstrap fetches and uses batch metrics", async () => {
    const { result } = renderHook(() => useModelsPageData(1), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.metricsLoading).toBe(false);
    });

    expect(api.models.list).toHaveBeenCalledTimes(1);
    expect(api.providers.list).toHaveBeenCalledTimes(1);
    expect(api.stats.modelMetrics).toHaveBeenCalledTimes(1);
    expect(api.stats.modelMetrics).toHaveBeenCalledWith({
      model_ids: ["gpt-5.4"],
      summary_window_hours: 24,
      spending_preset: "last_30_days",
    });
    expect(result.current.modelMetrics24h[1]).toEqual({
      success_rate: 99.5,
      request_count_24h: 12,
      p95_latency_ms: 880,
    });
    expect(result.current.modelSpend30dMicros[1]).toBe(123456);
  });

  it("ignores stale in-flight bootstrap results after revision changes", async () => {
    const deferredModels = createDeferred<Parameters<typeof api.models.list.mockResolvedValue>[0]>();
    const deferredProviders = createDeferred<Parameters<typeof api.providers.list.mockResolvedValue>[0]>();

    api.models.list
      .mockImplementationOnce(() => deferredModels.promise)
      .mockResolvedValueOnce([
        {
          id: 2,
          provider_id: 20,
          provider: { id: 20, provider_type: "anthropic", audit_enabled: false, created_at: "", updated_at: "" },
          model_id: "claude-sonnet-4-6",
          display_name: "Claude Sonnet 4.6",
          model_type: "native",
          redirect_to: null,
          lb_strategy: "single",
          is_enabled: true,
          failover_recovery_enabled: true,
          failover_recovery_cooldown_seconds: 60,
          connection_count: 1,
          active_connection_count: 1,
          health_success_rate: 100,
          health_total_requests: 5,
          created_at: "",
          updated_at: "",
        },
      ]);
    api.providers.list
      .mockImplementationOnce(() => deferredProviders.promise)
      .mockResolvedValueOnce([
        { id: 20, provider_type: "anthropic", audit_enabled: false, created_at: "", updated_at: "" },
      ]);
    api.stats.modelMetrics.mockImplementation(({ model_ids }: { model_ids: string[] }) =>
      Promise.resolve({
        items: model_ids.map((modelId) => ({
          model_id: modelId,
          success_rate: modelId === "claude-sonnet-4-6" ? 97 : 99.5,
          request_count_24h: modelId === "claude-sonnet-4-6" ? 8 : 12,
          p95_latency_ms: modelId === "claude-sonnet-4-6" ? 640 : 880,
          spend_30d_micros: modelId === "claude-sonnet-4-6" ? 456789 : 123456,
        })),
      })
    );

    const { result, rerender } = renderHook(({ revision }) => useModelsPageData(revision), {
      initialProps: { revision: 1 },
      wrapper: StrictWrapper,
    });

    rerender({ revision: 2 });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.models[0]?.id).toBe(2);
    });

    deferredModels.resolve([
      {
        id: 1,
        provider_id: 10,
        provider: { id: 10, provider_type: "openai", audit_enabled: false, created_at: "", updated_at: "" },
        model_id: "gpt-5.4",
        display_name: "GPT-5.4",
        model_type: "native",
        redirect_to: null,
        lb_strategy: "single",
        is_enabled: true,
        failover_recovery_enabled: true,
        failover_recovery_cooldown_seconds: 60,
        connection_count: 1,
        active_connection_count: 1,
        health_success_rate: 100,
        health_total_requests: 10,
        created_at: "",
        updated_at: "",
      },
    ]);
    deferredProviders.resolve([
      { id: 10, provider_type: "openai", audit_enabled: false, created_at: "", updated_at: "" },
    ]);

    await waitFor(() => {
      expect(result.current.models[0]?.id).toBe(2);
      expect(result.current.providers[0]?.id).toBe(20);
      expect(result.current.modelSpend30dMicros[2]).toBe(456789);
    });
  });
});
