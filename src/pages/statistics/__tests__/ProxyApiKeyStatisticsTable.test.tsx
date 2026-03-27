import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { UsageProxyApiKeyStatistic } from "@/lib/types";
import { ProxyApiKeyStatisticsTable } from "../tables/ProxyApiKeyStatisticsTable";
import { installLocalStorageMock } from "./storage";

function createProxyApiKeyStatistic(
  overrides: Partial<UsageProxyApiKeyStatistic> = {},
): UsageProxyApiKeyStatistic {
  return {
    failed_count: 1,
    key_prefix: "prism_pk_primary_1234",
    proxy_api_key_id: 77,
    proxy_api_key_label: "Primary runtime key",
    request_count: 5,
    success_count: 4,
    success_rate: 80,
    total_cost_micros: 4200,
    total_tokens: 245,
    ...overrides,
  };
}

describe("ProxyApiKeyStatisticsTable", () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    localStorage.clear();
  });

  it("renders Prism-native proxy API key statistics instead of generic credential wording", () => {
    render(
      <LocaleProvider>
        <ProxyApiKeyStatisticsTable items={[createProxyApiKeyStatistic()]} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Proxy API Key Statistics")).toBeInTheDocument();
    expect(screen.getByText("Primary runtime key")).toBeInTheDocument();
    expect(screen.getByText("prism_pk_primary_1234")).toBeInTheDocument();
    expect(screen.queryByText("Credential Statistics")).not.toBeInTheDocument();
  });

  it("renders N/A with an auth-disabled tooltip when the proxy key dimension is not applicable", async () => {
    const props = {
      authEnabled: false,
      items: [
        createProxyApiKeyStatistic({
          key_prefix: null,
          proxy_api_key_id: null,
          proxy_api_key_label: "Unknown proxy key",
        }),
      ],
    };

    render(
      <LocaleProvider>
        <ProxyApiKeyStatisticsTable {...props} />
      </LocaleProvider>,
    );

    const notApplicable = screen.getByText("N/A");
    expect(notApplicable).toBeInTheDocument();
    expect(screen.queryByText("Unknown proxy key")).not.toBeInTheDocument();

    fireEvent.focus(notApplicable);

    expect(
      await screen.findByRole("tooltip", {
        name: "Not applicable because proxy authentication is disabled in Settings.",
      }),
    ).toBeInTheDocument();
  });

  it("keeps normal proxy-key rows unchanged when authentication is enabled", () => {
    const props = {
      authEnabled: true,
      items: [createProxyApiKeyStatistic()],
    };

    render(
      <LocaleProvider>
        <ProxyApiKeyStatisticsTable {...props} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Primary runtime key")).toBeInTheDocument();
    expect(screen.getByText("prism_pk_primary_1234")).toBeInTheDocument();
    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
  });
});
