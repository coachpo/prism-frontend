import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { VendorDialog } from "../dialogs/VendorDialog";

describe("VendorDialog", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders icon preset controls, preview, and fallback help text", () => {
    const setVendorForm = vi.fn();

    render(
      <LocaleProvider>
        <VendorDialog
          editingVendor={null}
          onClose={vi.fn()}
          onSave={vi.fn().mockResolvedValue(undefined)}
          open={true}
          setVendorForm={setVendorForm}
          vendorForm={{
            key: "zai",
            name: "Z.ai",
            description: "Z.ai Open Platform",
            icon_key: "zhipu",
          }}
          vendorSaving={false}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("Icon preset")).toBeInTheDocument();
    expect(screen.getByText("Current icon preview")).toBeInTheDocument();
    expect(screen.getByText("If no preset fits, Prism falls back to a letter monogram."))
      .toBeInTheDocument();
    expect(screen.getAllByLabelText("Vendor icon Z.ai").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("combobox")[0]);
    fireEvent.click(screen.getByText("No preset (use fallback)"));

    const updater = setVendorForm.mock.calls.at(-1)?.[0] as
      | ((state: { key: string; name: string; description: string; icon_key: string | null }) => {
          key: string;
          name: string;
          description: string;
          icon_key: string | null;
        })
      | undefined;

    expect(
      updater?.({
        key: "zai",
        name: "Z.ai",
        description: "Z.ai Open Platform",
        icon_key: "zhipu",
      }),
    ).toMatchObject({ icon_key: null });
  });
});
