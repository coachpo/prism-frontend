import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRetentionDeletionData } from "../useRetentionDeletionData";

const api = vi.hoisted(() => ({
  audit: {
    delete: vi.fn(),
  },
  loadbalance: {
    deleteEvents: vi.fn(),
  },
  stats: {
    delete: vi.fn(),
    deleteStatistics: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useRetentionDeletionData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the delete summary and confirmation phrase stable while closing after a successful delete", async () => {
    api.stats.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRetentionDeletionData());

    act(() => {
      result.current.setCleanupType("requests");
      result.current.setRetentionPreset("7");
    });

    act(() => {
      result.current.handleOpenDeleteConfirm();
      result.current.setDeleteConfirmPhrase("DELETE");
    });

    await act(async () => {
      await result.current.handleBatchDelete();
    });

    expect(api.stats.delete).toHaveBeenCalledWith({ older_than_days: 7 });
    expect(result.current.deleteConfirmDialogOpen).toBe(false);
    expect(result.current.deleteConfirm).toBeNull();
    expect(result.current.displayedDeleteConfirm).toEqual({
      type: "requests",
      days: 7,
      deleteAll: false,
    });
    expect(result.current.deleteConfirmPhrase).toBe("DELETE");
    expect(result.current.retentionPreset).toBe("7");
  });

  it("routes statistics cleanup through the dedicated statistics delete client", async () => {
    api.stats.deleteStatistics.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRetentionDeletionData());

    act(() => {
      result.current.setCleanupType("statistics");
      result.current.setRetentionPreset("all");
    });

    act(() => {
      result.current.handleOpenDeleteConfirm();
      result.current.setDeleteConfirmPhrase("DELETE");
    });

    await act(async () => {
      await result.current.handleBatchDelete();
    });

    expect(api.stats.deleteStatistics).toHaveBeenCalledWith({ delete_all: true });
    expect(api.stats.delete).not.toHaveBeenCalled();
    expect(result.current.displayedDeleteConfirm).toEqual({
      type: "statistics",
      days: null,
      deleteAll: true,
    });
  });
});
