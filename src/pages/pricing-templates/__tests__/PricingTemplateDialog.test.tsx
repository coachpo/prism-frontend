import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { PricingTemplateDialog } from "../PricingTemplateDialog";

describe("PricingTemplateDialog i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("prism.locale", "zh-CN");
  });

  it("renders localized pricing template dialog copy", () => {
    render(
      <LocaleProvider>
        <PricingTemplateDialog
          editingPricingTemplate={null}
          onClose={vi.fn()}
          onOpenChange={vi.fn()}
          onSave={vi.fn()}
          open={true}
          pricingTemplateForm={{
            name: "",
            description: "",
            pricing_currency_code: "USD",
            input_price: "0.10",
            output_price: "0.20",
            cached_input_price: "",
            cache_creation_price: "",
            reasoning_price: "",
            missing_special_token_price_policy: "MAP_TO_OUTPUT",
          }}
          pricingTemplateSaving={false}
          setPricingTemplateForm={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("新增价格模板")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存模板" })).toBeInTheDocument();
  });
});
