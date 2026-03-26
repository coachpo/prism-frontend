import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Route, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ProxyTarget } from "@/lib/types";
import { appendProxyTarget, moveProxyTarget, normalizeProxyTargets, removeProxyTarget } from "../models/modelFormState";

interface ProxyTargetsCardProps {
  availableTargets: { modelId: string; label: string }[];
  proxyTargets: ProxyTarget[];
  saving: boolean;
  onSave: (proxyTargets: ProxyTarget[]) => void | Promise<void>;
}

export function ProxyTargetsCard({
  availableTargets,
  proxyTargets,
  saving,
  onSave,
}: ProxyTargetsCardProps) {
  const [draftTargets, setDraftTargets] = useState<ProxyTarget[]>(() => normalizeProxyTargets(proxyTargets));

  useEffect(() => {
    setDraftTargets(normalizeProxyTargets(proxyTargets));
  }, [proxyTargets]);

  const remainingTargets = useMemo(() => {
    const selectedTargetIds = new Set(draftTargets.map((target) => target.target_model_id));
    return availableTargets.filter((target) => !selectedTargetIds.has(target.modelId));
  }, [availableTargets, draftTargets]);

  const resolveTargetLabel = (targetModelId: string) => {
    return availableTargets.find((target) => target.modelId === targetModelId)?.label ?? targetModelId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-4 w-4" />
          Proxy Targets
        </CardTitle>
        <CardDescription>
          Ordered priority routing
        </CardDescription>
        <p className="text-sm text-muted-foreground">
          The first available target wins, then that native model handles connection failover.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {draftTargets.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            No proxy targets configured.
          </div>
        ) : (
          <div className="space-y-2">
            {draftTargets.map((target, index) => (
              <div key={target.target_model_id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{resolveTargetLabel(target.target_model_id)}</p>
                  <p className="text-xs text-muted-foreground">Priority {index + 1}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Move target ${target.target_model_id} up`}
                    disabled={index === 0}
                    onClick={() => setDraftTargets((current) => moveProxyTarget(current, index, index - 1))}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Move target ${target.target_model_id} down`}
                    disabled={index === draftTargets.length - 1}
                    onClick={() => setDraftTargets((current) => moveProxyTarget(current, index, index + 1))}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Remove target ${target.target_model_id}`}
                    onClick={() => setDraftTargets((current) => removeProxyTarget(current, target.target_model_id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {remainingTargets.length === 0
              ? "All available native models are already included."
              : `${remainingTargets.length} more native targets available.`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={remainingTargets.length === 0}
              onClick={() => {
                const nextTarget = remainingTargets[0];
                if (!nextTarget) {
                  return;
                }

                setDraftTargets((current) => appendProxyTarget(current, nextTarget.modelId));
              }}
            >
              Add Target
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void onSave(normalizeProxyTargets(draftTargets))}
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save Proxy Targets
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
