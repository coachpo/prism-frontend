import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStatisticsFilterOptions } from "../useStatisticsFilterOptions";

const referenceData = vi.hoisted(() => ({
  getSharedConnectionOptions: vi.fn(),
  getSharedModels: vi.fn(),
  getSharedVendors: vi.fn(),
}));

vi.mock("@/lib/referenceData", () => referenceData);

describe("useStatisticsFilterOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    referenceData.getSharedModels.mockResolvedValue([
      {
        id: 1,
        vendor_id: 10,
        vendor: {
          id: 10,
          key: "openai",
          name: "OpenAI",
          description: null,
          audit_enabled: false,
          audit_capture_bodies: true,
          created_at: "",
          updated_at: "",
        },
        api_family: "openai",
        model_id: "gpt-5.4",
        display_name: "GPT 5.4",
        model_type: "native",
        proxy_targets: [],
        loadbalance_strategy_id: null,
        loadbalance_strategy: null,
        is_enabled: true,
        connection_count: 1,
        active_connection_count: 1,
        health_success_rate: null,
        health_total_requests: 0,
        created_at: "",
        updated_at: "",
      },
      {
        id: 2,
        vendor_id: 11,
        vendor: {
          id: 11,
          key: "anthropic",
          name: "Anthropic",
          description: null,
          audit_enabled: false,
          audit_capture_bodies: true,
          created_at: "",
          updated_at: "",
        },
        api_family: "anthropic",
        model_id: "claude-sonnet-4-5",
        display_name: "Claude Sonnet 4.5",
        model_type: "native",
        proxy_targets: [],
        loadbalance_strategy_id: null,
        loadbalance_strategy: null,
        is_enabled: true,
        connection_count: 1,
        active_connection_count: 1,
        health_success_rate: null,
        health_total_requests: 0,
        created_at: "",
        updated_at: "",
      },
    ]);
    referenceData.getSharedConnectionOptions.mockResolvedValue([{ id: 7, name: "Primary" }]);
    referenceData.getSharedVendors.mockResolvedValue([
      {
        id: 10,
        key: "openai",
        name: "OpenAI",
        description: null,
        audit_enabled: false,
        audit_capture_bodies: true,
        created_at: "",
        updated_at: "",
      },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("derives api-family filter options separately from vendor lookups", async () => {
    const { result } = renderHook(() => useStatisticsFilterOptions(1));

    await waitFor(() => {
      expect(result.current.apiFamilies).toEqual(["openai", "anthropic"]);
    });

    expect(result.current.vendors).toHaveLength(1);
    expect(result.current.connections).toHaveLength(1);
    expect(result.current.models).toEqual([
      { model_id: "gpt-5.4", display_name: "GPT 5.4" },
      { model_id: "claude-sonnet-4-5", display_name: "Claude Sonnet 4.5" },
    ]);
  });

  it("falls back to the canonical api families when model bootstrap fails", async () => {
    referenceData.getSharedModels.mockRejectedValueOnce(new Error("models unavailable"));

    const { result } = renderHook(() => useStatisticsFilterOptions(2));

    await waitFor(() => {
      expect(result.current.apiFamilies).toEqual(["openai", "anthropic", "gemini"]);
    });
  });
});
