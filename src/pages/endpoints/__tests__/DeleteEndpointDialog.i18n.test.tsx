import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { DeleteEndpointDialog } from "../DeleteEndpointDialog";

describe("DeleteEndpointDialog i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("prism.locale", "zh-CN");
  });

  it("renders localized delete dialog copy", () => {
    render(
      <LocaleProvider>
        <DeleteEndpointDialog
          deleteTarget={{
            id: 1,
            profile_id: 1,
            name: "Primary OpenAI",
            base_url: "https://api.openai.com/v1",
            has_api_key: true,
            masked_api_key: "sk-***",
            position: 0,
            created_at: "",
            updated_at: "",
          }}
          isDeletingEndpoint={false}
          onConfirm={vi.fn()}
          onOpenChange={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("删除端点")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
  });
});
