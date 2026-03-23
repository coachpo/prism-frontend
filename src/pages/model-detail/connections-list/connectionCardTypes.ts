import type { ButtonHTMLAttributes } from "react";
import type {
  Connection,
  LoadbalanceCurrentStateItem,
  ModelConfig,
} from "@/lib/types";
import type { ConnectionDerivedMetrics } from "../modelDetailMetricsAndPaths";

export type FormatTime = (
  isoString: string,
  options?: Intl.DateTimeFormatOptions,
) => string;

export interface ConnectionCardProps {
  connection: Connection;
  model: ModelConfig;
  metrics24h: ConnectionDerivedMetrics | undefined;
  loadbalanceCurrentState: LoadbalanceCurrentStateItem | undefined;
  isChecking: boolean;
  isResettingCooldown: boolean;
  isFocused: boolean;
  formatTime: FormatTime;
  reorderDisabled: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  dragHandleAttributes?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleListeners?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: ((node: HTMLButtonElement | null) => void) | null;
  cardRef?: (node: HTMLDivElement | null) => void;
  onEdit: (connection: Connection) => void;
  onDelete: (id: number) => void;
  onHealthCheck: (id: number) => void;
  onResetCooldown: (connectionId: number) => void;
  onToggleActive: (connection: Connection) => void;
}

export type SortableConnectionCardProps = Omit<
  ConnectionCardProps,
  "dragHandleAttributes" | "dragHandleListeners" | "dragHandleRef" | "isDragging"
> & {
  reorderDisabled?: boolean;
};
