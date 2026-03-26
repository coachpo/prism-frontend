import { describe, expect, it } from "vitest";
import {
  DEFAULTS,
  parsePageState,
  stateToParams,
  timeRangeToFromTime,
  type RequestLogPageState,
} from "../queryParams";

function createState(overrides: Partial<RequestLogPageState> = {}): RequestLogPageState {
  return {
    ingress_request_id: "",
    model_id: "",
    api_family: "",
    connection_id: "",
    endpoint_id: "",
    time_range: DEFAULTS.time_range,
    status_family: DEFAULTS.status_family,
    search: "",
    outcome_filter: DEFAULTS.outcome_filter,
    stream_filter: DEFAULTS.stream_filter,
    latency_bucket: DEFAULTS.latency_bucket,
    token_min: "",
    token_max: "",
    priced_only: DEFAULTS.priced_only,
    billable_only: DEFAULTS.billable_only,
    special_token_filter: "",
    view: DEFAULTS.view,
    triage: DEFAULTS.triage,
    limit: DEFAULTS.limit,
    offset: DEFAULTS.offset,
    request_id: "",
    detail_tab: DEFAULTS.detail_tab,
    ...overrides,
  };
}

describe("request log query params", () => {
  it("round-trips non-default state, including new filter controls", () => {
    const state = createState({
      model_id: "gpt-5.4",
      ingress_request_id: "ingress_req_42",
      api_family: "openai",
      connection_id: "42",
      endpoint_id: "99",
      time_range: "7d",
      status_family: "5xx",
      search: "timeout",
      outcome_filter: "error",
      stream_filter: "yes",
      latency_bucket: "slow",
      token_min: "100",
      token_max: "500",
      priced_only: true,
      billable_only: true,
      special_token_filter: "reasoning",
      view: "compact",
      triage: true,
      limit: 25,
      offset: 50,
      request_id: "1234",
      detail_tab: "audit",
    });

    const params = stateToParams(state);

    expect(params.get("special_token_filter")).toBe("reasoning");
    expect(params.get("status_family")).toBe("5xx");
    expect(params.get("api_family")).toBe("openai");
    expect(params.get("priced_only")).toBe("true");
    expect(params.get("billable_only")).toBe("true");
    expect(params.get("triage")).toBe("true");
    expect(parsePageState(params)).toEqual(state);
  });

  it("omits default values from the URL", () => {
    const params = stateToParams(createState());

    expect(params.toString()).toBe("");
  });

  it("returns undefined for the all-time range", () => {
    expect(timeRangeToFromTime("all")).toBeUndefined();
    expect(timeRangeToFromTime("24h")).toMatch(/T/);
  });
});
