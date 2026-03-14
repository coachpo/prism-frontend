import type { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CostingSettingsUpdate } from "@/lib/types";

interface ReportingCurrencyCardProps {
  costingForm: CostingSettingsUpdate;
  normalizedCurrentCosting: CostingSettingsUpdate;
  setCostingForm: Dispatch<SetStateAction<CostingSettingsUpdate>>;
}

export function ReportingCurrencyCard({
  costingForm,
  normalizedCurrentCosting,
  setCostingForm,
}: ReportingCurrencyCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-3">
        <Label htmlFor="report-currency-code">Reporting currency</Label>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="report-currency-code" className="text-xs text-muted-foreground">
              Code
            </Label>
            <Input
              id="report-currency-code"
              maxLength={3}
              value={costingForm.report_currency_code}
              onChange={(event) =>
                setCostingForm((prev) => ({
                  ...prev,
                  report_currency_code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="USD"
              className="w-28"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="report-currency-symbol" className="text-xs text-muted-foreground">
              Symbol
            </Label>
            <Input
              id="report-currency-symbol"
              maxLength={5}
              value={costingForm.report_currency_symbol}
              onChange={(event) =>
                setCostingForm((prev) => ({
                  ...prev,
                  report_currency_symbol: event.target.value,
                }))
              }
              placeholder="$"
              className="w-24"
            />
          </div>
          <p className="pb-2 text-sm font-medium">
            Reporting currency: {normalizedCurrentCosting.report_currency_code || "---"} (
            {normalizedCurrentCosting.report_currency_symbol || "-"})
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Used for spending reports and dashboards.</p>
      </div>
    </div>
  );
}
