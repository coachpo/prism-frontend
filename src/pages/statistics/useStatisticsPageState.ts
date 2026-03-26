import { useEffect, useState } from "react";
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
  apiFamily: string;
  setApiFamily: (value: string) => void;
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
  spendingApiFamily: string;
  setSpendingApiFamily: (value: string) => void;
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
  const initialOperationsApiFamily = searchParams.get("api_family");
  const initialSpendingApiFamily = searchParams.get("spending_api_family");

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
  const [apiFamily, setApiFamily] = useState<string>(
    initialOperationsApiFamily && initialOperationsApiFamily.trim() !== ""
      ? initialOperationsApiFamily
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
  const [spendingApiFamily, setSpendingApiFamily] = useState(
    initialSpendingApiFamily && initialSpendingApiFamily.trim() !== ""
      ? initialSpendingApiFamily
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
        setOrDelete("api_family", apiFamily, "all");
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

        setOrDelete("spending_api_family", spendingApiFamily, "all");
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
    apiFamily,
    connectionId,
    modelId,
    operationsStatusFilter,
    setSearchParams,
    specialTokenFilter,
    spendingApiFamily,
    spendingConnectionId,
    spendingFrom,
    spendingGroupBy,
    spendingLimit,
    spendingModelId,
    spendingOffset,
    spendingPreset,
    spendingTo,
    spendingTopN,
    timeRange,
  ]);

  useEffect(() => {
    void revision;
    queueMicrotask(() => {
      setSpendingOffset((current) => (current === 0 ? current : 0));
    });
  }, [revision]);

  const clearOperationsFilters = () => {
    setModelId("__all__");
    setApiFamily("all");
    setConnectionId("__all__");
    setTimeRange("24h");
    setSpecialTokenFilter("all");
    setOperationsStatusFilter("all");
  };

  const clearSpendingFilters = () => {
    setSpendingPreset("last_7_days");
    setSpendingFrom("");
    setSpendingTo("");
    setSpendingApiFamily("all");
    setSpendingModelId("");
    setSpendingConnectionId("");
    setSpendingGroupBy("model");
    setSpendingLimit(DEFAULT_SPENDING_LIMIT);
    setSpendingOffset(0);
    setSpendingTopN(DEFAULT_SPENDING_TOP_N);
  };

  return {
    activeTab,
    apiFamily,
    connectionId,
    modelId,
    operationsStatusFilter,
    setActiveTab,
    setApiFamily,
    setConnectionId,
    setModelId,
    setOperationsStatusFilter,
    setSpecialTokenFilter,
    setSpendingApiFamily,
    setSpendingConnectionId,
    setSpendingFrom,
    setSpendingGroupBy,
    setSpendingLimit,
    setSpendingModelId,
    setSpendingOffset,
    setSpendingPreset,
    setSpendingTo,
    setSpendingTopN,
    setTimeRange,
    specialTokenFilter,
    spendingApiFamily,
    spendingConnectionId,
    spendingFrom,
    spendingGroupBy,
    spendingLimit,
    spendingModelId,
    spendingOffset,
    spendingPreset,
    spendingTo,
    spendingTopN,
    timeRange,
    clearOperationsFilters,
    clearSpendingFilters,
  };
}
