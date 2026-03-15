import { ProviderSelect } from "@/components/ProviderSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConnectionDropdownItem, Endpoint, Provider } from "@/lib/types";
import { getConnectionLabel } from "../formatters";

const SELECT_TRIGGER_CLASS_NAME =
  "h-8 w-full text-xs sm:w-[180px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate";

interface PrimaryFiltersGroupProps {
  connectionId: string;
  connections: ConnectionDropdownItem[];
  endpointId: string;
  endpoints: Endpoint[];
  modelId: string;
  models: { model_id: string; display_name: string | null }[];
  providers: Provider[];
  providerType: string;
  setConnectionId: (id: string) => void;
  setEndpointId: (id: string) => void;
  setModelId: (id: string) => void;
  setProviderType: (type: string) => void;
}

export function PrimaryFiltersGroup({
  connectionId,
  connections,
  endpointId,
  endpoints,
  modelId,
  models,
  providers,
  providerType,
  setConnectionId,
  setEndpointId,
  setModelId,
  setProviderType,
}: PrimaryFiltersGroupProps) {
  return (
    <>
      <Select
        value={modelId}
        onValueChange={setModelId}
      >
        <SelectTrigger className={SELECT_TRIGGER_CLASS_NAME}>
          <SelectValue placeholder="Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Models</SelectItem>
          {models.map((model) => (
            <SelectItem key={model.model_id} value={model.model_id}>
              {model.display_name || model.model_id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ProviderSelect
        value={providerType}
        onValueChange={setProviderType}
        providers={providers}
        className="h-8 w-full text-xs sm:w-[150px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate"
      />

      <Select
        value={connectionId}
        onValueChange={setConnectionId}
      >
        <SelectTrigger className={SELECT_TRIGGER_CLASS_NAME}>
          <SelectValue placeholder="Connection" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Connections</SelectItem>
          {connections.map((connection) => (
            <SelectItem key={connection.id} value={String(connection.id)}>
              {getConnectionLabel(connection)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={endpointId}
        onValueChange={setEndpointId}
      >
        <SelectTrigger className={SELECT_TRIGGER_CLASS_NAME}>
          <SelectValue placeholder="Endpoint" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Endpoints</SelectItem>
          {endpoints.map((endpoint) => (
            <SelectItem key={endpoint.id} value={String(endpoint.id)}>
              {endpoint.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
