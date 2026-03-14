import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../AppSidebar";

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
  it("disables hit testing while hidden on mobile", () => {
    renderSidebar({ sidebarOpen: false });

    const sidebar = screen.getByRole("complementary", { name: "Primary navigation" });

    expect(sidebar).toHaveClass("pointer-events-none");
    expect(sidebar).toHaveClass("-translate-x-full");
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
});
