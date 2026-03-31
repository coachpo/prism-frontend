import { render, screen } from "@testing-library/react";
import { Fragment } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const TEST_APP_VERSION = "9.8.7";
const TEST_GIT_RUN_NUMBER = "123";
const TEST_GIT_REVISION = "deadbee";

async function renderSidebar({
  path = "/dashboard",
  ...overrides
}: Record<string, unknown> & { path?: string } = {}) {
  vi.stubEnv("VITE_APP_VERSION", TEST_APP_VERSION);
  vi.stubEnv("VITE_GIT_RUN_NUMBER", TEST_GIT_RUN_NUMBER);
  vi.stubEnv("VITE_GIT_REVISION", TEST_GIT_REVISION);
  vi.resetModules();

  const [{ AppSidebar }, { VERSION_LABEL }, { LocaleProvider }, sidebarUiModule] = await Promise.all([
    import("../AppSidebar"),
    import("../navigationProfileConfig"),
    import("@/i18n/LocaleProvider"),
    import("@/components/ui/sidebar").catch(() => null),
  ]);

  const props = {
    activeProfileName: "Production",
    closeProfileSwitcher: vi.fn(),
    hasMismatch: false,
    selectedProfileName: "Production",
    ...overrides,
  };

  const Sidebar = AppSidebar as React.ComponentType<Record<string, unknown>>;
  const sidebarTree = <Sidebar {...props} />;
  const tree = sidebarUiModule ? (
    <sidebarUiModule.SidebarProvider defaultOpen>
      {sidebarTree}
    </sidebarUiModule.SidebarProvider>
  ) : (
    <Fragment>{sidebarTree}</Fragment>
  );

  const view = render(
    <LocaleProvider>
      <MemoryRouter initialEntries={[path]}>
        {tree}
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
  it("renders the provider sidebar shell selectors without a duplicate collapse toggle", async () => {
    await renderSidebar();

    expect(screen.getByTestId("shell-sidebar")).toBeInTheDocument();
    expect(screen.queryByTestId("shell-sidebar-collapse-toggle")).not.toBeInTheDocument();
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

  it("includes the monitoring navigation entry", async () => {
    await renderSidebar();

    expect(screen.getByRole("link", { name: "Monitoring" })).toBeInTheDocument();
  });

  it("keeps the current route visible inside the sidebar shell", async () => {
    await renderSidebar({ path: "/request-logs" });

    expect(screen.getByRole("link", { name: "Request Logs" })).toHaveAttribute("aria-current", "page");
  });
});
