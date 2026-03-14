import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSharedReferenceData } from "@/lib/referenceData";
import { useCostingSettingsBootstrap } from "../useCostingSettingsBootstrap";

const api = vi.hoisted(() => ({
  models: {
    list: vi.fn(),
  },
  settings: {
    costing: {
      get: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api", () => ({ api }));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("useCostingSettingsBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSharedReferenceData();
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
    api.settings.costing.get.mockResolvedValue({
      report_currency_code: "USD",
      report_currency_symbol: "$",
      endpoint_fx_mappings: [],
      timezone_preference: "UTC",
    });
  });

  it("loads costing settings and shared models in parallel", async () => {
    const { result } = renderHook(() => useCostingSettingsBootstrap(1));

    await waitFor(() => {
      expect(result.current.costingLoading).toBe(false);
      expect(result.current.models).toHaveLength(1);
      expect(result.current.costingForm.timezone_preference).toBe("UTC");
    });

    expect(api.models.list).toHaveBeenCalledTimes(1);
    expect(api.settings.costing.get).toHaveBeenCalledTimes(1);
  });
});
