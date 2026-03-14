import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSharedReferenceData } from "@/lib/referenceData";
import { useRequestLogFilterOptions } from "../useRequestLogFilterOptions";

const api = vi.hoisted(() => ({
  endpoints: {
    connections: vi.fn(),
    list: vi.fn(),
  },
  models: {
    list: vi.fn(),
  },
  providers: {
    list: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));

describe("useRequestLogFilterOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSharedReferenceData();
    api.models.list.mockResolvedValue([
      { model_id: "gpt-5.4", display_name: "GPT-5.4" },
    ]);
    api.endpoints.connections.mockResolvedValue({
      items: [{ connection_id: 1, label: "Primary", provider_type: "openai" }],
    });
    api.endpoints.list.mockResolvedValue([
      { id: 10, path: "/v1/chat/completions", method: "POST" },
    ]);
    api.providers.list.mockRejectedValue(new Error("provider lookup failed"));
  });

  afterEach(() => {
    clearSharedReferenceData();
  });

  it("keeps non-provider filter data when provider loading fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useRequestLogFilterOptions(1));

    await waitFor(() => {
      expect(result.current.models).toHaveLength(1);
      expect(result.current.connections).toHaveLength(1);
      expect(result.current.endpoints).toHaveLength(1);
    });

    expect(result.current.providers).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to load request-log providers",
      expect.any(Error)
    );

    consoleError.mockRestore();
  });
});
