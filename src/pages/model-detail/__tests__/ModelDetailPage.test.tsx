import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useModelDetailPageShell } from "../useModelDetailPageShell";

describe("useModelDetailPageShell", () => {
  it("starts on the connections tab and navigates to related routes", () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useModelDetailPageShell(navigate));

    expect(result.current.activeTab).toBe("connections");

    act(() => {
      result.current.setActiveTab("events");
      result.current.navigateBackToModels();
      result.current.navigateToRequestLogs("gpt-5.4");
    });

    expect(result.current.activeTab).toBe("events");
    expect(navigate).toHaveBeenNthCalledWith(1, "/models");
    expect(navigate).toHaveBeenNthCalledWith(2, "/request-logs?model_id=gpt-5.4");
  });
});
