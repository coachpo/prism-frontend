import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProxyTargetsCard } from "../ProxyTargetsCard";

describe("ProxyTargetsCard", () => {
  it("explains ordered routing and saves edited target order", () => {
    const onSave = vi.fn();

    render(
      <ProxyTargetsCard
        availableTargets={[
          { modelId: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (20250929)" },
          { modelId: "claude-sonnet-4-5-20250701", label: "Claude Sonnet 4.5 (20250701)" },
          { modelId: "claude-sonnet-4-5-20250301", label: "Claude Sonnet 4.5 (20250301)" },
        ]}
        proxyTargets={[
          { target_model_id: "claude-sonnet-4-5-20250929", position: 0 },
          { target_model_id: "claude-sonnet-4-5-20250701", position: 1 },
        ]}
        saving={false}
        onSave={onSave}
      />,
    );

    expect(screen.getByText("Ordered priority routing")).toBeInTheDocument();
    expect(
      screen.getByText("The first available target wins, then that native model handles connection failover."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Target" }));
    fireEvent.click(screen.getByRole("button", { name: "Move target claude-sonnet-4-5-20250301 up" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Proxy Targets" }));

    expect(onSave).toHaveBeenCalledWith([
      { target_model_id: "claude-sonnet-4-5-20250929", position: 0 },
      { target_model_id: "claude-sonnet-4-5-20250301", position: 1 },
      { target_model_id: "claude-sonnet-4-5-20250701", position: 2 },
    ]);
  });
});
