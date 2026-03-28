import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { VendorDialog } from "../dialogs/VendorDialog";

const originalLocalStorage = window.localStorage;

function createLocalStorageMock(): Storage {
  let storage: Record<string, string> = {};

  return {
    clear: () => {
      storage = {};
    },
    getItem: (key) => storage[key] ?? null,
    key: (index) => Object.keys(storage)[index] ?? null,
    get length() {
      return Object.keys(storage).length;
    },
    removeItem: (key) => {
      delete storage[key];
    },
    setItem: (key, value) => {
      storage[key] = value;
    },
  };
}

describe("VendorDialog", () => {
  beforeEach(() => {
    const localStorageMock = createLocalStorageMock();

    vi.stubGlobal("localStorage", localStorageMock);
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
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

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
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
