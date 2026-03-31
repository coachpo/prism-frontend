import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { getDefaultRoutingPolicyDraft } from "../loadbalanceStrategyFormState";
import { LoadbalanceStrategiesPage } from "@/pages/LoadbalanceStrategiesPage";

vi.mock("@/context/ProfileContext", () => ({
  useProfileContext: () => ({
    revision: 1,
    selectedProfile: { id: 1, name: "Default" },
  }),
}));

vi.mock("../useLoadbalanceStrategiesPageData", () => ({
  useLoadbalanceStrategiesPageData: () => ({
    loadbalanceStrategies: [],
    loadbalanceStrategiesLoading: false,
    loadbalanceStrategyPreparingEditId: null,
    openCreateLoadbalanceStrategyDialog: vi.fn(),
    handleDeleteLoadbalanceStrategyClick: vi.fn(),
    handleEditLoadbalanceStrategy: vi.fn(),
    editingLoadbalanceStrategy: null,
    loadbalanceStrategyForm: {
      name: "",
      routing_policy: getDefaultRoutingPolicyDraft(),
    },
    loadbalanceStrategySaving: false,
    closeLoadbalanceStrategyDialog: vi.fn(),
    setLoadbalanceStrategyDialogOpen: vi.fn(),
    handleSaveLoadbalanceStrategy: vi.fn(),
    loadbalanceStrategyDialogOpen: false,
    setLoadbalanceStrategyForm: vi.fn(),
    deleteLoadbalanceStrategyConfirm: null,
    loadbalanceStrategyDeleting: false,
    setDeleteLoadbalanceStrategyConfirm: vi.fn(),
    handleDeleteLoadbalanceStrategy: vi.fn(),
  }),
}));

describe("LoadbalanceStrategiesPage shell i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("prism.locale", "zh-CN");
  });

  it("renders localized page shell copy", () => {
    render(
      <LocaleProvider>
        <LoadbalanceStrategiesPage />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "负载均衡策略" })).toBeInTheDocument();
    expect(screen.getByText("管理此配置档案中可复用的原生模型自适应路由策略")).toBeInTheDocument();
    expect(screen.getByText("配置档案作用域设置")).toBeInTheDocument();
  });
});
