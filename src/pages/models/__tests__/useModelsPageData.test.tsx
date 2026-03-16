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

function buildModelListItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    provider_id: 10,
    provider: buildProvider(),
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
    redirect_to: null,
    lb_strategy: "single",
    is_enabled: true,
    failover_recovery_enabled: true,
    failover_recovery_cooldown_seconds: 60,
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
        redirect_to: "gpt-5.4",
        lb_strategy: "single",
      })
    );

    const { result } = renderHook(() => useModelsPageData(1), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleOpenDialog();
      result.current.setFormData((current) => ({
        ...current,
        provider_id: 10,
        model_id: "friendly-proxy",
        display_name: "Friendly Proxy",
        model_type: "proxy",
        redirect_to: "gpt-5.4",
        lb_strategy: "failover",
        failover_recovery_enabled: false,
        failover_recovery_cooldown_seconds: 300,
      }));
    });

    const submitEvent = createSubmitEvent();
    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    expect(submitEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(api.models.create).toHaveBeenCalledWith({
      provider_id: 10,
      model_id: "friendly-proxy",
      display_name: "Friendly Proxy",
      model_type: "proxy",
      redirect_to: "gpt-5.4",
      lb_strategy: "single",
      is_enabled: true,
      failover_recovery_enabled: true,
      failover_recovery_cooldown_seconds: 60,
    });
    expect(result.current.models.some((model) => model.id === 3)).toBe(true);
  });

  it("normalizes native failover updates and deletes models", async () => {
    api.models.update.mockResolvedValue(
      buildModelConfig({
        display_name: null,
        lb_strategy: "single",
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
        lb_strategy: "single",
        failover_recovery_enabled: false,
        failover_recovery_cooldown_seconds: 999,
      }));
    });

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(api.models.update).toHaveBeenCalledWith(1, {
      provider_id: 10,
      display_name: null,
      model_type: "native",
      redirect_to: null,
      lb_strategy: "single",
      is_enabled: true,
      failover_recovery_enabled: true,
      failover_recovery_cooldown_seconds: 60,
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
});
