import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VendorSelect } from "../VendorSelect";

const vendors = [
  {
    id: 30,
    key: "zai",
    name: "Z.ai",
    description: "Z.ai Open Platform",
    icon_key: "zhipu",
    audit_enabled: false,
    audit_capture_bodies: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: 31,
    key: "openai",
    name: "OpenAI",
    description: "OpenAI",
    icon_key: "openai",
    audit_enabled: false,
    audit_capture_bodies: false,
    created_at: "",
    updated_at: "",
  },
];

describe("VendorSelect", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("renders the selected vendor through the select value slot", () => {
    render(
      <VendorSelect
        value="30"
        onValueChange={vi.fn()}
        valueType="vendor_id"
        vendors={vendors}
        showAll={false}
      />,
    );

    const combobox = screen.getByRole("combobox");
    const selectValue = combobox.querySelector('[data-slot="select-value"]');

    expect(selectValue).not.toBeNull();
    expect(selectValue).toHaveTextContent("Z.ai");
  });
});
