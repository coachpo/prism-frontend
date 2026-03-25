import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useConfigBackupData } from "../useConfigBackupData";
import { useRetentionDeletionData } from "../useRetentionDeletionData";
import { useAuthenticationSettingsData } from "../useAuthenticationSettingsData";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  api: {
    config: {
      export: vi.fn(),
      import: vi.fn(),
    },
    stats: {
      delete: vi.fn(),
    },
    audit: {
      delete: vi.fn(),
    },
    loadbalance: {
      deleteEvents: vi.fn(),
    },
    settings: {
      auth: {
        get: vi.fn().mockRejectedValue(new Error("boom")),
        update: vi.fn(),
        requestEmailVerification: vi.fn(),
        confirmEmailVerification: vi.fn(),
      },
    },
  },
}));

describe("settings hooks i18n", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.lang = "zh-CN";
  });

  it("emits a localized export acknowledgement toast", async () => {
    const { result } = renderHook(() => useConfigBackupData({ bumpRevision: vi.fn() }));

    await act(async () => {
      await result.current.handleExport();
    });

    expect(toast.error).toHaveBeenCalledWith("请先确认导出中包含端点 API 密钥。");
  });

  it("emits a localized retention validation toast", () => {
    const { result } = renderHook(() => useRetentionDeletionData());

    act(() => {
      result.current.setCleanupType("requests");
      result.current.setRetentionPreset("invalid" as never);
    });

    act(() => {
      result.current.handleOpenDeleteConfirm();
    });

    expect(toast.error).toHaveBeenCalledWith("请选择有效的保留选项");
  });

  it("emits localized authentication setup toasts", async () => {
    const { result } = renderHook(() =>
      useAuthenticationSettingsData({ navigate: vi.fn(), refreshAuth: vi.fn(), revision: 1 }),
    );

    await act(async () => {
      await result.current.handleRequestEmailVerification();
    });

    expect(toast.error).toHaveBeenCalledWith("邮箱为必填项");
  });
});
