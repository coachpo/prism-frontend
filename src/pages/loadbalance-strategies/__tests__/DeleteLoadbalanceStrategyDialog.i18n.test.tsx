import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { DeleteLoadbalanceStrategyDialog } from "../DeleteLoadbalanceStrategyDialog";

describe("DeleteLoadbalanceStrategyDialog i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("prism.locale", "zh-CN");
  });

  it("renders localized delete dialog copy", () => {
    render(
      <LocaleProvider>
        <DeleteLoadbalanceStrategyDialog
          deleteLoadbalanceStrategyConfirm={{
            id: 1,
            profile_id: 1,
            name: "demo",
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
            attached_model_count: 0,
            created_at: "",
            updated_at: "",
          }}
          loadbalanceStrategyDeleting={false}
          onClose={vi.fn()}
          onDelete={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("删除负载均衡策略")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
  });
});
