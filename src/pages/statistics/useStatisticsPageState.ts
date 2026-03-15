import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SpendingGroupBy } from "@/lib/types";
import {
  DEFAULT_SPENDING_LIMIT,
  DEFAULT_SPENDING_TOP_N,
  OPERATIONS_SPECIAL_TOKEN_FILTERS,
  OPERATIONS_STATUS_FILTERS,
  OPERATIONS_TIME_RANGES,
  SPENDING_GROUP_BY_OPTIONS,
  SPENDING_PRESETS,
  STATISTICS_TABS,
  parseBoundedIntParam,
  parseConnectionFilterParam,
  parseEnumParam,
  parseNonNegativeIntParam,
  parseSpendingConnectionParam,
  parseSpendingLimitParam,
  type OperationsStatusFilter,
  type OperationsTimeRange,
  type SpecialTokenFilter,
  type SpendingPreset,
  type StatisticsTab,
} from "./queryParams";

export interface StatisticsPageState {
  activeTab: StatisticsTab;
  setActiveTab: (value: StatisticsTab) => void;
  modelId: string;
  setModelId: (value: string) => void;
  connectionId: string;
  setConnectionId: (value: string) => void;
  providerType: string;
  setProviderType: (value: string) => void;
  timeRange: OperationsTimeRange;
  setTimeRange: (value: OperationsTimeRange) => void;
  specialTokenFilter: SpecialTokenFilter;
  setSpecialTokenFilter: (value: SpecialTokenFilter) => void;
  operationsStatusFilter: OperationsStatusFilter;
  setOperationsStatusFilter: (value: OperationsStatusFilter) => void;
  spendingPreset: SpendingPreset;
  setSpendingPreset: (value: SpendingPreset) => void;
  spendingFrom: string;
  setSpendingFrom: (value: string) => void;
  spendingTo: string;
  setSpendingTo: (value: string) => void;
  spendingProviderType: string;
  setSpendingProviderType: (value: string) => void;
  spendingModelId: string;
  setSpendingModelId: (value: string) => void;
  spendingConnectionId: string;
  setSpendingConnectionId: (value: string) => void;
  spendingGroupBy: SpendingGroupBy;
  setSpendingGroupBy: (value: SpendingGroupBy) => void;
  spendingLimit: number;
  setSpendingLimit: (value: number) => void;
  spendingOffset: number;
  setSpendingOffset: (value: number) => void;
  spendingTopN: number;
  setSpendingTopN: (value: number) => void;
  clearOperationsFilters: () => void;
  clearSpendingFilters: () => void;
}

