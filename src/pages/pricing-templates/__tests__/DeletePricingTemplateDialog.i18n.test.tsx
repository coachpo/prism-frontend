import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { DeletePricingTemplateDialog } from "../DeletePricingTemplateDialog";

describe("DeletePricingTemplateDialog i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("prism.locale", "zh-CN");
  });

  it("renders localized delete dialog copy", () => {
    render(
      <LocaleProvider>
        <DeletePricingTemplateDialog
          deletePricingTemplateConfirm={{
            id: 1,
            profile_id: 1,
            name: "demo-template",
            version: 1,
            description: null,
            pricing_currency_code: "USD",
            pricing_unit: "PER_1M",
            input_price: "0.10",
            output_price: "0.20",
            cached_input_price: null,
            cache_creation_price: null,
            reasoning_price: null,
            missing_special_token_price_policy: "MAP_TO_OUTPUT",
            created_at: "",
            updated_at: "",
          }}
          deletePricingTemplateConflict={null}
          onClose={vi.fn()}
          onDelete={vi.fn()}
          pricingTemplateDeleting={false}
          pricingTemplateUsageLoading={false}
          pricingTemplateUsageRows={[]}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("删除价格模板")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
  });
});
