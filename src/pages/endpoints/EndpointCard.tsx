import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Endpoint, ModelConfigListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Copy,
  Globe2,
  GripVertical,
  KeyRound,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import {
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

const DETAIL_PANEL_STYLE: CSSProperties = {
  boxShadow: "inset 0 1px 0 color-mix(in oklab, var(--background) 85%, transparent)",
};

const ENDPOINT_CARD_ACCENT_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at top left, color-mix(in oklab, var(--primary) 16%, transparent), transparent 58%)",
};

const ENDPOINT_CARD_HOVER_GLOW_STYLE: CSSProperties = {
  backgroundColor: "color-mix(in oklab, var(--primary) 22%, transparent)",
};

function EndpointActionButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 shrink-0 rounded-full border border-transparent bg-background/70 text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function EndpointDetailPanel({
  icon: Icon,
  label,
  value,
  helper,
  mono = false,
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
  helper?: string;
  mono?: boolean;
}) {
  return (
    <div
      className="rounded-xl border border-border/70 bg-background/80 p-4"
      style={DETAIL_PANEL_STYLE}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-sm text-foreground/95",
              mono ? "break-all font-mono" : undefined
            )}
          >
            {value}
          </p>
          {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}

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
  const createdAt = formatTime(endpoint.created_at, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border-border/70 bg-gradient-to-b from-card via-card to-muted/20 transition-[border-color,box-shadow,opacity,transform] hover:border-primary/20 hover:shadow-xl",
        isDragging && "border-dashed border-primary/40 bg-muted/30 opacity-30 shadow-none",
        isOverlay && "scale-[1.02] cursor-grabbing border-primary/50 shadow-2xl ring-2 ring-primary/30"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 -top-10 h-20 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
        style={ENDPOINT_CARD_HOVER_GLOW_STYLE}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={ENDPOINT_CARD_ACCENT_STYLE}
      />

      <CardHeader className="relative border-b border-border/60 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            ref={dragHandleRef ?? undefined}
            disabled={reorderDisabled || isOverlay}
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-xl border border-transparent bg-background/60 text-muted-foreground/60 transition-colors",
              !reorderDisabled && !isOverlay && "cursor-grab hover:text-foreground active:cursor-grabbing",
              (reorderDisabled || isOverlay) && "cursor-default opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label={`Drag to reorder endpoint ${endpoint.name}`}
            {...(dragHandleAttributes ?? {})}
            {...(dragHandleListeners ?? {})}
          >
            <GripVertical className="h-4.5 w-4.5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-2">
                  <CardTitle className="pr-2 text-base font-semibold whitespace-normal break-words [overflow-wrap:anywhere]">
                    {endpoint.name}
                  </CardTitle>
                </div>
              </div>

              {!isOverlay ? (
                <div className="flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-muted/35 p-1">
                  <EndpointActionButton
                    aria-label={`Duplicate endpoint ${endpoint.name}`}
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
                  </EndpointActionButton>
                  <EndpointActionButton
                    aria-label={`Edit endpoint ${endpoint.name}`}
                    onClick={() => {
                      void onEdit?.(endpoint);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </EndpointActionButton>
                  <EndpointActionButton
                    aria-label={`Delete endpoint ${endpoint.name}`}
                    className="text-destructive hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      void onDelete?.(endpoint);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </EndpointActionButton>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col gap-4 pt-5">
        <div className="grid gap-3">
          <EndpointDetailPanel icon={Globe2} label="Base URL" value={endpoint.base_url} mono />
          <EndpointDetailPanel icon={KeyRound} label="API Key" value={maskedKey} mono />
        </div>

        <div className="rounded-xl border border-border/70 bg-background/75 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Attached Models
              </p>
              <p className="mt-1 text-sm text-foreground/85">
                {models.length > 0 ? `${models.length} routing target${models.length === 1 ? "" : "s"}` : "No routing targets yet"}
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-border/70 bg-muted/30 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {models.length}
            </Badge>
          </div>

          {models.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {models.slice(0, 5).map((model) => (
                <Badge
                  key={model.id}
                  variant="outline"
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                    getModelBadgeClass(model)
                  )}
                >
                  {model.display_name || model.model_id}
                </Badge>
              ))}
              {models.length > 5 ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-border/70 bg-muted/30 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  +{models.length - 5} more
                </Badge>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm italic text-muted-foreground">Not attached to any models</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="relative mt-auto justify-start gap-3 border-t border-border/60 text-[11px] text-muted-foreground">
        <p>Created {createdAt}</p>
      </CardFooter>
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
