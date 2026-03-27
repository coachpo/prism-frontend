import { useState } from "react";
import { ApiFamilySelect } from "@/components/ApiFamilySelect";
import { VendorSelect } from "@/components/VendorSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/i18n/useLocale";
import type { LoadbalanceStrategy, ModelConfig, Vendor } from "@/lib/types";

interface ModelSettingsDialogProps {
  editLoadbalanceStrategyId: string;
  isOpen: boolean;
  loadbalanceStrategies: LoadbalanceStrategy[];
  onOpenChange: (open: boolean) => void;
  model: ModelConfig | null;
  vendors: Vendor[];
  setEditLoadbalanceStrategyId: (value: string) => void;
  handleEditModelSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function ModelSettingsDialog({
  editLoadbalanceStrategyId,
  isOpen,
  loadbalanceStrategies,
  onOpenChange,
  model,
  vendors,
  setEditLoadbalanceStrategyId,
  handleEditModelSubmit,
}: ModelSettingsDialogProps) {
  const { messages } = useLocale();
  const strategyCopy = messages.loadbalanceStrategyCopy;
  const fieldCopy = messages.common;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {model && (
          <ModelSettingsForm
            key={`${model.id}:${model.updated_at}`}
            editLoadbalanceStrategyId={editLoadbalanceStrategyId}
            fieldCopy={fieldCopy}
            handleEditModelSubmit={handleEditModelSubmit}
            loadbalanceStrategies={loadbalanceStrategies}
            model={model}
            onOpenChange={onOpenChange}
            setEditLoadbalanceStrategyId={setEditLoadbalanceStrategyId}
            strategyCopy={strategyCopy}
            vendors={vendors}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type ModelSettingsFormProps = {
  editLoadbalanceStrategyId: string;
  fieldCopy: {
    vendor: string;
    apiFamily: string;
  };
  handleEditModelSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  loadbalanceStrategies: LoadbalanceStrategy[];
  model: ModelConfig;
  onOpenChange: (open: boolean) => void;
  setEditLoadbalanceStrategyId: (value: string) => void;
  strategyCopy: {
    fillFirstLabel: string;
    fillFirstSummary: string;
    failoverLabel: string;
    failoverSummary: string;
    roundRobinLabel: string;
    roundRobinSummary: string;
    singleLabel: string;
  };
  vendors: Vendor[];
};

function ModelSettingsForm({
  editLoadbalanceStrategyId,
  fieldCopy,
  handleEditModelSubmit,
  loadbalanceStrategies,
  model,
  onOpenChange,
  setEditLoadbalanceStrategyId,
  strategyCopy,
  vendors,
}: ModelSettingsFormProps) {
  const [selectedVendorId, setSelectedVendorId] = useState(
    String(model.vendor_id ?? model.vendor?.id ?? ""),
  );
  const [selectedApiFamily, setSelectedApiFamily] = useState(
    model.api_family ?? "openai",
  );

  const handleApiFamilyChange = (value: string) => {
    setSelectedApiFamily(value as "openai" | "anthropic" | "gemini");
  };

  const getStrategyOptionText = (strategy: LoadbalanceStrategy) => {
    if (strategy.strategy_type === "fill-first") {
      return `${strategy.name} (${strategyCopy.fillFirstLabel} · ${strategyCopy.fillFirstSummary})`;
    }

    if (strategy.strategy_type === "round-robin") {
      return `${strategy.name} (${strategyCopy.roundRobinLabel} · ${strategyCopy.roundRobinSummary})`;
    }

    if (strategy.strategy_type === "failover") {
      return `${strategy.name} (${strategyCopy.failoverLabel} · ${strategyCopy.failoverSummary})`;
    }

    return `${strategy.name} (${strategyCopy.singleLabel})`;
  };

  return (
    <>
            <DialogHeader>
              <DialogTitle>Model Settings</DialogTitle>
              <DialogDescription>
                Update model identity, vendor metadata, and API family compatibility for this profile.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditModelSubmit} className="space-y-4">
              <input type="hidden" name="vendor_id" value={selectedVendorId} />
              <input type="hidden" name="api_family" value={selectedApiFamily} />

              <div className="space-y-2">
                <Label htmlFor="edit-display-name">Display Name</Label>
                <Input
                  id="edit-display-name"
                  name="display_name"
                  defaultValue={model.display_name || ""}
                  placeholder="Friendly name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model-id">Model ID</Label>
                <Input
                  id="edit-model-id"
                  name="model_id"
                  defaultValue={model.model_id}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{fieldCopy.vendor}</Label>
                  <VendorSelect
                    value={selectedVendorId}
                    onValueChange={setSelectedVendorId}
                    valueType="vendor_id"
                    vendors={vendors}
                    showAll={false}
                    placeholder="Select vendor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{fieldCopy.apiFamily}</Label>
                  <ApiFamilySelect
                     value={selectedApiFamily}
                    onValueChange={handleApiFamilyChange}
                     showAll={false}
                     placeholder="Select API family"
                   />
                </div>
              </div>
              {model.model_type === "proxy" && (
                <div className="space-y-2">
                  <Label>Proxy Targets</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage ordered proxy targets from the dedicated card on this page. Proxy targets must stay on the same API family even when the vendor metadata changes.
                  </p>
                </div>
              )}
              {model.model_type === "native" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-loadbalance-strategy">Loadbalance Strategy</Label>
                  {loadbalanceStrategies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No loadbalance strategies are available for this profile. Create one on the Loadbalance Strategies page first.
                    </p>
                  ) : (
                    <Select
                      value={editLoadbalanceStrategyId || undefined}
                      onValueChange={setEditLoadbalanceStrategyId}
                    >
                      <SelectTrigger id="edit-loadbalance-strategy">
                       <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadbalanceStrategies.map((strategy) => (
                          <SelectItem key={strategy.id} value={String(strategy.id)}>
                            {getStrategyOptionText(strategy)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
    </>
  );
}
