import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    api.models.list.mockResolvedValue([
      { model_id: "gpt-5.4", display_name: "GPT-5.4" },
    ]);
    api.endpoints.connections.mockResolvedValue({
      items: [{ connection_id: 1, label: "Primary", provider_type: "openai" }],
    });
    api.providers.list.mockRejectedValue(new Error("provider lookup failed"));
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
});
