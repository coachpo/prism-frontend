import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useProxyApiKeysPageData } from "../useProxyApiKeysPageData";

const api = vi.hoisted(() => ({
  settings: {
    auth: {
      get: vi.fn(),
      proxyKeys: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        rotate: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/api", () => ({ api }));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function buildAuthSettings(overrides: Record<string, unknown> = {}) {
  return {
    auth_enabled: true,
    username: "operator",
    email: "operator@example.com",
    email_bound_at: null,
    pending_email: null,
    email_verification_required: false,
    has_password: true,
    proxy_key_limit: 100,
    ...overrides,
  };
}

function buildProxyKey(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Production client",
    key_prefix: "pk_live",
    key_preview: "pk_live_****abcd",
    is_active: true,
    expires_at: null,
    last_used_at: null,
    last_used_ip: null,
    notes: "Used by the main website",
    rotated_from_id: null,
    created_at: "2026-03-24T00:00:00Z",
    updated_at: "2026-03-24T00:00:00Z",
    ...overrides,
  };
}

function createSubmitEvent() {
  return {
    preventDefault: vi.fn(),
  };
}

describe("useProxyApiKeysPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.lang = "en";
    api.settings.auth.get.mockResolvedValue(buildAuthSettings());
    api.settings.auth.proxyKeys.list.mockResolvedValue([buildProxyKey()]);
  });

  afterEach(() => {
    cleanup();
  });

  it("prefills the current active state and submits it in the update payload", async () => {
    api.settings.auth.proxyKeys.update.mockResolvedValue(
      buildProxyKey({
        name: "Background worker",
        notes: "Used by cron jobs",
        is_active: false,
        updated_at: "2026-03-24T01:00:00Z",
      })
    );

    const { result } = renderHook(() => useProxyApiKeysPageData());

    await waitFor(() => {
      expect(result.current.pageLoading).toBe(false);
      expect(result.current.displayedProxyKeys).toHaveLength(1);
    });

    act(() => {
      result.current.startEditingProxyKey(result.current.displayedProxyKeys[0]);
    });

    expect(result.current.editingProxyKeyName).toBe("Production client");
    expect(result.current.editingProxyKeyNotes).toBe("Used by the main website");
    expect(result.current.editingProxyKeyActive).toBe(true);

    act(() => {
      result.current.setEditingProxyKeyName("Background worker");
      result.current.setEditingProxyKeyNotes("Used by cron jobs");
      result.current.setEditingProxyKeyActive(false);
    });

    await waitFor(() => {
      expect(result.current.editingProxyKeyName).toBe("Background worker");
      expect(result.current.editingProxyKeyNotes).toBe("Used by cron jobs");
      expect(result.current.editingProxyKeyActive).toBe(false);
    });

    act(() => {
      result.current.handleEditSubmit(
        createSubmitEvent() as unknown as Parameters<typeof result.current.handleEditSubmit>[0]
      );
    });

    await waitFor(() => {
      expect(api.settings.auth.proxyKeys.update).toHaveBeenCalledWith(1, {
        name: "Background worker",
        notes: "Used by cron jobs",
        is_active: false,
      });
    });

    await waitFor(() => {
      expect(result.current.displayedProxyKeys[0]).toMatchObject({
        id: 1,
        name: "Background worker",
        notes: "Used by cron jobs",
        is_active: false,
      });
      expect(result.current.editingProxyKey).toBeNull();
    });

    expect(toast.success).toHaveBeenCalledWith("Proxy API key updated");
  });

  it("emits localized validation errors when the locale is Chinese", async () => {
    document.documentElement.lang = "zh-CN";

    const { result } = renderHook(() => useProxyApiKeysPageData());

    await waitFor(() => {
      expect(result.current.pageLoading).toBe(false);
    });

    await act(async () => {
      await result.current.handleCreateSubmit(
        createSubmitEvent() as unknown as Parameters<typeof result.current.handleCreateSubmit>[0],
      );
    });

    expect(toast.error).toHaveBeenCalledWith("密钥名称为必填项");
  });
});
