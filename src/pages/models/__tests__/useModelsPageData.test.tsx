import { StrictMode, type ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSharedReferenceData } from "@/lib/referenceData";
import { useModelsPageData } from "../useModelsPageData";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const api = vi.hoisted(() => ({
  loadbalanceStrategies: {
    list: vi.fn(),
  },
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

function buildProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    provider_type: "openai",
    audit_enabled: false,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function buildLoadbalanceStrategySummary(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    name: "single-primary",
    strategy_type: "single",
    failover_recovery_enabled: false,
    ...overrides,
  };
}

function buildLoadbalanceStrategy(overrides: Record<string, unknown> = {}) {
  return {
    ...buildLoadbalanceStrategySummary(overrides),
    profile_id: 1,
    attached_model_count: 1,
    created_at: "",
    updated_at: "",
  };
}

function buildModelListItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    provider_id: 10,
    provider: buildProvider(),
    model_id: "gpt-5.4",
    display_name: "GPT-5.4",
    model_type: "native",
    proxy_targets: [],
    loadbalance_strategy_id: 100,
    loadbalance_strategy: buildLoadbalanceStrategySummary(),
    is_enabled: true,
    connection_count: 1,
    active_connection_count: 1,
    health_success_rate: 100,
    health_total_requests: 10,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function buildModelConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    provider_id: 10,
    provider: buildProvider(),
    model_id: "gpt-5.4",
    display_name: "GPT-5.4",
    model_type: "native",
    proxy_targets: [],
    loadbalance_strategy_id: 100,
    loadbalance_strategy: buildLoadbalanceStrategySummary(),
    is_enabled: true,
    connections: [
      {
        id: 200,
        model_config_id: 1,
        endpoint_id: 10,
        endpoint: undefined,
        is_active: true,
        priority: 0,
        name: null,
        auth_type: null,
        custom_headers: null,
        pricing_template_id: null,
        pricing_template: null,
        health_status: "healthy",
        health_detail: null,
        last_health_check: null,
        created_at: "",
        updated_at: "",
      },
    ],
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function createSubmitEvent() {
  return {
    preventDefault: vi.fn(),
  };
}

describe("useModelsPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSharedReferenceData();
    document.documentElement.lang = "en";
    api.loadbalanceStrategies.list.mockResolvedValue([buildLoadbalanceStrategy()]);
    api.models.list.mockResolvedValue([buildModelListItem()]);
    api.providers.list.mockResolvedValue([buildProvider()]);
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
    clearSharedReferenceData();
    cleanup();
  });

  it("deduplicates StrictMode bootstrap fetches and uses batch metrics", async () => {
    const { result } = renderHook(() => useModelsPageData(1), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.modelMetrics24h[1]).toEqual({
        success_rate: 99.5,
        request_count_24h: 12,
        p95_latency_ms: 880,
      });
    });

    expect(api.models.list).toHaveBeenCalledTimes(1);
    expect(api.providers.list).toHaveBeenCalledTimes(1);
    expect(api.stats.modelMetrics).toHaveBeenCalledTimes(1);
    expect(api.stats.modelMetrics).toHaveBeenCalledWith({
      model_ids: ["gpt-5.4"],
      summary_window_hours: 24,
      spending_preset: "last_30_days",
    });
    expect(result.current.modelSpend30dMicros[1]).toBe(123456);
  });

  it("ignores stale in-flight bootstrap results after revision changes", async () => {
    const deferredModels = createDeferred<Parameters<typeof api.models.list.mockResolvedValue>[0]>();
    const deferredProviders = createDeferred<Parameters<typeof api.providers.list.mockResolvedValue>[0]>();

    api.models.list
      .mockImplementationOnce(() => deferredModels.promise)
      .mockResolvedValueOnce([
        buildModelListItem({
          id: 2,
          provider_id: 20,
          provider: buildProvider({ id: 20, provider_type: "anthropic" }),
          model_id: "claude-sonnet-4-6",
          display_name: "Claude Sonnet 4.6",
          health_total_requests: 5,
        }),
      ]);
    api.providers.list
      .mockImplementationOnce(() => deferredProviders.promise)
      .mockResolvedValueOnce([buildProvider({ id: 20, provider_type: "anthropic" })]);
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
      buildModelListItem(),
    ]);
    deferredProviders.resolve([buildProvider()]);

    await waitFor(() => {
      expect(result.current.models[0]?.id).toBe(2);
      expect(result.current.providers[0]?.id).toBe(20);
      expect(result.current.modelSpend30dMicros[2]).toBe(456789);
    });
  });

  it("normalizes proxy model creation payloads", async () => {
    api.models.create.mockResolvedValue(
      buildModelConfig({
        id: 3,
        model_id: "friendly-proxy",
        display_name: "Friendly Proxy",
        model_type: "proxy",
        proxy_targets: [{ target_model_id: "gpt-5.4", position: 0 }],
        loadbalance_strategy_id: null,
        loadbalance_strategy: null,
      })
    );

    const { result } = renderHook(() => useModelsPageData(1), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleOpenDialog();
      result.current.setFormData(
        (current) =>
          ({
            ...current,
            provider_id: 10,
            model_id: "friendly-proxy",
            display_name: "Friendly Proxy",
            model_type: "proxy",
            proxy_targets: [{ target_model_id: "gpt-5.4", position: 0 }],
            loadbalance_strategy_id: 100,
          }) as unknown as typeof current,
      );
    });

    const submitEvent = createSubmitEvent();
    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    expect(submitEvent.preventDefault).toHaveBeenCalledTimes(1);
    const createPayload = api.models.create.mock.calls[0]?.[0];

    expect(createPayload).toMatchObject({
      provider_id: 10,
      model_id: "friendly-proxy",
      display_name: "Friendly Proxy",
      model_type: "proxy",
      proxy_targets: [{ target_model_id: "gpt-5.4", position: 0 }],
      loadbalance_strategy_id: null,
      is_enabled: true,
    });
    expect(createPayload).not.toHaveProperty("redirect_to");
    expect(result.current.models.some((model) => model.id === 3)).toBe(true);
  });

  it("filters the visible model list using search only", async () => {
    api.models.list.mockResolvedValue([
      buildModelListItem(),
      buildModelListItem({
        id: 2,
        model_id: "claude-sonnet-4-6",
        display_name: "Claude Sonnet 4.6",
        provider_id: 20,
        provider: buildProvider({ id: 20, provider_type: "anthropic" }),
      }),
    ]);
    api.providers.list.mockResolvedValue([
      buildProvider(),
      buildProvider({ id: 20, provider_type: "anthropic" }),
    ]);

    const { result } = renderHook(() => useModelsPageData(1), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.filtered).toHaveLength(2);
    });

    act(() => {
      result.current.setSearch("claude");
    });

    expect(result.current.filtered.map((model) => model.model_id)).toEqual(["claude-sonnet-4-6"]);
  });

  it("normalizes native failover updates and deletes models", async () => {
    api.models.update.mockResolvedValue(
      buildModelConfig({
        display_name: null,
        loadbalance_strategy_id: 100,
        loadbalance_strategy: buildLoadbalanceStrategySummary(),
      })
    );
    api.models.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useModelsPageData(1), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleOpenDialog(result.current.models[0]);
      result.current.setFormData((current) => ({
        ...current,
        display_name: "",
        model_type: "native",
        loadbalance_strategy_id: 100,
      }));
    });

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(api.models.update).toHaveBeenCalledWith(1, {
      provider_id: 10,
      display_name: null,
      model_type: "native",
      proxy_targets: [],
      loadbalance_strategy_id: 100,
      is_enabled: true,
    });

    act(() => {
      result.current.setDeleteTarget(result.current.models[0]);
    });

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(api.models.delete).toHaveBeenCalledWith(1);
    expect(result.current.models).toHaveLength(0);
  });

  it("emits localized validation and success toasts when the locale is Chinese", async () => {
    document.documentElement.lang = "zh-CN";
    api.models.create.mockResolvedValue(buildModelConfig({ id: 3, model_id: "new-model" }));

    const { result } = renderHook(() => useModelsPageData(1), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleOpenDialog();
      result.current.setFormData((current) => ({ ...current, provider_id: 0 }));
    });

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect((await import("sonner")).toast.error).toHaveBeenCalledWith("请选择提供商");
  });
});
