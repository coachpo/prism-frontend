import type { ChangeEvent } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
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

  it("accepts imported proxy models with empty proxy_targets through the settings hook", async () => {
    document.documentElement.lang = "en";
    const { result } = renderHook(() => useConfigBackupData({ bumpRevision: vi.fn() }));
    const file = {
      name: "config.json",
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          version: 1,
          vendors: [
            {
              key: "openai",
              name: "OpenAI",
              description: "OpenAI vendor",
              icon_key: "openai",
              audit_enabled: true,
              audit_capture_bodies: false,
            },
          ],
          endpoints: [],
          pricing_templates: [],
          loadbalance_strategies: [],
          models: [
            {
              vendor_key: "openai",
              api_family: "openai",
              model_id: "gateway-proxy",
              display_name: "Gateway Proxy",
              model_type: "proxy",
              proxy_targets: [],
              loadbalance_strategy_name: null,
              is_enabled: true,
              connections: [],
            },
          ],
        }),
      ),
    } as unknown as File;

    await act(async () => {
      await result.current.handleFileSelect({
        target: { files: [file] },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => {
      expect(result.current.parsedConfig?.models[0]?.model_type).toBe("proxy");
      expect(result.current.parsedConfig?.models[0]?.proxy_targets).toEqual([]);
    });
    expect(toast.error).not.toHaveBeenCalled();
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
