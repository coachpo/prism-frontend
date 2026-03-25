import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useLoadbalanceStrategiesPageData } from "../useLoadbalanceStrategiesPageData";

const api = vi.hoisted(() => ({
  loadbalanceStrategies: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api, ApiError: class ApiError extends Error { status = 409; detail = null; } }));
vi.mock("@/lib/referenceData", () => ({
  getSharedLoadbalanceStrategies: vi.fn().mockResolvedValue([]),
  setSharedLoadbalanceStrategies: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useLoadbalanceStrategiesPageData i18n", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.lang = "zh-CN";
  });

  it("emits localized validation errors when the strategy name is missing", async () => {
    const { result } = renderHook(() => useLoadbalanceStrategiesPageData(1));

    await waitFor(() => {
      expect(result.current.loadbalanceStrategiesLoading).toBe(false);
    });

    await act(async () => {
      await result.current.handleSaveLoadbalanceStrategy();
    });

    expect(toast.error).toHaveBeenCalledWith("名称为必填项");
  });
});
