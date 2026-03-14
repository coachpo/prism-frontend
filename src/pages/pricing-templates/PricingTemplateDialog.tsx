import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PricingTemplate } from "@/lib/types";
import type { PricingTemplateFormState } from "./pricingTemplateFormState";

interface PricingTemplateDialogProps {
  editingPricingTemplate: PricingTemplate | null;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => Promise<void>;
  open: boolean;
  pricingTemplateForm: PricingTemplateFormState;
  pricingTemplateSaving: boolean;
  setPricingTemplateForm: Dispatch<SetStateAction<PricingTemplateFormState>>;
}

export function PricingTemplateDialog({
  editingPricingTemplate,
  onClose,
  onOpenChange,
  onSave,
  open,
  pricingTemplateForm,
  pricingTemplateSaving,
  setPricingTemplateForm,
}: PricingTemplateDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingPricingTemplate ? "Edit Pricing Template" : "Add Pricing Template"}
          </DialogTitle>
          <DialogDescription>Configure pricing rates per 1M tokens.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={pricingTemplateForm.name}
                onChange={(event) =>
                  setPricingTemplateForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="e.g., GPT-4o Standard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-currency">Currency Code</Label>
              <Input
                id="template-currency"
                value={pricingTemplateForm.pricing_currency_code}
                onChange={(event) =>
                  setPricingTemplateForm((prev) => ({
                    ...prev,
                    pricing_currency_code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="USD"
                maxLength={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description (Optional)</Label>
            <Input
              id="template-description"
              value={pricingTemplateForm.description}
              onChange={(event) =>
                setPricingTemplateForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Optional details about this template"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-md border bg-muted/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="template-input-price">Input Price (per 1M tokens)</Label>
              <Input
                id="template-input-price"
                value={pricingTemplateForm.input_price}
                onChange={(event) =>
                  setPricingTemplateForm((prev) => ({ ...prev, input_price: event.target.value }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-output-price">Output Price (per 1M tokens)</Label>
              <Input
                id="template-output-price"
                value={pricingTemplateForm.output_price}
                onChange={(event) =>
                  setPricingTemplateForm((prev) => ({ ...prev, output_price: event.target.value }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-md border bg-muted/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="template-cached-input-price">Cached Input Price (Optional)</Label>
              <Input
                id="template-cached-input-price"
                value={pricingTemplateForm.cached_input_price}
                onChange={(event) =>
                  setPricingTemplateForm((prev) => ({
                    ...prev,
                    cached_input_price: event.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-cache-creation-price">Cache Creation Price (Optional)</Label>
              <Input
                id="template-cache-creation-price"
                value={pricingTemplateForm.cache_creation_price}
                onChange={(event) =>
                  setPricingTemplateForm((prev) => ({
                    ...prev,
                    cache_creation_price: event.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-reasoning-price">Reasoning Price (Optional)</Label>
              <Input
                id="template-reasoning-price"
                value={pricingTemplateForm.reasoning_price}
                onChange={(event) =>
                  setPricingTemplateForm((prev) => ({
                    ...prev,
                    reasoning_price: event.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Missing Special Token Policy</Label>
            <Select
              value={pricingTemplateForm.missing_special_token_price_policy}
              onValueChange={(value: "MAP_TO_OUTPUT" | "ZERO_COST") =>
                setPricingTemplateForm((prev) => ({
                  ...prev,
                  missing_special_token_price_policy: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAP_TO_OUTPUT">Map to Output Price</SelectItem>
                <SelectItem value="ZERO_COST">Zero Cost</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How to price special tokens (like reasoning) if their specific price is not set.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void onSave()} disabled={pricingTemplateSaving}>
            {pricingTemplateSaving ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
