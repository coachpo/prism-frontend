import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { DeleteModelDialog } from "../DeleteModelDialog";
import { ModelDialog } from "../ModelDialog";

describe("model dialogs i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("prism.locale", "zh-CN");
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("renders localized model dialog copy", () => {
    render(
      <LocaleProvider>
        <ModelDialog
          editingModel={null}
          formData={{
            provider_id: 1,
            model_id: "",
            display_name: null,
            model_type: "native",
            redirect_to: null,
            loadbalance_strategy_id: null,
            is_enabled: true,
          }}
          isDialogOpen={true}
          loadbalanceStrategies={[]}
          nativeModelsForProvider={[]}
          providers={[]}
          selectedProvider={undefined}
          setFormData={vi.fn()}
          setIsDialogOpen={vi.fn()}
          setLoadbalanceStrategyId={vi.fn()}
          setModelType={vi.fn()}
          onSubmit={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("新建模型")).toBeInTheDocument();
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.getByText("模型 ID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
  });

  it("renders localized delete-model dialog copy", () => {
    render(
      <LocaleProvider>
        <DeleteModelDialog
          deleteTarget={{
            id: 1,
            provider_id: 1,
            provider: {
              id: 1,
              name: "OpenAI",
              provider_type: "openai",
              description: null,
              audit_enabled: false,
              audit_capture_bodies: false,
              created_at: "",
              updated_at: "",
            },
            model_id: "gpt-4o",
            display_name: "GPT 4O",
            model_type: "native",
            redirect_to: null,
            loadbalance_strategy_id: null,
            loadbalance_strategy: null,
            is_enabled: true,
            connection_count: 0,
            active_connection_count: 0,
            health_success_rate: 0,
            health_total_requests: 0,
            created_at: "",
            updated_at: "",
          }}
          onDelete={vi.fn()}
          setDeleteTarget={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("删除模型")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
  });
});
