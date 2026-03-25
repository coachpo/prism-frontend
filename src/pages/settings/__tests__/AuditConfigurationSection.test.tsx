import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { HeaderBlocklistRule } from "@/lib/types";
import { AuditConfigurationRulesPanel } from "../sections/AuditConfigurationRulesPanel";

const systemRule: HeaderBlocklistRule = {
  id: 1,
  name: "authorization",
  enabled: true,
  is_system: true,
  match_type: "exact",
  pattern: "authorization",
  created_at: "",
  updated_at: "",
};

describe("AuditConfigurationRulesPanel", () => {
  it("renders system and custom rule groups with the add-rule action", () => {
    render(
      <LocaleProvider>
        <AuditConfigurationRulesPanel
          customRules={[]}
          loadingRules={false}
          onDeleteRule={vi.fn()}
          onEditRule={vi.fn()}
          onOpenAddRuleDialog={vi.fn()}
          onOpenChangeSystemRules={vi.fn()}
          onOpenChangeUserRules={vi.fn()}
          onToggleRule={vi.fn()}
          systemRules={[systemRule]}
          systemRulesOpen={true}
          userRulesOpen={true}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("System rules (locked)")).toBeInTheDocument();
    expect(screen.getByText("Custom rules")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Rule" })).toBeInTheDocument();
  });
});
