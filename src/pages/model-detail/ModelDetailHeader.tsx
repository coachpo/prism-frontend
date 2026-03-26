import { ArrowLeft, Pencil } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import type { ModelConfig } from "@/lib/types";

interface ModelDetailHeaderProps {
  model: ModelConfig;
  onBack: () => void;
  onEditModel: () => void;
}

export function ModelDetailHeader({ model, onBack, onEditModel }: ModelDetailHeaderProps) {
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="relative flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-md" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {model.display_name || model.model_id}
            </h1>
            {!model.display_name ? (
              <CopyButton
                value={model.model_id}
                label=""
                targetLabel="Model ID"
                aria-label={`Copy model ID ${model.model_id}`}
                variant="ghost"
                size="icon-xs"
                className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              />
            ) : null}
            <TypeBadge
              label={model.model_type}
              intent={model.model_type === "proxy" ? "accent" : "info"}
            />
            <StatusBadge
              label={model.is_enabled ? "Enabled" : "Disabled"}
              intent={model.is_enabled ? "success" : "muted"}
            />
          </div>
          {model.display_name ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono">{model.model_id}</span>
              <CopyButton
                value={model.model_id}
                label=""
                targetLabel="Model ID"
                aria-label={`Copy model ID ${model.model_id}`}
                variant="ghost"
                size="icon-xs"
                className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              />
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Model configuration and connection routing</p>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Edit Model"
          onClick={onEditModel}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
