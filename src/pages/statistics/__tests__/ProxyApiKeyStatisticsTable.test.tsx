import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { UsageProxyApiKeyStatistic } from "@/lib/types";
import { ProxyApiKeyStatisticsTable } from "../tables/ProxyApiKeyStatisticsTable";

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
});
