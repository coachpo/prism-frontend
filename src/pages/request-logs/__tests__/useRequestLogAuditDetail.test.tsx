import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuditLogDetail, AuditLogListItem } from "@/lib/types";
import { useRequestLogAuditDetail } from "../useRequestLogAuditDetail";

const api = vi.hoisted(() => ({
  audit: {
    get: vi.fn(),
    list: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));

function makeAuditListItem(id: number): AuditLogListItem {
  return {
    id,
    request_log_id: 101,
    profile_id: 1,
    provider_id: 2,
    model_id: "gpt-5.4",
    endpoint_id: 3,
    connection_id: 4,
    endpoint_base_url: "https://api.openai.com/v1",
    endpoint_description: "Primary endpoint",
    request_method: "POST",
    request_url: "https://api.openai.com/v1/chat/completions",
    request_headers: "{\"content-type\":\"application/json\"}",
    request_body_preview: "{\"model\":\"gpt-5.4\"}",
    response_status: 200,
    is_stream: false,
    duration_ms: 250,
    created_at: "2026-03-15T10:00:00Z",
  };
}

function makeAuditDetail(id: number): AuditLogDetail {
  return {
    id,
    request_log_id: 101,
    profile_id: 1,
    provider_id: 2,
    model_id: "gpt-5.4",
    endpoint_id: 3,
    connection_id: 4,
    endpoint_base_url: "https://api.openai.com/v1",
    endpoint_description: "Primary endpoint",
    request_method: "POST",
    request_url: "https://api.openai.com/v1/chat/completions",
    request_headers: "{\"content-type\":\"application/json\"}",
    request_body: "{\"model\":\"gpt-5.4\"}",
    response_status: 200,
    response_headers: "{\"content-type\":\"application/json\"}",
    response_body: "{\"id\":\"chatcmpl_123\"}",
    is_stream: false,
    duration_ms: 250,
    created_at: "2026-03-15T10:00:00Z",
  };
}

describe("useRequestLogAuditDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
  });

  it("retries the audit lookup when the linked audit record appears shortly after the request log", async () => {
    api.audit.list
      .mockResolvedValueOnce({
        items: [],
        total: 0,
        limit: 1,
        offset: 0,
      })
      .mockResolvedValueOnce({
        items: [makeAuditListItem(77)],
        total: 1,
        limit: 1,
        offset: 0,
      });
    api.audit.get.mockResolvedValue(makeAuditDetail(77));

    const { result } = renderHook(() =>
      useRequestLogAuditDetail({
        selectedLogId: 101,
        detailTab: "audit",
      })
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(api.audit.list).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(api.audit.list).toHaveBeenCalledTimes(2);
    expect(api.audit.get).toHaveBeenCalledWith(77);
    expect(result.current.auditDetail?.id).toBe(77);
    expect(result.current.auditError).toBeNull();
    expect(result.current.auditLoading).toBe(false);
  });
});
