import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LATENCY_BUCKETS } from "../queryParams";
import type {
  LatencyBucket,
  OutcomeFilter,
  SpecialTokenFilter,
  StreamFilter,
} from "../queryParams";

interface SecondaryFiltersGroupProps {
  latencyBucket: LatencyBucket;
  outcomeFilter: OutcomeFilter;
  resetOffset: () => void;
  setLatencyBucket: (bucket: LatencyBucket) => void;
  setOutcomeFilter: (filter: OutcomeFilter) => void;
  setSpecialTokenFilter: (filter: SpecialTokenFilter) => void;
  setStreamFilter: (filter: StreamFilter) => void;
  specialTokenFilter: SpecialTokenFilter;
  streamFilter: StreamFilter;
}

export function SecondaryFiltersGroup({
  latencyBucket,
  outcomeFilter,
  resetOffset,
  setLatencyBucket,
  setOutcomeFilter,
  setSpecialTokenFilter,
  setStreamFilter,
  specialTokenFilter,
  streamFilter,
}: SecondaryFiltersGroupProps) {
  return (
    <>
      <Select
        value={outcomeFilter}
        onValueChange={(next) => {
          setOutcomeFilter(next as OutcomeFilter);
          resetOffset();
        }}
      >
        <SelectTrigger className="h-8 w-full text-xs sm:w-[130px] [&_[data-slot=select-value]]:truncate">
          <SelectValue placeholder="Outcome" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Outcomes</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="error">Error</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={streamFilter}
        onValueChange={(next) => {
          setStreamFilter(next as StreamFilter);
          resetOffset();
        }}
      >
        <SelectTrigger className="h-8 w-full text-xs sm:w-[150px] [&_[data-slot=select-value]]:truncate">
          <SelectValue placeholder="Stream" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stream Types</SelectItem>
          <SelectItem value="stream">Streaming</SelectItem>
          <SelectItem value="non_stream">Non-streaming</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={latencyBucket}
        onValueChange={(next) => {
          setLatencyBucket(next as LatencyBucket);
          resetOffset();
        }}
      >
        <SelectTrigger className="h-8 w-full text-xs sm:w-[140px] [&_[data-slot=select-value]]:truncate">
          <SelectValue placeholder="Latency" />
        </SelectTrigger>
        <SelectContent>
          {LATENCY_BUCKETS.map((bucket) => (
            <SelectItem key={bucket.value} value={bucket.value}>
              {bucket.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={specialTokenFilter}
        onValueChange={(next) => {
          setSpecialTokenFilter(next as SpecialTokenFilter);
          resetOffset();
        }}
      >
        <SelectTrigger className="h-8 w-full text-xs sm:w-[190px] [&_[data-slot=select-value]]:truncate">
          <SelectValue placeholder="Special Tokens" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All token rows</SelectItem>
          <SelectItem value="has_cached">Has cached tokens</SelectItem>
          <SelectItem value="has_reasoning">Has reasoning tokens</SelectItem>
          <SelectItem value="has_any_special">Has any special token</SelectItem>
          <SelectItem value="missing_special">Missing special tokens</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
