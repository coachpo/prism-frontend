import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { LoginPage } from "../LoginPage";

const loginMock = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn(), theme: "system" }),
}));

vi.mock("@/context/useAuth", () => ({
  useAuth: () => ({
    authEnabled: true,
    authenticated: false,
    loading: false,
    login: loginMock,
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/webauthn", () => ({
  authenticateWithPasskey: vi.fn(),
  isWebAuthnSupported: vi.fn(() => true),
}));

vi.mock("@/components/ui/topography", () => ({
  TopographyBackground: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders language controls and locale-backed auth copy", () => {
    render(
      <LocaleProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </LocaleProvider>,
    );

    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "简体中文" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
  });

  it("changes login copy when the locale changes and persists it", () => {
    render(
      <LocaleProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "简体中文" }));

    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByText("或继续使用")).toBeInTheDocument();
    expect(localStorage.getItem("prism.locale")).toBe("zh-CN");
  });

  it("localizes the session duration options when switching to Chinese", () => {
    render(
      <LocaleProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "简体中文" }));

    expect(screen.getAllByText("当前浏览器会话").length).toBeGreaterThan(0);
    expect(screen.getByText("7 天")).toBeInTheDocument();
    expect(screen.getByText("30 天")).toBeInTheDocument();
    expect(screen.queryByText("7 days")).not.toBeInTheDocument();
    expect(screen.queryByText("30 days")).not.toBeInTheDocument();
  });

  it("shows the locale-backed loading fallback in App route suspense", async () => {
    const AppModule = await import("@/App");
    window.history.pushState({}, "", "/login");
    const view = render(
      <LocaleProvider>
        <AppModule.default />
      </LocaleProvider>,
    );

    expect(screen.getByText(/loading application/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    view.unmount();
  });
});
