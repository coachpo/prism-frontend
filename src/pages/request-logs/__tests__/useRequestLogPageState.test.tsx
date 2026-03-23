import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useRequestLogPageState } from "../useRequestLogPageState";

function createWrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

describe("useRequestLogPageState", () => {
  it("keeps pagination offset when applying local-only refinements", async () => {
    const { result } = renderHook(() => useRequestLogPageState(), {
      wrapper: createWrapper("/request-logs?offset=50"),
    });

    act(() => {
      result.current.setSearch("timeout");
    });

    await waitFor(() => {
      expect(result.current.state.search).toBe("timeout");
    });

    expect(result.current.state.offset).toBe(50);

    act(() => {
      result.current.setOutcomeFilter("error");
    });

    await waitFor(() => {
      expect(result.current.state.outcome_filter).toBe("error");
    });

    expect(result.current.state.offset).toBe(50);

    act(() => {
      result.current.setTriage(true);
    });

    await waitFor(() => {
      expect(result.current.state.triage).toBe(true);
    });

    expect(result.current.state.offset).toBe(50);
  });

  it("resets pagination offset when a server-backed filter changes", async () => {
    const { result } = renderHook(() => useRequestLogPageState(), {
      wrapper: createWrapper("/request-logs?offset=50"),
    });

    act(() => {
      result.current.setModelId("gpt-5.4");
    });

    await waitFor(() => {
      expect(result.current.state.model_id).toBe("gpt-5.4");
    });

    expect(result.current.state.offset).toBe(0);

    act(() => {
      result.current.setOffset(75);
    });

    await waitFor(() => {
      expect(result.current.state.offset).toBe(75);
    });

    act(() => {
      result.current.setStatusFamily("4xx");
    });

    await waitFor(() => {
      expect(result.current.state.status_family).toBe("4xx");
    });

    expect(result.current.state.offset).toBe(0);
  });

  it("clears status-family filters while preserving exact-request mode state", async () => {
    const { result } = renderHook(() => useRequestLogPageState(), {
      wrapper: createWrapper("/request-logs?status_family=5xx&model_id=gpt-5.4&request_id=123&detail_tab=audit"),
    });

    act(() => {
      result.current.clearFilters();
    });

    await waitFor(() => {
      expect(result.current.state.status_family).toBe("all");
    });

    expect(result.current.state.model_id).toBe("");
    expect(result.current.state.request_id).toBe("123");
    expect(result.current.state.detail_tab).toBe("audit");
  });
});
