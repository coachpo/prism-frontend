import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMonitoringSettingsData } from "../useMonitoringSettingsData";

const api = vi.hoisted(() => ({
  settings: {
    monitoring: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api", () => ({ api }));

describe("useMonitoringSettingsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.settings.monitoring.get.mockResolvedValue({
      profile_id: 7,
      monitoring_probe_interval_seconds: 300,
    });
    api.settings.monitoring.update.mockResolvedValue({
      profile_id: 7,
      monitoring_probe_interval_seconds: 120,
    });
  });

  it("loads and saves backend-owned monitoring cadence", async () => {
    const setRecentlySavedSection = vi.fn();
    const { result } = renderHook(() =>
      useMonitoringSettingsData({ revision: 3, setRecentlySavedSection }),
    );

    await waitFor(() => {
      expect(result.current.monitoringLoading).toBe(false);
    });

    expect(result.current.monitoringIntervalSeconds).toBe("300");

    act(() => {
      result.current.setMonitoringIntervalSeconds("120");
    });

    await act(async () => {
      await result.current.handleSaveMonitoringSettings();
    });

    expect(api.settings.monitoring.update).toHaveBeenCalledWith({
      monitoring_probe_interval_seconds: 120,
    });
    expect(result.current.monitoringIntervalSeconds).toBe("120");
    expect(setRecentlySavedSection).toHaveBeenCalledWith("monitoring");
  });
});
