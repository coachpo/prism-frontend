import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { LoadbalanceStrategy, ModelConfigCreate, ModelConfigListItem, Vendor } from "@/lib/types";
import { ModelDialog } from "../ModelDialog";

const originalLocalStorage = window.localStorage;

function createLocalStorageMock(): Storage {
  let storage: Record<string, string> = {};

  return {
    clear: () => {
      storage = {};
    },
    getItem: (key) => storage[key] ?? null,
    key: (index) => Object.keys(storage)[index] ?? null,
    get length() {
      return Object.keys(storage).length;
    },
    removeItem: (key) => {
      delete storage[key];
    },
    setItem: (key, value) => {
      storage[key] = value;
    },
  };
}

function buildVendor(overrides: Partial<Vendor> = {}): Vendor {
  const { icon_key = null, ...rest } = overrides;

  return {
    id: 7,
    key: "openai",
    name: "OpenAI",
    description: null,
    audit_enabled: false,
    audit_capture_bodies: false,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    ...rest,
    icon_key,
  };
}

function buildNativeModel(overrides: Partial<ModelConfigListItem> = {}): ModelConfigListItem {
  return {
    id: 11,
    vendor_id: 7,
    vendor: buildVendor(),
    api_family: "openai",
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
    auto_recovery: { mode: "disabled" },
    attached_model_count: 1,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
  },
];

function Harness() {
  const vendors = [buildVendor()];
  const nativeModelsForApiFamily = [
    buildNativeModel(),
    buildNativeModel({ id: 12, model_id: "gpt-4.1-mini", display_name: "GPT-4.1 Mini" }),
    buildNativeModel({ id: 13, model_id: "gpt-4.1", display_name: "GPT-4.1" }),
  ];
  const [formData, setFormData] = useState<ModelConfigCreate>(
    {
      vendor_id: 7,
      api_family: "openai",
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
        nativeModelsForApiFamily={nativeModelsForApiFamily}
        vendors={vendors}
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

function EmptyProxyTargetsHarness() {
  const vendors = [buildVendor()];
  const [formData, setFormData] = useState<ModelConfigCreate>(
    {
      vendor_id: 7,
      api_family: "openai",
      model_id: "friendly-proxy",
      display_name: "Friendly Proxy",
      model_type: "proxy",
      loadbalance_strategy_id: null,
      is_enabled: true,
      proxy_targets: [],
    } as unknown as ModelConfigCreate,
  );

  return (
    <LocaleProvider>
      <ModelDialog
        editingModel={null}
        formData={formData}
        isDialogOpen
        loadbalanceStrategies={loadbalanceStrategies}
        nativeModelsForApiFamily={[]}
        vendors={vendors}
        setFormData={setFormData}
        setIsDialogOpen={vi.fn()}
        setLoadbalanceStrategyId={vi.fn()}
        setModelType={(value) => {
          setFormData((current) => ({ ...current, model_type: value } as unknown as ModelConfigCreate));
        }}
        onSubmit={vi.fn()}
      />
    </LocaleProvider>
  );
}

describe("ModelDialog proxy target editing", () => {
  beforeEach(() => {
    const localStorageMock = createLocalStorageMock();

    vi.stubGlobal("localStorage", localStorageMock);
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  });

  it("renders proxy dialog selects as full-width controls inside a scroll-safe dialog", () => {
    render(<Harness />);

    expect(screen.getByRole("dialog")).toHaveClass("max-h-[90vh]", "max-w-2xl", "overflow-y-auto");
    screen.getAllByRole("combobox").forEach((combobox) => {
      expect(combobox).toHaveClass("w-full");
    });
  });

  it("keeps native loadbalance strategy selection full-width", () => {
    render(
      <LocaleProvider>
        <ModelDialog
          editingModel={null}
          formData={{
            vendor_id: 7,
            api_family: "openai",
            model_id: "gpt-4o-mini",
            display_name: "GPT-4o Mini",
            model_type: "native",
            proxy_targets: [],
            loadbalance_strategy_id: 100,
            is_enabled: true,
          }}
          isDialogOpen
          loadbalanceStrategies={loadbalanceStrategies}
          nativeModelsForApiFamily={[]}
          vendors={[buildVendor()]}
          setFormData={vi.fn()}
          setIsDialogOpen={vi.fn()}
          setLoadbalanceStrategyId={vi.fn()}
          setModelType={vi.fn()}
          onSubmit={vi.fn()}
        />
      </LocaleProvider>,
    );

    screen.getAllByRole("combobox").forEach((combobox) => {
      expect(combobox).toHaveClass("w-full");
    });
  });

  it("keeps proxy target rows and add-target controls contained on narrow widths", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Add Target" }));

    const proxyTargetRow = screen
      .getByText("GPT-4o Mini (gpt-4o-mini)")
      .closest('div[class*="rounded-md"][class*="border"]');
    expect(proxyTargetRow).toHaveClass("flex-col", "sm:flex-row");

    const proxyTargetActions = screen.getByRole("button", { name: "Remove target gpt-4o-mini" }).parentElement;
    expect(proxyTargetActions).toHaveClass("shrink-0", "flex-wrap", "justify-end");

    const addTargetButton = screen.getByRole("button", { name: "Add Target" });
    expect(addTargetButton).toHaveClass("w-full", "sm:w-auto");
    expect(addTargetButton.parentElement).toHaveClass("flex-col", "sm:flex-row");
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

  it("explains that proxy targets can be configured later on the proxy detail page", () => {
    render(<EmptyProxyTargetsHarness />);

    expect(screen.getByText("No proxy targets selected yet.")).toBeInTheDocument();
    expect(
      screen.getByText("You can create this proxy now and configure targets later on /models/:id/proxy."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No native models available for the openai API family yet. Configure targets later on /models/:id/proxy.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps fill-first attached with priority spillover wording for native models", () => {
    render(
      <LocaleProvider>
        <ModelDialog
          editingModel={null}
          formData={{
            vendor_id: 7,
            api_family: "openai",
            model_id: "gpt-4o-mini",
            display_name: "GPT-4o Mini",
            model_type: "native",
            proxy_targets: [],
            loadbalance_strategy_id: 101,
            is_enabled: true,
          }}
          isDialogOpen
          loadbalanceStrategies={[
            ...loadbalanceStrategies,
            {
              ...loadbalanceStrategies[0],
              id: 101,
              name: "priority-pack",
              strategy_type: "fill-first",
            },
          ]}
          nativeModelsForApiFamily={[]}
          vendors={[buildVendor()]}
          setFormData={vi.fn()}
          setIsDialogOpen={vi.fn()}
          setLoadbalanceStrategyId={vi.fn()}
          setModelType={vi.fn()}
          onSubmit={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getAllByRole("combobox")[3]).toHaveTextContent(
      "priority-pack (Fill-first · Priority spillover)",
    );
  });
});
