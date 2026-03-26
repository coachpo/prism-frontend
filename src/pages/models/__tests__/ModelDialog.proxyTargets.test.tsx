import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { LoadbalanceStrategy, ModelConfigCreate, ModelConfigListItem, Provider } from "@/lib/types";
import { ModelDialog } from "../ModelDialog";

function buildProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: 7,
    name: "OpenAI",
    provider_type: "openai",
    description: null,
    audit_enabled: false,
    audit_capture_bodies: false,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    ...overrides,
  };
}

function buildNativeModel(overrides: Partial<ModelConfigListItem> = {}): ModelConfigListItem {
  return {
    id: 11,
    provider_id: 7,
    provider: buildProvider(),
    model_id: "gpt-4o-mini",
    display_name: "GPT-4o Mini",
    model_type: "native",
    loadbalance_strategy_id: 100,
    loadbalance_strategy: null,
    is_enabled: true,
    connection_count: 1,
    active_connection_count: 1,
    health_success_rate: 99,
    health_total_requests: 100,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    proxy_targets: [],
    ...overrides,
  } as unknown as ModelConfigListItem;
}

const loadbalanceStrategies: LoadbalanceStrategy[] = [
  {
    id: 100,
    profile_id: 1,
    name: "single-primary",
    strategy_type: "single",
    failover_recovery_enabled: false,
    failover_cooldown_seconds: 60,
    failover_failure_threshold: 2,
    failover_backoff_multiplier: 2,
    failover_max_cooldown_seconds: 900,
    failover_jitter_ratio: 0.2,
    failover_auth_error_cooldown_seconds: 1800,
    failover_ban_mode: "off",
    failover_max_cooldown_strikes_before_ban: 0,
    failover_ban_duration_seconds: 0,
    attached_model_count: 1,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
  },
];

function Harness() {
  const providers = [buildProvider()];
  const nativeModelsForProvider = [
    buildNativeModel(),
    buildNativeModel({ id: 12, model_id: "gpt-4.1-mini", display_name: "GPT-4.1 Mini" }),
    buildNativeModel({ id: 13, model_id: "gpt-4.1", display_name: "GPT-4.1" }),
  ];
  const [formData, setFormData] = useState<ModelConfigCreate>(
    {
      provider_id: 7,
      model_id: "friendly-proxy",
      display_name: "Friendly Proxy",
      model_type: "proxy",
      loadbalance_strategy_id: null,
      is_enabled: true,
      proxy_targets: [{ target_model_id: "gpt-4o-mini", position: 0 }],
    } as unknown as ModelConfigCreate,
  );

  return (
    <LocaleProvider>
      <ModelDialog
        editingModel={null}
        formData={formData}
        isDialogOpen
        loadbalanceStrategies={loadbalanceStrategies}
        nativeModelsForProvider={nativeModelsForProvider}
        providers={providers}
        selectedProvider={providers[0]}
        setFormData={setFormData}
        setIsDialogOpen={vi.fn()}
        setLoadbalanceStrategyId={vi.fn()}
        setModelType={(value) => {
          setFormData((current) => ({ ...current, model_type: value } as unknown as ModelConfigCreate));
        }}
        onSubmit={vi.fn()}
      />
      <pre data-testid="proxy-targets-state">{JSON.stringify((formData as { proxy_targets?: unknown }).proxy_targets ?? [])}</pre>
    </LocaleProvider>
  );
}

describe("ModelDialog proxy target editing", () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  it("adds, reorders, and removes ordered proxy targets", () => {
    render(<Harness />);

    expect(screen.getByTestId("proxy-targets-state")).toHaveTextContent(
      JSON.stringify([{ target_model_id: "gpt-4o-mini", position: 0 }]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Target" }));
    expect(screen.getByTestId("proxy-targets-state")).toHaveTextContent(
      JSON.stringify([
        { target_model_id: "gpt-4o-mini", position: 0 },
        { target_model_id: "gpt-4.1-mini", position: 1 },
      ]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Move target gpt-4.1-mini up" }));
    expect(screen.getByTestId("proxy-targets-state")).toHaveTextContent(
      JSON.stringify([
        { target_model_id: "gpt-4.1-mini", position: 0 },
        { target_model_id: "gpt-4o-mini", position: 1 },
      ]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove target gpt-4o-mini" }));
    expect(screen.getByTestId("proxy-targets-state")).toHaveTextContent(
      JSON.stringify([{ target_model_id: "gpt-4.1-mini", position: 0 }]),
    );
  });
});
