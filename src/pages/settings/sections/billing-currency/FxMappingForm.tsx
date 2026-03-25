import { Plus } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ModelConfigListItem } from "@/lib/types";

interface FxMappingFormProps {
  addMappingFxError: string | null;
  handleAddFxMapping: () => void;
  loadMappingConnections: (modelConfigId: number) => Promise<void>;
  mappingEndpointId: string;
  mappingEndpointOptions: { endpointId: number; label: string }[];
  mappingFxRate: string;
  mappingLoading: boolean;
  mappingModelId: string;
  nativeModels: ModelConfigListItem[];
  setMappingEndpointId: (id: string) => void;
  setMappingFxRate: (rate: string) => void;
  setMappingModelId: (id: string) => void;
}

export function FxMappingForm({
  addMappingFxError,
  handleAddFxMapping,
  loadMappingConnections,
  mappingEndpointId,
  mappingEndpointOptions,
  mappingFxRate,
  mappingLoading,
  mappingModelId,
  nativeModels,
  setMappingEndpointId,
  setMappingFxRate,
  setMappingModelId,
}: FxMappingFormProps) {
  const { locale } = useLocale();
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
      <div className="space-y-2">
        <Label>{locale === "zh-CN" ? "模型" : "Model"}</Label>
        <Select
          value={mappingModelId}
          onValueChange={(value) => {
            setMappingModelId(value);
            const selectedModel = nativeModels.find((model) => model.model_id === value);
            if (selectedModel) {
              void loadMappingConnections(selectedModel.id);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={locale === "zh-CN" ? "选择模型" : "Select model"} />
          </SelectTrigger>
          <SelectContent>
            {nativeModels.map((model) => (
              <SelectItem key={model.id} value={model.model_id}>
                {model.display_name || model.model_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{locale === "zh-CN" ? "端点" : "Endpoint"}</Label>
        <Select
          value={mappingEndpointId}
          onValueChange={setMappingEndpointId}
          disabled={!mappingModelId || mappingLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={mappingLoading ? (locale === "zh-CN" ? "正在加载端点..." : "Loading endpoints...") : locale === "zh-CN" ? "选择端点" : "Select endpoint"} />
          </SelectTrigger>
          <SelectContent>
            {mappingEndpointOptions.map((endpoint) => (
              <SelectItem key={endpoint.endpointId} value={String(endpoint.endpointId)}>
                #{endpoint.endpointId} {endpoint.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mapping-fx-rate">{locale === "zh-CN" ? "FX 汇率" : "FX rate"}</Label>
        <Input
          id="mapping-fx-rate"
          value={mappingFxRate}
          onChange={(event) => setMappingFxRate(event.target.value)}
          placeholder="1.000000"
          inputMode="decimal"
          aria-invalid={Boolean(addMappingFxError)}
          className={cn(addMappingFxError && "border-destructive")}
        />
        {addMappingFxError ? <p className="text-xs text-destructive">{addMappingFxError}</p> : null}
      </div>

      <div className="flex items-end">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleAddFxMapping}
          disabled={
            !mappingModelId ||
            !mappingEndpointId ||
            !mappingFxRate.trim() ||
            Boolean(addMappingFxError)
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {locale === "zh-CN" ? "新增映射" : "Add Mapping"}
        </Button>
      </div>
    </div>
  );
}
