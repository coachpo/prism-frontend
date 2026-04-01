"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type HeatmapDatum = {
  date: string | Date;
  value: number;
  meta?: unknown;
};

export type HeatmapCell = {
  date: Date;
  disabled: boolean;
  key: string;
  label: string;
  level: number;
  meta?: unknown;
  value: number;
};

export type LegendConfig = {
  className?: string;
  direction?: "row" | "column";
  lessText?: React.ReactNode;
  moreText?: React.ReactNode;
  placement?: "right" | "bottom";
  show?: boolean;
  showArrow?: boolean;
  showText?: boolean;
  swatchGap?: number;
  swatchSize?: number;
};

export type AxisLabelsConfig = {
  className?: string;
  minWeekSpacing?: number;
  monthFormat?: "short" | "long" | "numeric";
  show?: boolean;
  showMonths?: boolean;
  showWeekdays?: boolean;
  weekdayIndices?: number[];
};

export type HeatmapCalendarProps = {
  axisLabels?: boolean | AxisLabelsConfig;
  bare?: boolean;
  cellGap?: number;
  cellSize?: number;
  cellTestId?: string;
  className?: string;
  columns?: HeatmapCell[][];
  columnTestId?: string;
  data?: HeatmapDatum[];
  endDate?: Date;
  getCellDataAttributes?: (cell: HeatmapCell) => Record<string, string | undefined>;
  gridAriaLabel?: string;
  gridTestId?: string;
  legend?: boolean | LegendConfig;
  legendLessTestId?: string;
  legendMoreTestId?: string;
  legendSwatchTestId?: string;
  legendTestId?: string;
  levelClassNames?: string[];
  matrixOrientation?: "column-major" | "row-major";
  onCellClick?: (cell: HeatmapCell) => void;
  palette?: string[];
  rangeDays?: number;
  renderCellAriaLabel?: (cell: HeatmapCell) => string;
  renderLegend?: (args: {
    cellGap: number;
    cellSize: number;
    levelClassNames: string[];
    levelCount: number;
    palette?: string[];
  }) => React.ReactNode;
  renderTooltip?: (cell: HeatmapCell) => React.ReactNode;
  rootTestId?: string;
  rowTestId?: string;
  scrollTestId?: string;
  title?: React.ReactNode;
  tooltipTestId?: string;
  weekStartsOn?: 0 | 1;
};

