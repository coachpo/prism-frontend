import { StrictMode, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useRequestLogPageState } from "../useRequestLogPageState";

function createWrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <StrictMode>
        <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
      </StrictMode>
    );
  };
}

function useRequestLogPageStateWithLocation() {
  const state = useRequestLogPageState();
  const location = useLocation();

  return {
    location,
    state,
  };
}

describe("useRequestLogPageState", () => {
  it("updates the search filter and clears pagination in one URL change", async () => {
    const { result } = renderHook(() => useRequestLogPageStateWithLocation(), {
      wrapper: createWrapper("/request-logs?offset=100"),
    });

    act(() => {
      result.current.state.setSearchQuery("timeout");
    });

    await waitFor(() => {
      expect(result.current.state.searchQuery).toBe("timeout");
    });

    const params = new URLSearchParams(result.current.location.search);
    expect(params.get("search")).toBe("timeout");
    expect(params.get("offset")).toBeNull();
  });

  it("updates rows-per-page and clears pagination in one URL change", async () => {
    const { result } = renderHook(() => useRequestLogPageStateWithLocation(), {
      wrapper: createWrapper("/request-logs?offset=200"),
    });

    act(() => {
      result.current.state.setLimit(25);
    });

    await waitFor(() => {
      expect(result.current.state.limit).toBe(25);
    });

    const params = new URLSearchParams(result.current.location.search);
    expect(params.get("limit")).toBe("25");
    expect(params.get("offset")).toBeNull();
  });
});
