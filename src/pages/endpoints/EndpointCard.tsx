import type { ButtonHTMLAttributes } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Endpoint, ModelConfigListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Copy, GripVertical, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  getEndpointHost,
  getMaskedApiKey,
  getModelBadgeClass,
} from "./endpointCardHelpers";

export interface EndpointCardViewProps {
  endpoint: Endpoint;
  formatTime: (isoString: string, options?: Intl.DateTimeFormatOptions) => string;
  models: ModelConfigListItem[];
  isDragging?: boolean;
  isOverlay?: boolean;
  reorderDisabled?: boolean;
  isDuplicating?: boolean;
  dragHandleAttributes?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleListeners?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: ((node: HTMLButtonElement | null) => void) | null;
  onDelete?: (endpoint: Endpoint) => void | Promise<void>;
  onDuplicate?: (endpoint: Endpoint) => void | Promise<void>;
  onEdit?: (endpoint: Endpoint) => void | Promise<void>;
}

type SortableEndpointCardProps = EndpointCardViewProps;

export function EndpointCardView({
  endpoint,
  formatTime,
  models,
  isDragging = false,
  isOverlay = false,
  reorderDisabled = false,
  isDuplicating = false,
  dragHandleAttributes,
  dragHandleListeners,
  dragHandleRef,
  onDelete,
  onDuplicate,
  onEdit,
}: EndpointCardViewProps) {
  const maskedKey = getMaskedApiKey(endpoint);

  return (
    <Card
      className={cn(
        "group flex h-full flex-col border-border/80 bg-card transition-[border-color,box-shadow,opacity] hover:border-border",
        isDragging && "border-dashed border-primary/40 bg-muted/30 opacity-30",
        isOverlay && "scale-[1.02] cursor-grabbing border-primary/50 shadow-2xl ring-2 ring-primary/30"
      )}
    >
      <CardHeader className="pb-3">
        <div className="grid min-w-0 grid-cols-[auto,minmax(0,1fr)] items-start gap-x-3 gap-y-2">
          <button
            type="button"
            ref={dragHandleRef ?? undefined}
            disabled={reorderDisabled || isOverlay}
            className={cn(
              "mt-0.5 flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-lg border border-transparent text-muted-foreground/60 transition-colors sm:h-9 sm:w-9",
              !reorderDisabled && !isOverlay && "cursor-grab hover:text-foreground active:cursor-grabbing",
              (reorderDisabled || isOverlay) && "cursor-default opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label={`Drag to reorder endpoint ${endpoint.name}`}
            {...(dragHandleAttributes ?? {})}
            {...(dragHandleListeners ?? {})}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="min-w-0 space-y-2">
            <CardTitle className="pr-2 text-base font-semibold whitespace-normal break-words [overflow-wrap:anywhere]">
              {endpoint.name}
            </CardTitle>
            <Badge
              variant="outline"
              className="max-w-full truncate border-border/70 bg-muted/30 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {getEndpointHost(endpoint.base_url)}
            </Badge>
          </div>

          {!isOverlay ? (
            <div className="col-start-2 flex min-w-0 flex-wrap items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Duplicate endpoint ${endpoint.name}`}
                className="h-9 w-9 shrink-0 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                disabled={isDuplicating}
                onClick={() => {
                  void onDuplicate?.(endpoint);
                }}
              >
                {isDuplicating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit endpoint ${endpoint.name}`}
                className="h-9 w-9 shrink-0 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                onClick={() => {
                  void onEdit?.(endpoint);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete endpoint ${endpoint.name}`}
                className="h-9 w-9 shrink-0 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  void onDelete?.(endpoint);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Base URL
            </p>
            <p className="mt-1 break-all font-mono text-xs text-foreground/90">{endpoint.base_url}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  API Key
                </p>
                <p className="mt-1 break-all font-mono text-xs text-foreground/90">{maskedKey}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Attached Models
            </p>
            <Badge
              variant="outline"
              className="rounded-full border-border/70 bg-background px-2 py-0 text-[10px] font-medium text-muted-foreground"
            >
              {models.length}
            </Badge>
          </div>
          {models.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {models.slice(0, 5).map((model) => (
                <Badge
                  key={model.id}
                  variant="outline"
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                    getModelBadgeClass(model)
                  )}
                >
                  {model.display_name || model.model_id}
                </Badge>
              ))}
              {models.length > 5 ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-border/70 bg-muted/30 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  +{models.length - 5} more
                </Badge>
              ) : null}
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground">Not attached to any models</p>
          )}
        </div>

        <div className="mt-auto border-t border-dashed border-border/70 pt-3">
          <p className="text-[11px] text-muted-foreground">
            Created {formatTime(endpoint.created_at, { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SortableEndpointCard({ endpoint, reorderDisabled = false, ...props }: SortableEndpointCardProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: endpoint.id,
    disabled: reorderDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <EndpointCardView
        {...props}
        endpoint={endpoint}
        isDragging={isDragging}
        reorderDisabled={reorderDisabled}
        dragHandleAttributes={attributes as ButtonHTMLAttributes<HTMLButtonElement>}
        dragHandleListeners={listeners as ButtonHTMLAttributes<HTMLButtonElement> | undefined}
        dragHandleRef={setActivatorNodeRef}
      />
    </div>
  );
}
