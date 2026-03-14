import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSharedReferenceData } from "@/lib/referenceData";
import { useStatisticsFilterOptions } from "../useStatisticsFilterOptions";

const api = vi.hoisted(() => ({
  endpoints: {
    connections: vi.fn(),
  },
  models: {
    list: vi.fn(),
  },
  providers: {
    list: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));

describe("useStatisticsFilterOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSharedReferenceData();
    api.models.list.mockResolvedValue([
      { model_id: "gpt-5.4", display_name: "GPT-5.4" },
    ]);
    api.endpoints.connections.mockResolvedValue({
      items: [{ connection_id: 1, label: "Primary", provider_type: "openai" }],
    });
    api.providers.list.mockRejectedValue(new Error("provider lookup failed"));
  });

  afterEach(() => {
    clearSharedReferenceData();
  });

  it("keeps model and connection filters when provider loading fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useStatisticsFilterOptions(1));

    await waitFor(() => {
      expect(result.current.models).toHaveLength(1);
      expect(result.current.connections).toHaveLength(1);
    });

    expect(result.current.providers).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to fetch statistics providers",
      expect.any(Error)
    );

    consoleError.mockRestore();
  });

  it("reuses shared filter data across hook instances for the same revision", async () => {
    api.providers.list.mockResolvedValueOnce([
      { id: 10, provider_type: "openai", audit_enabled: false, created_at: "", updated_at: "" },
    ]);

    const first = renderHook(() => useStatisticsFilterOptions(2));
    const second = renderHook(() => useStatisticsFilterOptions(2));

    await waitFor(() => {
      expect(first.result.current.models).toHaveLength(1);
      expect(second.result.current.models).toHaveLength(1);
      expect(first.result.current.providers).toHaveLength(1);
      expect(second.result.current.providers).toHaveLength(1);
    });

    expect(api.models.list).toHaveBeenCalledTimes(1);
    expect(api.endpoints.connections).toHaveBeenCalledTimes(1);
    expect(api.providers.list).toHaveBeenCalledTimes(1);
  });
});
