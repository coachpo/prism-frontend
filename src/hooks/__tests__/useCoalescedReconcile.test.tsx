import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCoalescedReconcile } from "@/hooks/useCoalescedReconcile";

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe("useCoalescedReconcile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("coalesces overlapping refresh requests into one queued rerun", async () => {
    const firstRun = createDeferred();
    const reconcile = vi
      .fn<() => Promise<void>>()
      .mockImplementationOnce(() => firstRun.promise)
      .mockResolvedValueOnce();

    const { result } = renderHook(() =>
      useCoalescedReconcile({
        reconcile,
      })
    );

    await act(async () => {
      void result.current();
      void result.current();
    });

    expect(reconcile).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstRun.resolve();
      await firstRun.promise;
    });

    await waitFor(() => {
      expect(reconcile).toHaveBeenCalledTimes(2);
    });
  });
});
