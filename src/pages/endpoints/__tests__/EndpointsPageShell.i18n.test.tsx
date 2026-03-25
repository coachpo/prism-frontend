import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { EndpointsPage } from "@/pages/EndpointsPage";

vi.mock("../useEndpointsPageData", () => ({
  useEndpointsPageData: () => ({
    isLoading: false,
    endpoints: [],
    totalAttachedModels: 0,
    uniqueAttachedModels: 0,
    endpointsInUse: 0,
    setIsCreateOpen: vi.fn(),
    sensors: [],
    collisionDetection: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragCancel: vi.fn(),
    handleDragEnd: vi.fn(),
    endpointIds: [],
    endpointModels: {},
    duplicatingEndpointId: null,
    canReorder: false,
    handleDuplicateEndpoint: vi.fn(),
    setEditingEndpoint: vi.fn(),
    setDeleteTarget: vi.fn(),
    activeDragEndpoint: null,
    formatTime: vi.fn(),
    isCreateOpen: false,
    handleCreate: vi.fn(),
    editingEndpoint: null,
    handleUpdate: vi.fn(),
    deleteTarget: null,
    isDeletingEndpoint: false,
    handleDeleteDialogOpenChange: vi.fn(),
    handleDelete: vi.fn(),
  }),
}));

describe("EndpointsPage shell i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("prism.locale", "zh-CN");
  });

  it("renders localized page shell copy", () => {
    render(
      <LocaleProvider>
        <EndpointsPage />
      </LocaleProvider>,
    );

    expect(screen.getByText("端点")).toBeInTheDocument();
    expect(screen.getByText("管理按配置档案划分的 API 凭证和模型路由目标。")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "新增端点" }).length).toBeGreaterThan(0);
  });
});
