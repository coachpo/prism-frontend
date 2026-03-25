import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PricingTemplate } from "@/lib/types";
import { PricingTemplatesTable } from "../PricingTemplatesTable";

function buildTemplate(overrides: Partial<PricingTemplate> = {}): PricingTemplate {
  return {
    id: 9,
    profile_id: 3,
    name: "Default OpenAI",
    description: "Primary pricing template",
    pricing_unit: "PER_1M",
    pricing_currency_code: "USD",
    input_price: "0.1500",
    output_price: "0.6000",
    cached_input_price: null,
    cache_creation_price: null,
    reasoning_price: null,
    missing_special_token_price_policy: "MAP_TO_OUTPUT",
    version: 4,
    created_at: "2026-03-25T08:00:00Z",
    updated_at: "2026-03-25T08:00:00Z",
    ...overrides,
  };
}

describe("PricingTemplatesTable", () => {
  it("renders usage, edit, and delete actions inside the shared pill group and wires callbacks", () => {
    const template = buildTemplate();
    const onViewUsage = vi.fn().mockResolvedValue(undefined);
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <PricingTemplatesTable
        onCreate={vi.fn()}
        onDelete={onDelete}
        onEdit={onEdit}
        onViewUsage={onViewUsage}
        pricingTemplatePreparingEditId={null}
        pricingTemplates={[template]}
        pricingTemplatesLoading={false}
      />
    );

    const viewUsageButton = screen.getByRole("button", { name: `View usage for pricing template ${template.name}` });
    const editButton = screen.getByRole("button", { name: "Edit" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    const actionGroup = viewUsageButton.parentElement;

    expect(actionGroup).not.toBeNull();
    expect(actionGroup).toHaveClass("rounded-full", "border", "bg-muted/35", "p-0.5");
    expect(deleteButton).toHaveClass("text-destructive");

    fireEvent.click(viewUsageButton);
    fireEvent.click(editButton);
    fireEvent.click(deleteButton);

    expect(onViewUsage).toHaveBeenCalledWith(template);
    expect(onEdit).toHaveBeenCalledWith(template);
    expect(onDelete).toHaveBeenCalledWith(template);
  });

  it("keeps the edit action disabled and spinning while an edit payload is loading", () => {
    const template = buildTemplate();

    render(
      <PricingTemplatesTable
        onCreate={vi.fn()}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onEdit={vi.fn().mockResolvedValue(undefined)}
        onViewUsage={vi.fn().mockResolvedValue(undefined)}
        pricingTemplatePreparingEditId={template.id}
        pricingTemplates={[template]}
        pricingTemplatesLoading={false}
      />
    );

    const editButton = screen.getByRole("button", { name: "Edit" });
    const editIcon = editButton.querySelector("svg");
    const deleteButton = screen.getByRole("button", { name: "Delete" });

    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeEnabled();
    expect(editIcon).not.toBeNull();
    expect(editIcon).toHaveClass("animate-spin");
  });
});
