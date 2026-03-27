import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { ModelConfig, Vendor } from "@/lib/types";
import { ModelSettingsDialog } from "../ModelSettingsDialog";

describe("ModelSettingsDialog", () => {
  it("shows separate vendor and api family fields for proxy models", () => {
    const vendor: Vendor = {
      id: 30,
      key: "together-ai",
      name: "Together AI",
      description: null,
      icon_key: null,
      audit_enabled: false,
      audit_capture_bodies: false,
      created_at: "",
      updated_at: "",
    };
    const model: ModelConfig = {
      id: 9,
      vendor_id: 30,
      vendor,
      api_family: "openai",
      model_id: "friendly-proxy",
      display_name: "Friendly Proxy",
      model_type: "proxy",
      proxy_targets: [{ target_model_id: "gpt-5.4", position: 0 }],
      loadbalance_strategy_id: null,
      loadbalance_strategy: null,
      is_enabled: true,
      connections: [],
      created_at: "",
      updated_at: "",
    };

    render(
      <LocaleProvider>
        <ModelSettingsDialog
          editLoadbalanceStrategyId=""
          isOpen={true}
          loadbalanceStrategies={[]}
          onOpenChange={vi.fn()}
          vendors={[vendor]}
          setEditLoadbalanceStrategyId={vi.fn()}
          handleEditModelSubmit={vi.fn()}
          model={model}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("Vendor")).toBeInTheDocument();
    expect(screen.getByText("API Family")).toBeInTheDocument();
    expect(screen.getByDisplayValue("friendly-proxy")).toBeInTheDocument();
  });
});
