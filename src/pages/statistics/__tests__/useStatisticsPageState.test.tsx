import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useStatisticsPageState } from "../useStatisticsPageState";

function createWrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

describe("useStatisticsPageState", () => {
  it("parses api_family URL params for operations and spending filters", () => {
    const { result } = renderHook(() => useStatisticsPageState(1), {
      wrapper: createWrapper("/statistics?api_family=anthropic&spending_api_family=gemini"),
    });

    expect(result.current.apiFamily).toBe("anthropic");
    expect(result.current.spendingApiFamily).toBe("gemini");
  });

  it("updates api_family state without using provider-era URL keys", async () => {
    const { result } = renderHook(() => useStatisticsPageState(1), {
      wrapper: createWrapper("/statistics?tab=operations"),
    });

    act(() => {
      result.current.setApiFamily("openai");
      result.current.setSpendingApiFamily("anthropic");
    });

    await waitFor(() => {
      expect(result.current.apiFamily).toBe("openai");
      expect(result.current.spendingApiFamily).toBe("anthropic");
    });
  });
});
