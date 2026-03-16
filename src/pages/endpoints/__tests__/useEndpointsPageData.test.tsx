import { StrictMode, type ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DragEndEvent } from "@dnd-kit/core";
import { clearSharedReferenceData } from "@/lib/referenceData";
import { useEndpointsPageData } from "../useEndpointsPageData";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const api = vi.hoisted(() => ({
  endpoints: {
    create: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
    list: vi.fn(),
    movePosition: vi.fn(),
    update: vi.fn(),
  },
  models: {
    byEndpoints: vi.fn(),
  },
}));

const revisionState = vi.hoisted(() => ({ value: 1 }));

vi.mock("@/lib/api", () => ({ api }));
vi.mock("@/context/ProfileContext", () => ({
  useProfileContext: () => ({ revision: revisionState.value }),
}));
vi.mock("@/hooks/useTimezone", () => ({
  useTimezone: () => ({ format: vi.fn(() => "formatted") }),
}));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

function StrictWrapper({ children }: { children: ReactNode }) {
  return <StrictMode>{children}</StrictMode>;
}

function buildEndpoint(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    profile_id: 1,
    name: "Primary",
    base_url: "https://api.openai.com/v1",
    has_api_key: true,
    masked_api_key: "sk-***",
    position: 0,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function createDragEndEvent(activeId: number, overId: number): DragEndEvent {
  return {
    activatorEvent: new Event("pointerdown"),
    active: {
      id: activeId,
      data: { current: undefined },
      rect: { current: { initial: null, translated: null } },
    },
    collisions: null,
    delta: { x: 0, y: 0 },
    over: {
      id: overId,
      rect: { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 },
      disabled: false,
      data: { current: undefined },
    },
  };
}

describe("useEndpointsPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSharedReferenceData();
    revisionState.value = 1;
    api.endpoints.list.mockResolvedValue([buildEndpoint()]);
    api.models.byEndpoints.mockResolvedValue({
      items: [
        {
          endpoint_id: 10,
          models: [
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
          ],
        },
      ],
    });
  });

  afterEach(() => {
    clearSharedReferenceData();
    cleanup();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("deduplicates StrictMode bootstrap fetches and batches endpoint models", async () => {
    const { result } = renderHook(() => useEndpointsPageData(), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.endpoints.list).toHaveBeenCalledTimes(1);
    expect(api.models.byEndpoints).toHaveBeenCalledTimes(1);
    expect(api.models.byEndpoints).toHaveBeenCalledWith({ endpoint_ids: [10] });
    expect(result.current.endpoints).toHaveLength(1);
    expect(result.current.endpointModels[10]).toHaveLength(1);
    expect(result.current.totalAttachedModels).toBe(1);
    expect(result.current.endpointsInUse).toBe(1);
  });

  it("ignores stale in-flight bootstrap results after revision changes", async () => {
    const deferredEndpoints = createDeferred<Parameters<typeof api.endpoints.list.mockResolvedValue>[0]>();

    api.endpoints.list
      .mockImplementationOnce(() => deferredEndpoints.promise)
      .mockResolvedValueOnce([
        buildEndpoint({
          id: 20,
          profile_id: 2,
          name: "Secondary",
          base_url: "https://api.anthropic.com/v1",
        }),
      ]);
    api.models.byEndpoints.mockImplementation(({ endpoint_ids }) =>
      Promise.resolve({
        items: endpoint_ids.map((endpointId: number) => ({
          endpoint_id: endpointId,
          models:
            endpointId === 20
              ? [
                  {
                    id: 2,
                    provider_id: 20,
                    provider: {
                      id: 20,
                      provider_type: "anthropic",
                      audit_enabled: false,
                      created_at: "",
                      updated_at: "",
                    },
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
                ]
              : [],
        })),
      })
    );

    const { result, rerender } = renderHook(() => useEndpointsPageData(), { wrapper: StrictWrapper });

    revisionState.value = 2;
    rerender();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.endpoints[0]?.id).toBe(20);
    });

    deferredEndpoints.resolve([
      buildEndpoint(),
    ]);

    await waitFor(() => {
      expect(result.current.endpoints[0]?.id).toBe(20);
      expect(result.current.endpointModels[20]).toHaveLength(1);
      expect(result.current.endpointModels[10]).toBeUndefined();
    });
  });

  it("keeps the new profile's endpoints when batched model loading fails", async () => {
    const { result, rerender } = renderHook(() => useEndpointsPageData(), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.endpoints[0]?.id).toBe(10);
      expect(result.current.endpointModels[10]).toHaveLength(1);
    });

    api.endpoints.list.mockResolvedValueOnce([
      buildEndpoint({
        id: 20,
        profile_id: 2,
        name: "Secondary",
        base_url: "https://api.anthropic.com/v1",
      }),
    ]);
    api.models.byEndpoints.mockRejectedValueOnce(new Error("batch failed"));

    revisionState.value = 2;
    rerender();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.endpoints[0]?.id).toBe(20);
      expect(result.current.endpointModels[20]).toBeUndefined();
      expect(result.current.totalAttachedModels).toBe(0);
      expect(result.current.endpointsInUse).toBe(0);
    });
  });

  it("duplicates and deletes endpoints while keeping local state in sync", async () => {
    api.endpoints.duplicate.mockResolvedValue(
      buildEndpoint({ id: 11, name: "Primary Copy", position: 1 })
    );
    api.endpoints.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useEndpointsPageData(), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDuplicateEndpoint(result.current.endpoints[0]);
    });

    expect(api.endpoints.duplicate).toHaveBeenCalledWith(10);
    expect(result.current.endpoints.map((endpoint) => endpoint.id)).toEqual([10, 11]);
    expect(result.current.endpointModels[11]).toEqual([]);
    expect(result.current.duplicatingEndpointId).toBeNull();

    act(() => {
      result.current.setDeleteTarget(result.current.endpoints[0]);
    });

    await act(async () => {
      await result.current.handleDelete(10);
    });

    expect(api.endpoints.delete).toHaveBeenCalledWith(10);
    expect(result.current.endpoints.map((endpoint) => endpoint.id)).toEqual([11]);
    expect(result.current.endpointModels[10]).toBeUndefined();
  });

  it("reorders endpoints and rolls back when movePosition fails", async () => {
    api.endpoints.list.mockResolvedValueOnce([
      buildEndpoint({ id: 10, position: 0 }),
      buildEndpoint({ id: 20, name: "Secondary", base_url: "https://api.anthropic.com/v1", position: 1 }),
    ]);
    api.models.byEndpoints.mockResolvedValueOnce({ items: [] });
    api.endpoints.movePosition.mockResolvedValueOnce([
      buildEndpoint({ id: 20, name: "Secondary", base_url: "https://api.anthropic.com/v1", position: 0 }),
      buildEndpoint({ id: 10, position: 1 }),
    ]);

    const { result } = renderHook(() => useEndpointsPageData(), { wrapper: StrictWrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.endpoints).toHaveLength(2);
    });

    await act(async () => {
      await result.current.handleDragEnd(createDragEndEvent(20, 10));
    });

    expect(api.endpoints.movePosition).toHaveBeenCalledWith(20, 0);
    expect(result.current.endpoints.map((endpoint) => endpoint.id)).toEqual([20, 10]);

    api.endpoints.movePosition.mockRejectedValueOnce(new Error("move failed"));

    await act(async () => {
      await result.current.handleDragEnd(createDragEndEvent(10, 20));
    });

    expect(result.current.endpoints.map((endpoint) => endpoint.id)).toEqual([20, 10]);
  });
});