export function useStatisticsPageState(revision: number): StatisticsPageState {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialOperationsModelId = searchParams.get("model_id");
  const initialOperationsProviderType = searchParams.get("provider_type");
  const initialSpendingProviderType = searchParams.get("spending_provider_type");

  const [activeTab, setActiveTab] = useState<StatisticsTab>(() =>
    parseEnumParam(searchParams.get("tab"), STATISTICS_TABS, "operations")
  );
  const [modelId, setModelId] = useState(
    initialOperationsModelId && initialOperationsModelId.trim() !== ""
      ? initialOperationsModelId
      : "__all__"
  );
  const [connectionId, setConnectionId] = useState(() =>
    parseConnectionFilterParam(searchParams.get("connection_id"))
  );
  const [providerType, setProviderType] = useState<string>(
    initialOperationsProviderType && initialOperationsProviderType.trim() !== ""
      ? initialOperationsProviderType
      : "all"
  );
  const [timeRange, setTimeRange] = useState<OperationsTimeRange>(() =>
    parseEnumParam(searchParams.get("time_range"), OPERATIONS_TIME_RANGES, "24h")
  );
  const [specialTokenFilter, setSpecialTokenFilter] = useState<SpecialTokenFilter>(() =>
    parseEnumParam(
      searchParams.get("special_token_filter"),
      OPERATIONS_SPECIAL_TOKEN_FILTERS,
      "all"
    )
  );
  const [operationsStatusFilter, setOperationsStatusFilter] = useState<OperationsStatusFilter>(() =>
    parseEnumParam(searchParams.get("status_filter"), OPERATIONS_STATUS_FILTERS, "all")
  );
  const [spendingPreset, setSpendingPreset] = useState<SpendingPreset>(() =>
    parseEnumParam(searchParams.get("spending_preset"), SPENDING_PRESETS, "last_7_days")
  );
  const [spendingFrom, setSpendingFrom] = useState(searchParams.get("spending_from") ?? "");
  const [spendingTo, setSpendingTo] = useState(searchParams.get("spending_to") ?? "");
  const [spendingProviderType, setSpendingProviderType] = useState(
    initialSpendingProviderType && initialSpendingProviderType.trim() !== ""
      ? initialSpendingProviderType
      : "all"
  );
  const [spendingModelId, setSpendingModelId] = useState(searchParams.get("spending_model_id") ?? "");
  const [spendingConnectionId, setSpendingConnectionId] = useState(() =>
    parseSpendingConnectionParam(searchParams.get("spending_connection_id"))
  );
  const [spendingGroupBy, setSpendingGroupBy] = useState<SpendingGroupBy>(() =>
    parseEnumParam(searchParams.get("spending_group_by"), SPENDING_GROUP_BY_OPTIONS, "model")
  );
  const [spendingLimit, setSpendingLimit] = useState(() =>
    parseSpendingLimitParam(searchParams.get("spending_limit"))
  );
  const [spendingOffset, setSpendingOffset] = useState(() =>
    parseNonNegativeIntParam(searchParams.get("spending_offset"), 0)
  );
  const [spendingTopN, setSpendingTopN] = useState(() =>
    parseBoundedIntParam(searchParams.get("spending_top_n"), DEFAULT_SPENDING_TOP_N, 1, 50)
  );

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const setOrDelete = (key: string, value: string, defaultValue?: string) => {
          if (!value || (defaultValue !== undefined && value === defaultValue)) {
            next.delete(key);
            return;
          }
          next.set(key, value);
        };

        setOrDelete("tab", activeTab, "operations");
        setOrDelete("time_range", timeRange, "24h");
        setOrDelete("model_id", modelId, "__all__");
        setOrDelete("provider_type", providerType, "all");
        setOrDelete("connection_id", connectionId, "__all__");
        setOrDelete("special_token_filter", specialTokenFilter, "all");
        setOrDelete("status_filter", operationsStatusFilter, "all");

        setOrDelete("spending_preset", spendingPreset, "last_7_days");
        if (spendingPreset === "custom") {
          setOrDelete("spending_from", spendingFrom);
          setOrDelete("spending_to", spendingTo);
        } else {
          next.delete("spending_from");
          next.delete("spending_to");
        }

        setOrDelete("spending_provider_type", spendingProviderType, "all");
        setOrDelete("spending_model_id", spendingModelId);
        setOrDelete("spending_connection_id", spendingConnectionId);
        setOrDelete("spending_group_by", spendingGroupBy, "model");

        if (spendingLimit === DEFAULT_SPENDING_LIMIT) next.delete("spending_limit");
        else next.set("spending_limit", String(spendingLimit));

        if (spendingOffset <= 0) next.delete("spending_offset");
        else next.set("spending_offset", String(spendingOffset));

        if (spendingTopN === DEFAULT_SPENDING_TOP_N) next.delete("spending_top_n");
        else next.set("spending_top_n", String(spendingTopN));

        return next.toString() === prev.toString() ? prev : next;
      },
      { replace: true }
    );
  }, [
    activeTab,
    connectionId,
    modelId,
    operationsStatusFilter,
    providerType,
    setSearchParams,
    specialTokenFilter,
    spendingConnectionId,
    spendingFrom,
    spendingGroupBy,
    spendingLimit,
    spendingModelId,
    spendingOffset,
    spendingPreset,
    spendingProviderType,
    spendingTo,
    spendingTopN,
    timeRange,
  ]);

  useEffect(() => {
    queueMicrotask(() => {
      setSpendingOffset((current) => (current === 0 ? current : 0));
    });
  }, [revision]);

  const clearOperationsFilters = useCallback(() => {
    setModelId("__all__");
    setProviderType("all");
    setConnectionId("__all__");
    setTimeRange("24h");
    setSpecialTokenFilter("all");
    setOperationsStatusFilter("all");
  }, [
    setModelId,
    setProviderType,
    setConnectionId,
    setTimeRange,
    setSpecialTokenFilter,
    setOperationsStatusFilter,
  ]);

  const clearSpendingFilters = useCallback(() => {
    setSpendingPreset("last_7_days");
    setSpendingFrom("");
    setSpendingTo("");
    setSpendingProviderType("all");
    setSpendingModelId("");
    setSpendingConnectionId("");
    setSpendingGroupBy("model");
    setSpendingLimit(DEFAULT_SPENDING_LIMIT);
    setSpendingOffset(0);
    setSpendingTopN(DEFAULT_SPENDING_TOP_N);
  }, [
    setSpendingPreset,
    setSpendingFrom,
    setSpendingTo,
    setSpendingProviderType,
    setSpendingModelId,
    setSpendingConnectionId,
    setSpendingGroupBy,
    setSpendingLimit,
    setSpendingOffset,
    setSpendingTopN,
  ]);

  return {
    activeTab,
    connectionId,
    modelId,
    operationsStatusFilter,
    providerType,
    setActiveTab,
    setConnectionId,
    setModelId,
    setOperationsStatusFilter,
    setProviderType,
    setSpecialTokenFilter,
    setSpendingConnectionId,
    setSpendingFrom,
    setSpendingGroupBy,
    setSpendingLimit,
    setSpendingModelId,
    setSpendingOffset,
    setSpendingPreset,
    setSpendingProviderType,
    setSpendingTo,
    setSpendingTopN,
    setTimeRange,
    specialTokenFilter,
    spendingConnectionId,
    spendingFrom,
    spendingGroupBy,
    spendingLimit,
    spendingModelId,
    spendingOffset,
    spendingPreset,
    spendingProviderType,
    spendingTo,
    spendingTopN,
    timeRange,
    clearOperationsFilters,
    clearSpendingFilters,
  };
}
