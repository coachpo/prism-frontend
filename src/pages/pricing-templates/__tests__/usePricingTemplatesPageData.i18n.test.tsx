import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { usePricingTemplatesPageData } from "../usePricingTemplatesPageData";

const api = vi.hoisted(() => ({
  pricingTemplates: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    connections: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api, ApiError: class ApiError extends Error { status = 409; detail = null; } }));
vi.mock("@/lib/referenceData", () => ({
  getSharedPricingTemplates: vi.fn().mockResolvedValue([]),
  setSharedPricingTemplates: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("usePricingTemplatesPageData i18n", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.lang = "zh-CN";
  });

  it("emits localized validation errors when the template name is missing", async () => {
    const { result } = renderHook(() => usePricingTemplatesPageData(1));

    await waitFor(() => {
      expect(result.current.pricingTemplatesLoading).toBe(false);
    });

    await act(async () => {
      await result.current.handleSavePricingTemplate();
    });

    expect(toast.error).toHaveBeenCalledWith("名称为必填项");
  });
});