export function HeatmapCalendar({
  axisLabels = true,
  bare = false,
  cellGap = 3,
  cellSize = 12,
  cellTestId,
  className,
  columns: providedColumns,
  columnTestId,
  data = [],
  endDate = new Date(),
  getCellDataAttributes,
  gridAriaLabel = "Heatmap calendar",
  gridTestId,
  legend = true,
  legendLessTestId,
  legendMoreTestId,
  legendSwatchTestId,
  legendTestId,
  levelClassNames,
  matrixOrientation = "column-major",
  onCellClick,
  palette,
  rangeDays = 365,
  renderCellAriaLabel,
  renderLegend,
  renderTooltip,
  rootTestId,
  rowTestId,
  scrollTestId,
  title = "Activity",
  tooltipTestId,
  weekStartsOn = 1,
}: HeatmapCalendarProps) {
  const levels = levelClassNames ?? [
    "bg-muted",
    "bg-primary/20",
    "bg-primary/35",
    "bg-primary/55",
    "bg-primary/75",
  ];
  const levelCount = palette?.length ? palette.length : levels.length;

  const legendConfig: LegendConfig =
    legend === true ? {} : legend === false ? { show: false } : legend;
  const axisConfig: AxisLabelsConfig =
    axisLabels === true ? {} : axisLabels === false ? { show: false } : axisLabels;

  const showAxis = axisConfig.show ?? true;
  const showWeekdays = axisConfig.showWeekdays ?? true;
  const showMonths = axisConfig.showMonths ?? true;
  const weekdayIndices = axisConfig.weekdayIndices ?? [1, 3, 5];
  const monthFormat = axisConfig.monthFormat ?? "short";
  const minWeekSpacing = axisConfig.minWeekSpacing ?? 3;

  const resolvedColumns = React.useMemo(() => {
    if (providedColumns?.length) {
      return providedColumns;
    }

    const end = startOfDay(endDate);
    const start = addDays(end, -(rangeDays - 1));
    const valueMap = new Map<string, { value: number; meta?: unknown }>();

    for (const item of data) {
      const date = typeof item.date === "string" ? new Date(item.date) : item.date;
      const key = toKey(date);
      const previous = valueMap.get(key);
      const nextValue = (previous?.value ?? 0) + (item.value ?? 0);
      valueMap.set(key, { meta: item.meta ?? previous?.meta, value: nextValue });
    }

    const firstWeek = startOfWeek(start, weekStartsOn);
    const totalDays = Math.ceil((end.getTime() - firstWeek.getTime()) / 86_400_000) + 1;
    const weeks = Math.ceil(totalDays / 7);
    const cells: HeatmapCell[] = [];

    for (let weekIndex = 0; weekIndex < weeks; weekIndex += 1) {
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const date = addDays(firstWeek, weekIndex * 7 + dayIndex);
        const inRange = date >= start && date <= end;
        const key = toKey(date);
        const value = inRange ? (valueMap.get(key)?.value ?? 0) : 0;
        const meta = inRange ? valueMap.get(key)?.meta : undefined;

        cells.push({
          date,
          disabled: !inRange,
          key,
          label: date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          level: clampLevel(getLevel(value), levelCount),
          meta,
          value,
        });
      }
    }

    return Array.from({ length: weeks }, (_, weekIndex) => cells.slice(weekIndex * 7, weekIndex * 7 + 7));
  }, [data, endDate, levelCount, providedColumns, rangeDays, weekStartsOn]);

  const monthLabels = React.useMemo(() => {
    if (!showAxis || !showMonths) {
      return [] as { colIndex: number; text: string }[];
    }

    const labels: { colIndex: number; text: string }[] = [];
    let lastLabeledWeek = -999;

    for (let columnIndex = 0; columnIndex < resolvedColumns.length; columnIndex += 1) {
      const column = resolvedColumns[columnIndex];
      const firstInColumn = column.find((cell) => !cell.disabled)?.date ?? column[0]?.date;
      const previousColumn = columnIndex > 0 ? resolvedColumns[columnIndex - 1] : null;
      const previousDate = previousColumn?.find((cell) => !cell.disabled)?.date ?? previousColumn?.[0]?.date;

      if (!firstInColumn) {
        continue;
      }

      const monthChanged = !previousDate || !sameMonth(firstInColumn, previousDate);

      if (monthChanged && columnIndex - lastLabeledWeek >= minWeekSpacing) {
        labels.push({ colIndex: columnIndex, text: formatMonth(firstInColumn, monthFormat) });
        lastLabeledWeek = columnIndex;
      }
    }

    return labels;
  }, [minWeekSpacing, monthFormat, resolvedColumns, showAxis, showMonths]);

  const showLegend = legendConfig.show ?? true;
  const placement = legendConfig.placement ?? "right";
  const direction = legendConfig.direction ?? "row";
  const showText = legendConfig.showText ?? true;
  const showArrow = legendConfig.showArrow ?? true;
  const lessText = legendConfig.lessText ?? "Less";
  const moreText = legendConfig.moreText ?? "More";
  const swatchSize = legendConfig.swatchSize ?? cellSize;
  const swatchGap = legendConfig.swatchGap ?? cellGap;

  const legendNode = renderLegend ? (
    renderLegend({
      cellGap,
      cellSize,
      levelClassNames: levels,
      levelCount,
      palette,
    })
  ) : !showLegend ? null : (
      <div className={cn("min-w-35", legendConfig.className)} data-testid={legendTestId}>
        {showText ? (
          <div className="mb-2 text-xs text-muted-foreground">
          <span data-testid={legendLessTestId}>{lessText}</span>
          {showArrow ? <span aria-hidden> → </span> : null}
          <span data-testid={legendMoreTestId}>{moreText}</span>
        </div>
      ) : null}

        <div
          className={cn("flex items-center", direction === "row" ? "flex-row" : "flex-col")}
          style={{ gap: `${swatchGap}px` }}
        >
          {Array.from({ length: levelCount }, (_, levelIndex) => String(levelIndex)).map((levelKey) => {
            const levelIndex = Number(levelKey);
            const levelClassName = levels[clampLevel(levelIndex, levels.length)];

            return (
            <div
              aria-hidden="true"
              className={cn("rounded-[3px]", !palette?.length && levelClassName)}
              data-level={levelKey}
              data-testid={legendSwatchTestId}
              key={levelKey}
              style={{
                ...(bgStyleForLevel(levelIndex, palette) ?? {}),
                height: swatchSize,
                width: swatchSize,
              }}
            />
          );
        })}
      </div>
    </div>
  );

  const weekdayLabelWidth = showAxis && showWeekdays ? 44 : 0;
  const isRowMajor = matrixOrientation === "row-major";

  const body = (
    <TooltipProvider delayDuration={0} disableHoverableContent>
      <div className={cn("flex gap-4 overflow-x-auto", placement === "bottom" && "flex-col")}>
        <div className={cn("min-w-0", axisConfig.className)}>
          {showAxis && showMonths ? (
            <div className="flex items-end" style={{ paddingLeft: weekdayLabelWidth }}>
              <div
                className="relative"
                style={{
                  height: 18,
                  width: resolvedColumns.length * (cellSize + cellGap) - cellGap,
                }}
              >
                {monthLabels.map((monthLabel) => (
                  <div
                    className="absolute text-xs text-muted-foreground"
                    key={monthLabel.colIndex}
                    style={{
                      left: monthLabel.colIndex * (cellSize + cellGap),
                      top: 0,
                    }}
                  >
                    {monthLabel.text}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex">
            {showAxis && showWeekdays ? (
              <div aria-hidden="true" className="mr-2 flex flex-col" style={{ gap: `${cellGap}px` }}>
                {Array.from({ length: 7 }, (_, rowIndex) => String(rowIndex)).map((rowKey) => {
                  const rowIndex = Number(rowKey);

                  return (
                  <div
                    className="flex items-center justify-end text-xs text-muted-foreground"
                    key={rowKey}
                    style={{ height: cellSize, width: 40 }}
                  >
                    {weekdayIndices.includes(rowIndex) ? weekdayLabelForIndex(rowIndex, weekStartsOn) : ""}
                  </div>
                  );
                })}
              </div>
            ) : null}

            <section
              aria-label={gridAriaLabel}
              className={cn("flex", isRowMajor && "flex-col")}
              data-testid={gridTestId}
              style={{ gap: `${cellGap}px` }}
            >
              {resolvedColumns.map((column) => (
                <div
                  className={cn("flex", isRowMajor ? "flex-row" : "flex-col")}
                  data-testid={isRowMajor ? rowTestId : columnTestId}
                  key={column.find((cell) => !cell.disabled)?.key ?? column.map((cell) => cell.key).join(":")}
                  style={{ gap: `${cellGap}px` }}
                >
                  {column.map((cell) => {
                    const cellDataAttributes = getCellDataAttributes?.(cell) ?? {};
                    const levelClassName = levels[clampLevel(cell.level, levels.length)];
                    const tooltipNode = renderTooltip ? renderTooltip(cell) : defaultTooltipNode(cell);
                    const accessibleName = renderCellAriaLabel
                      ? renderCellAriaLabel(cell)
                      : cell.disabled
                        ? "Outside range"
                        : `${cell.label}: ${cell.value}`;

                    return (
                      <Tooltip key={cell.key}>
                        <TooltipTrigger asChild>
                          <button
                            aria-label={accessibleName}
                            className={cn(
                              "rounded-[3px] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              !palette?.length && levelClassName,
                              cell.disabled && "cursor-default opacity-30 pointer-events-none",
                            )}
                            data-testid={cellTestId}
                            data-level={String(cell.level)}
                            disabled={cell.disabled}
                            onClick={() => {
                              if (!cell.disabled) {
                                onCellClick?.(cell);
                              }
                            }}
                            {...cellDataAttributes}
                            style={{
                              ...(bgStyleForLevel(cell.level, palette) ?? {}),
                              height: cellSize,
                              width: cellSize,
                            }}
                            type="button"
                          />
                        </TooltipTrigger>
                        <TooltipContent data-testid={tooltipTestId} side="top" sideOffset={6}>
                          {tooltipNode}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </section>
          </div>
        </div>

        {legendNode}
      </div>
    </TooltipProvider>
  );

  if (bare) {
    return (
      <div className={cn("space-y-3", className)} data-testid={rootTestId}>
        <div
          className="max-w-full overflow-x-auto overflow-y-hidden px-1 py-2 [scrollbar-width:none]"
          data-testid={scrollTestId}
        >
          {body}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(className)} data-testid={rootTestId}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none]"
          data-testid={scrollTestId}
        >
          {body}
        </div>
      </CardContent>
    </Card>
  );
}

function defaultTooltipNode(cell: HeatmapCell) {
  if (cell.disabled) {
    return "Outside range";
  }

  const unit = cell.value === 1 ? "event" : "events";

  return (
    <div className="text-sm">
      <div className="font-medium">
        {cell.value} {unit}
      </div>
      <div className="text-muted-foreground">{cell.label}</div>
    </div>
  );
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function addDays(date: Date, dayOffset: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + dayOffset);
  return nextDate;
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date, weekStartsOn: 0 | 1) {
  const nextDate = startOfDay(date);
  const weekday = nextDate.getDay();
  const diff = (weekday - weekStartsOn + 7) % 7;
  nextDate.setDate(nextDate.getDate() - diff);
  return nextDate;
}

function getLevel(value: number) {
  if (value <= 0) return 0;
  if (value <= 2) return 1;
  if (value <= 5) return 2;
  if (value <= 10) return 3;
  return 4;
}

function clampLevel(level: number, levelCount: number) {
  return Math.max(0, Math.min(levelCount - 1, level));
}

function bgStyleForLevel(level: number, palette?: string[]) {
  if (!palette?.length) {
    return undefined;
  }

  return { backgroundColor: palette[clampLevel(level, palette.length)] };
}

function sameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function formatMonth(date: Date, format: "short" | "long" | "numeric") {
  if (format === "numeric") {
    const year = String(date.getFullYear()).slice(-2);
    return `${date.getMonth() + 1}/${year}`;
  }

  return date.toLocaleDateString(undefined, { month: format });
}

function weekdayLabelForIndex(index: number, weekStartsOn: 0 | 1) {
  const actualDay = (weekStartsOn + index) % 7;
  const base = new Date(Date.UTC(2024, 0, 7 + actualDay));
  return base.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
}
