import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { ProxyApiKey } from "@/lib/types";
import { ProxyKeyCard } from "../ProxyKeyCard";

function buildProxyKey(overrides: Partial<ProxyApiKey> = {}): ProxyApiKey {
  return {
    id: 1,
    name: "Primary runtime key",
    key_prefix: "prism",
    key_preview: "prism_****************",
    is_active: true,
    expires_at: null,
    last_used_at: null,
    last_used_ip: null,
    notes: "Used by the primary ingress.",
    rotated_from_id: null,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-21T10:00:00Z",
    ...overrides,
  };
}

describe("ProxyKeyCard", () => {
  it("renders accessible edit, rotate, and delete controls and wires their callbacks", () => {
    const onEdit = vi.fn();
    const onRotate = vi.fn();
    const onDelete = vi.fn();

    render(
      <LocaleProvider>
        <ProxyKeyCard
          item={buildProxyKey()}
          authEnabled={true}
          rotating={false}
          deleting={false}
          onEdit={onEdit}
          onRotate={onRotate}
          onDelete={onDelete}
        />
      </LocaleProvider>
    );

    const editButton = screen.getByRole("button", { name: "Edit proxy key Primary runtime key" });
    const rotateButton = screen.getByRole("button", {
      name: "Rotate proxy key Primary runtime key",
    });
    const deleteButton = screen.getByRole("button", {
      name: "Delete proxy key Primary runtime key",
    });

    fireEvent.click(editButton);
    fireEvent.click(rotateButton);
    fireEvent.click(deleteButton);

    expect(editButton).toBeEnabled();
    expect(rotateButton).toBeEnabled();
    expect(deleteButton).toBeEnabled();
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onRotate).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables all actions and spins the rotate icon while rotation is in progress", () => {
    render(
      <LocaleProvider>
        <ProxyKeyCard
          item={buildProxyKey()}
          authEnabled={true}
          rotating={true}
          deleting={false}
          onEdit={vi.fn()}
          onRotate={vi.fn()}
          onDelete={vi.fn()}
        />
      </LocaleProvider>
    );

    const editButton = screen.getByRole("button", { name: "Edit proxy key Primary runtime key" });
    const rotateButton = screen.getByRole("button", {
      name: "Rotate proxy key Primary runtime key",
    });
    const deleteButton = screen.getByRole("button", {
      name: "Delete proxy key Primary runtime key",
    });
    const rotateIcon = rotateButton.querySelector("svg");

    expect(editButton).toBeDisabled();
    expect(rotateButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
    expect(rotateIcon).not.toBeNull();
    expect(rotateIcon).toHaveClass("animate-spin");
  });

  it("renders localized proxy-key row copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <ProxyKeyCard
          item={buildProxyKey()}
          authEnabled={true}
          rotating={false}
          deleting={false}
          onEdit={vi.fn()}
          onRotate={vi.fn()}
          onDelete={vi.fn()}
        />
      </LocaleProvider>
    );

    expect(screen.getByRole("button", { name: "编辑代理密钥 Primary runtime key" })).toBeInTheDocument();
    expect(screen.getByText("预览")).toBeInTheDocument();
    expect(screen.getByText("最后使用")) .toBeInTheDocument();
  });
});
