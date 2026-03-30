import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { LoadbalanceStrategy } from "@/lib/types";
import { useLoadbalanceStrategiesPageData } from "../useLoadbalanceStrategiesPageData";

const api = vi.hoisted(() => ({
  loadbalanceStrategies: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const referenceData = vi.hoisted(() => ({
  getSharedLoadbalanceStrategies: vi.fn(),
  setSharedLoadbalanceStrategies: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api, ApiError: class ApiError extends Error { status = 409; detail = null; } }));
vi.mock("@/lib/referenceData", () => ({
  getSharedLoadbalanceStrategies: referenceData.getSharedLoadbalanceStrategies,
  setSharedLoadbalanceStrategies: referenceData.setSharedLoadbalanceStrategies,
}));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function buildStrategy(overrides: Partial<LoadbalanceStrategy> = {}): LoadbalanceStrategy {
  return {
    id: 1,
    profile_id: 1,
    name: "Primary single",
    strategy_type: "single",
    auto_recovery: { mode: "disabled" },
    attached_model_count: 0,
    created_at: "2026-03-30T09:00:00Z",
    updated_at: "2026-03-30T10:00:00Z",
    ...overrides,
  };
}

describe("useLoadbalanceStrategiesPageData i18n", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.lang = "zh-CN";
    referenceData.getSharedLoadbalanceStrategies.mockResolvedValue([]);
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

  it("keeps the create draft stable while closing after a successful save", async () => {
    const created = buildStrategy({
      id: 3,
      name: "Canary strategy",
      updated_at: "2026-03-30T11:00:00Z",
    });
    api.loadbalanceStrategies.create.mockResolvedValue(created);

    const { result } = renderHook(() => useLoadbalanceStrategiesPageData(1));

    await waitFor(() => {
      expect(result.current.loadbalanceStrategiesLoading).toBe(false);
    });

    act(() => {
      result.current.openCreateLoadbalanceStrategyDialog();
      result.current.setLoadbalanceStrategyForm((prev) => ({
        ...prev,
        name: "Canary strategy",
      }));
    });

    await act(async () => {
      await result.current.handleSaveLoadbalanceStrategy();
    });

    expect(api.loadbalanceStrategies.create).toHaveBeenCalledWith({
      name: "Canary strategy",
      strategy_type: "single",
      auto_recovery: { mode: "disabled" },
    });
    expect(result.current.loadbalanceStrategyDialogOpen).toBe(false);
    expect(result.current.loadbalanceStrategyForm).toMatchObject({
      name: "Canary strategy",
      strategy_type: "single",
    });
  });

  it("keeps the edit snapshot stable while closing after a successful save", async () => {
    const summary = buildStrategy({
      id: 7,
      name: "Original strategy",
      updated_at: "2026-03-30T10:00:00Z",
    });
    const loaded = buildStrategy({
      id: 7,
      name: "Original strategy",
      updated_at: "2026-03-30T10:00:00Z",
    });
    const updated = buildStrategy({
      id: 7,
      name: "Updated strategy",
      updated_at: "2026-03-30T12:00:00Z",
    });
    referenceData.getSharedLoadbalanceStrategies.mockResolvedValueOnce([summary]);
    api.loadbalanceStrategies.get.mockResolvedValue(loaded);
    api.loadbalanceStrategies.update.mockResolvedValue(updated);

    const { result } = renderHook(() => useLoadbalanceStrategiesPageData(1));

    await waitFor(() => {
      expect(result.current.loadbalanceStrategiesLoading).toBe(false);
      expect(result.current.loadbalanceStrategies[0]?.id).toBe(7);
    });

    await act(async () => {
      await result.current.handleEditLoadbalanceStrategy(summary);
    });

    act(() => {
      result.current.setLoadbalanceStrategyForm((prev) => ({
        ...prev,
        name: "Updated strategy",
      }));
    });

    await act(async () => {
      await result.current.handleSaveLoadbalanceStrategy();
    });

    expect(api.loadbalanceStrategies.update).toHaveBeenCalledWith(7, {
      name: "Updated strategy",
      strategy_type: "single",
      auto_recovery: { mode: "disabled" },
    });
    expect(result.current.loadbalanceStrategyDialogOpen).toBe(false);
    expect(result.current.editingLoadbalanceStrategy?.id).toBe(7);
    expect(result.current.loadbalanceStrategyForm).toMatchObject({ name: "Updated strategy" });
  });

  it("closes the delete dialog without dropping the displayed strategy snapshot", async () => {
    const strategy = buildStrategy({ id: 11, name: "Disposable strategy" });
    referenceData.getSharedLoadbalanceStrategies.mockResolvedValueOnce([strategy]);
    api.loadbalanceStrategies.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLoadbalanceStrategiesPageData(1));

    await waitFor(() => {
      expect(result.current.loadbalanceStrategiesLoading).toBe(false);
      expect(result.current.loadbalanceStrategies[0]?.id).toBe(11);
    });

    act(() => {
      result.current.handleDeleteLoadbalanceStrategyClick(strategy);
    });

    await act(async () => {
      await result.current.handleDeleteLoadbalanceStrategy();
    });

    expect(result.current.loadbalanceStrategies).toEqual([]);
    expect(result.current.deleteLoadbalanceStrategyDialogOpen).toBe(false);
    expect(result.current.deleteLoadbalanceStrategyConfirm).toBeNull();
    expect(result.current.displayedDeleteLoadbalanceStrategyConfirm).toMatchObject({
      id: 11,
      name: "Disposable strategy",
    });
  });
});
