import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../AppSidebar";
import { VERSION_LABEL } from "../navigationProfileConfig";

type SidebarProps = React.ComponentProps<typeof AppSidebar>;

function renderSidebar(overrides: Partial<SidebarProps> = {}) {
  const props: SidebarProps = {
    activeProfileName: "Production",
    closeProfileSwitcher: vi.fn(),
    hasMismatch: false,
    selectedProfileName: "Production",
    setSidebarOpen: vi.fn(),
    sidebarOpen: true,
    ...overrides,
  };

  const view = render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <AppSidebar {...props} />
    </MemoryRouter>
  );

  return {
    ...view,
    props,
  };
}

describe("AppSidebar", () => {
  it("uses mobile-only hit testing disablement while hidden", () => {
    renderSidebar({ sidebarOpen: false });

    const sidebar = screen.getByRole("complementary", { name: "Primary navigation" });

    expect(sidebar).toHaveClass("pointer-events-auto");
    expect(sidebar).toHaveClass("translate-x-0");
    expect(sidebar).toHaveClass("max-lg:pointer-events-none");
    expect(sidebar).toHaveClass("max-lg:-translate-x-full");
    expect(sidebar).toHaveClass("lg:pointer-events-auto");
  });

  it("stays interactive when open and closes on navigation click", () => {
    const { props } = renderSidebar();

    const sidebar = screen.getByRole("complementary", { name: "Primary navigation" });
    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });

    expect(sidebar).toHaveClass("pointer-events-auto");

    fireEvent.click(dashboardLink);

    expect(props.closeProfileSwitcher).toHaveBeenCalledTimes(1);
    expect(props.setSidebarOpen).toHaveBeenCalledWith(false);
  });

  it("renders the version label in the 2.0 build format", () => {
    renderSidebar();

    expect(VERSION_LABEL).toMatch(/^2\.0\.[^-]+ - .+$/);
    expect(screen.getByText(VERSION_LABEL)).toBeInTheDocument();
  });

  it("includes the loadbalance strategies navigation entry", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Loadbalance Strategies" })).toBeInTheDocument();
  });
});
