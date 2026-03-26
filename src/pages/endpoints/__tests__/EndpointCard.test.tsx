import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { Endpoint, ModelConfigListItem, Provider } from "@/lib/types";
import { EndpointCardView } from "../EndpointCard";

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

function buildModel(overrides: Partial<ModelConfigListItem> = {}): ModelConfigListItem {
  return {
    id: 11,
    provider_id: 7,
    provider: buildProvider(),
    model_id: "gpt-4o-mini",
    display_name: "GPT-4o Mini",
    model_type: "native",
    redirect_to: null,
    loadbalance_strategy_id: 100,
    loadbalance_strategy: {
      id: 100,
      name: "single-primary",
      strategy_type: "single",
      failover_recovery_enabled: false,
      failover_cooldown_seconds: 60,
      failover_failure_threshold: 2,
      failover_backoff_multiplier: 2,
      failover_max_cooldown_seconds: 900,
      failover_jitter_ratio: 0.2,
      failover_auth_error_cooldown_seconds: 1800,
    },
    is_enabled: true,
    connection_count: 1,
    active_connection_count: 1,
    health_success_rate: 99,
    health_total_requests: 100,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    ...overrides,
  };
}

function buildEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    id: 5,
    profile_id: 2,
    name: "Primary OpenAI",
    base_url: "https://api.openai.com",
    has_api_key: true,
    masked_api_key: "sk-••••1234",
    position: 0,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    ...overrides,
  };
}

describe("EndpointCardView", () => {
  it("renders accessible duplicate, edit, and delete controls and wires their callbacks", () => {
    const endpoint = buildEndpoint();
    const onDuplicate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <LocaleProvider>
        <EndpointCardView
          endpoint={endpoint}
          formatTime={() => "Mar 20, 2026"}
          models={[buildModel()]}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </LocaleProvider>
    );

    const duplicateButton = screen.getByRole("button", {
      name: "Duplicate endpoint Primary OpenAI",
    });
    const editButton = screen.getByRole("button", { name: "Edit endpoint Primary OpenAI" });
    const deleteButton = screen.getByRole("button", {
      name: "Delete endpoint Primary OpenAI",
    });

    fireEvent.click(duplicateButton);
    fireEvent.click(editButton);
    fireEvent.click(deleteButton);

    expect(duplicateButton).toBeEnabled();
    expect(editButton).toBeEnabled();
    expect(deleteButton).toBeEnabled();
    expect(onDuplicate).toHaveBeenCalledWith(endpoint);
    expect(onEdit).toHaveBeenCalledWith(endpoint);
    expect(onDelete).toHaveBeenCalledWith(endpoint);
  });

  it("keeps the duplicate action disabled and spinning while duplication is in progress", () => {
    const endpoint = buildEndpoint();

    render(
      <LocaleProvider>
        <EndpointCardView
          endpoint={endpoint}
          formatTime={() => "Mar 20, 2026"}
          models={[]}
          isDuplicating={true}
        />
      </LocaleProvider>
    );

    const duplicateButton = screen.getByRole("button", {
      name: "Duplicate endpoint Primary OpenAI",
    });
    const editButton = screen.getByRole("button", { name: "Edit endpoint Primary OpenAI" });
    const deleteButton = screen.getByRole("button", {
      name: "Delete endpoint Primary OpenAI",
    });
    const duplicateIcon = duplicateButton.querySelector("svg");

    expect(duplicateButton).toBeDisabled();
    expect(editButton).toBeEnabled();
    expect(deleteButton).toBeEnabled();
    expect(duplicateIcon).not.toBeNull();
    expect(duplicateIcon).toHaveClass("animate-spin");
  });

  it("renders localized endpoint action labels when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");
    const endpoint = buildEndpoint();

    render(
      <LocaleProvider>
        <EndpointCardView
          endpoint={endpoint}
          formatTime={() => "2026-03-20"}
          models={[]}
        />
      </LocaleProvider>
    );

    expect(screen.getByRole("button", { name: "复制端点 Primary OpenAI" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑端点 Primary OpenAI" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除端点 Primary OpenAI" })).toBeInTheDocument();
  });

  it("renders localized endpoint card metadata when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");
    const endpoint = buildEndpoint();

    render(
      <LocaleProvider>
        <EndpointCardView
          endpoint={endpoint}
          formatTime={() => "2026-03-20"}
          models={[]}
        />
      </LocaleProvider>
    );

    expect(screen.getByRole("button", { name: "拖动以重新排序端点 Primary OpenAI" })).toBeInTheDocument();
    expect(screen.getByText("创建于 2026-03-20")).toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.getByText("无")) .toBeInTheDocument();
  });
});
