import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const TEST_APP_VERSION = "9.8.7";
const TEST_GIT_RUN_NUMBER = "123";
const TEST_GIT_REVISION = "deadbee";

async function renderSidebar(overrides: Record<string, unknown> = {}) {
  vi.stubEnv("VITE_APP_VERSION", TEST_APP_VERSION);
  vi.stubEnv("VITE_GIT_RUN_NUMBER", TEST_GIT_RUN_NUMBER);
  vi.stubEnv("VITE_GIT_REVISION", TEST_GIT_REVISION);
  vi.resetModules();

  const [{ AppSidebar }, { VERSION_LABEL }, { LocaleProvider }] = await Promise.all([
    import("../AppSidebar"),
    import("../navigationProfileConfig"),
    import("@/i18n/LocaleProvider"),
  ]);

  const props = {
    activeProfileName: "Production",
    closeProfileSwitcher: vi.fn(),
    hasMismatch: false,
    selectedProfileName: "Production",
    setSidebarOpen: vi.fn(),
    sidebarOpen: true,
    ...overrides,
  };

  const view = render(
    <LocaleProvider>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppSidebar {...props} />
      </MemoryRouter>
    </LocaleProvider>
  );

  return {
    ...view,
    props,
    VERSION_LABEL,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("AppSidebar", () => {
  it("uses mobile-only hit testing disablement while hidden", async () => {
    await renderSidebar({ sidebarOpen: false });

    const sidebar = screen.getByRole("complementary", { name: "Primary navigation" });

    expect(sidebar).toHaveClass("pointer-events-auto");
    expect(sidebar).toHaveClass("translate-x-0");
    expect(sidebar).toHaveClass("max-lg:pointer-events-none");
    expect(sidebar).toHaveClass("max-lg:-translate-x-full");
    expect(sidebar).toHaveClass("lg:pointer-events-auto");
  });

  it("stays interactive when open and closes on navigation click", async () => {
    const { props } = await renderSidebar();

    const sidebar = screen.getByRole("complementary", { name: "Primary navigation" });
    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });

    expect(sidebar).toHaveClass("pointer-events-auto");

    fireEvent.click(dashboardLink);

    expect(props.closeProfileSwitcher).toHaveBeenCalledTimes(1);
    expect(props.setSidebarOpen).toHaveBeenCalledWith(false);
  });

  it("renders the version label with the app version first and git metadata second", async () => {
    const { VERSION_LABEL } = await renderSidebar();

    expect(VERSION_LABEL).toBe("9.8.7 (123 - deadbee)");
    expect(screen.getByText(VERSION_LABEL)).toBeInTheDocument();
  });

  it("includes the loadbalance strategies navigation entry", async () => {
    await renderSidebar();

    expect(screen.getByRole("link", { name: "Loadbalance Strategies" })).toBeInTheDocument();
  });
});
