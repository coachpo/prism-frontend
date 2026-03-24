import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
    base_url: "https://api.openai.com/v1",
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
      <EndpointCardView
        endpoint={endpoint}
        formatTime={() => "Mar 20, 2026"}
        models={[buildModel()]}
        onDuplicate={onDuplicate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
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
      <EndpointCardView
        endpoint={endpoint}
        formatTime={() => "Mar 20, 2026"}
        models={[]}
        isDuplicating={true}
      />
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
});
