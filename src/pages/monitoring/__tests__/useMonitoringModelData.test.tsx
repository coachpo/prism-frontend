import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMonitoringModelData } from "../useMonitoringModelData";

const api = vi.hoisted(() => ({
  monitoring: {
    model: vi.fn(),
    probe: vi.fn(),
  },
  settings: {
    monitoring: {
      get: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api", () => ({ api }));

describe("useMonitoringModelData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    api.settings.monitoring.get.mockResolvedValue({
      profile_id: 7,
      monitoring_probe_interval_seconds: 30,
    });
    api.monitoring.model.mockResolvedValue({
      generated_at: "2026-03-30T10:00:00Z",
      vendor_id: 1,
      vendor_key: "openai",
      vendor_name: "OpenAI",
      model_config_id: 11,
      model_id: "gpt-4.1",
      display_name: "GPT-4.1",
      connections: [],
    });
    api.monitoring.probe.mockResolvedValue({
      connection_id: 99,
      checked_at: "2026-03-30T10:00:10Z",
      endpoint_ping_status: "healthy",
      endpoint_ping_ms: 100,
      conversation_status: "healthy",
      conversation_delay_ms: 210,
      fused_status: "healthy",
      failure_kind: null,
      detail: "probe completed",
    });
  });

  it("loads data, refreshes on the monitoring cadence, and refetches after manual probe", async () => {
    const { result } = renderHook(() =>
      useMonitoringModelData({ modelConfigId: 11, revision: 1, selectedProfileId: 7 }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(api.monitoring.model).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(api.monitoring.model).toHaveBeenCalledTimes(3);

    await act(async () => {
      await result.current.handleManualProbe(99);
    });

    expect(api.monitoring.probe).toHaveBeenCalledWith(99);
    expect(result.current.manualProbeResult?.detail).toBe("probe completed");
    expect(api.monitoring.model).toHaveBeenCalledTimes(4);
  });
});
