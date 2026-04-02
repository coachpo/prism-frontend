import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MonitoringModelConnection, MonitoringModelResponse } from "@/lib/types";
import { useModelDetailMonitoring } from "../useModelDetailMonitoring";

function createDeferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

function buildConnection(overrides: Partial<MonitoringModelConnection> = {}): MonitoringModelConnection {
  return {
    connection_id: 5,
    connection_name: "Primary",
    endpoint_id: 2,
    endpoint_name: "Primary endpoint",
    endpoint_ping_status: "healthy",
    endpoint_ping_ms: 75,
    conversation_status: "healthy",
    conversation_delay_ms: 140,
    fused_status: "healthy",
    recent_history: [],
    ...overrides,
  };
}

function buildMonitoringModelResponse(
  overrides: Partial<MonitoringModelResponse> = {}
): MonitoringModelResponse {
  return {
    generated_at: "2026-03-31T10:00:00Z",
    vendor_id: 1,
    vendor_key: "openai",
    vendor_name: "OpenAI",
    model_config_id: 11,
    model_id: "gpt-4.1",
    display_name: "GPT-4.1",
    connections: [buildConnection()],
    ...overrides,
  };
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

const api = vi.hoisted(() => ({
  monitoring: {
    model: vi.fn(),
  },
}));

const toast = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api }));
vi.mock("sonner", () => ({ toast }));

vi.spyOn(console, "error").mockImplementation(() => {});

describe("useModelDetailMonitoring", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    api.monitoring.model.mockResolvedValue(buildMonitoringModelResponse());
  });

  it("loads once per distinct invalidation key and indexes connections by id", async () => {
    const { result, rerender } = renderHook(
      ({ modelConfigId, revision, selectedProfileId }) =>
        useModelDetailMonitoring({ modelConfigId, revision, selectedProfileId }),
      {
        initialProps: {
          modelConfigId: 11,
          revision: 1,
          selectedProfileId: 7,
        },
      }
    );

    expect(result.current.monitoringLoading).toBe(true);

    await flushMicrotasks();

    expect(api.monitoring.model).toHaveBeenCalledTimes(1);
    expect(api.monitoring.model).toHaveBeenCalledWith(11);
    expect(result.current.monitoringLoading).toBe(false);
    expect(result.current.monitoringModel?.model_config_id).toBe(11);
    expect(result.current.monitoringByConnectionId.get(5)?.endpoint_name).toBe("Primary endpoint");

    rerender({ modelConfigId: 11, revision: 1, selectedProfileId: 7 });

    await flushMicrotasks();

    expect(api.monitoring.model).toHaveBeenCalledTimes(1);

    rerender({ modelConfigId: 11, revision: 2, selectedProfileId: 7 });

    await flushMicrotasks();

    expect(api.monitoring.model).toHaveBeenCalledTimes(2);

    rerender({ modelConfigId: 11, revision: 2, selectedProfileId: 8 });

    await flushMicrotasks();

    expect(api.monitoring.model).toHaveBeenCalledTimes(3);
  });

  it("ignores stale responses after a newer invalidation key fetch wins", async () => {
    const firstResponse = createDeferred<MonitoringModelResponse>();

    api.monitoring.model
      .mockImplementationOnce(() => firstResponse.promise)
      .mockResolvedValueOnce(
        buildMonitoringModelResponse({
          generated_at: "2026-03-31T10:05:00Z",
          connections: [buildConnection({ connection_id: 9, endpoint_name: "Fresh endpoint" })],
        })
      );

    const { result, rerender } = renderHook(
      ({ revision }) =>
        useModelDetailMonitoring({
          modelConfigId: 11,
          revision,
          selectedProfileId: 7,
        }),
      {
        initialProps: {
          revision: 1,
        },
      }
    );

    rerender({ revision: 2 });

    await flushMicrotasks();

    expect(api.monitoring.model).toHaveBeenCalledTimes(2);
    expect(result.current.monitoringByConnectionId.get(9)?.endpoint_name).toBe("Fresh endpoint");

    await act(async () => {
      firstResponse.resolve(
        buildMonitoringModelResponse({
          generated_at: "2026-03-31T10:01:00Z",
          connections: [buildConnection({ connection_id: 3, endpoint_name: "Stale endpoint" })],
        })
      );
      await firstResponse.promise;
    });

    expect(result.current.monitoringByConnectionId.has(3)).toBe(false);
    expect(result.current.monitoringByConnectionId.get(9)?.endpoint_name).toBe("Fresh endpoint");
  });

  it("clears state and skips requests for invalid model ids", async () => {
    const { result, rerender } = renderHook(
      ({ modelConfigId }) =>
        useModelDetailMonitoring({
          modelConfigId,
          revision: 1,
          selectedProfileId: 7,
        }),
      {
        initialProps: {
          modelConfigId: 11,
        },
      }
    );

    await flushMicrotasks();

    expect(result.current.monitoringByConnectionId.has(5)).toBe(true);

    rerender({ modelConfigId: Number.NaN });

    await flushMicrotasks();

    expect(api.monitoring.model).toHaveBeenCalledTimes(1);
    expect(result.current.monitoringModel).toBeNull();
    expect(result.current.monitoringByConnectionId.size).toBe(0);
    expect(result.current.monitoringLoading).toBe(false);
  });

  it("clears the snapshot and reports a non-blocking toast when loading fails", async () => {
    const { result, rerender } = renderHook(
      ({ revision }) =>
        useModelDetailMonitoring({
          modelConfigId: 11,
          revision,
          selectedProfileId: 7,
        }),
      {
        initialProps: {
          revision: 1,
        },
      }
    );

    await flushMicrotasks();

    expect(result.current.monitoringByConnectionId.has(5)).toBe(true);

    api.monitoring.model.mockRejectedValueOnce(new Error("Monitoring failed"));

    rerender({ revision: 2 });

    await flushMicrotasks();

    expect(result.current.monitoringModel).toBeNull();
    expect(result.current.monitoringByConnectionId.size).toBe(0);
    expect(result.current.monitoringLoading).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Monitoring failed");
  });

  it("does not schedule timer-based polling", async () => {
    renderHook(() =>
      useModelDetailMonitoring({
        modelConfigId: 11,
        revision: 1,
        selectedProfileId: 7,
      })
    );

    await flushMicrotasks();

    expect(api.monitoring.model).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(api.monitoring.model).toHaveBeenCalledTimes(1);
  });
});
