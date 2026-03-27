import { describe, expect, it } from "vitest";
import { buildRequestLogIngressLink } from "../requestLogLinks";

describe("buildRequestLogIngressLink", () => {
  it("builds request-log drilldown links from ingress_request_id", () => {
    expect(buildRequestLogIngressLink("ingress_req_42")).toBe(
      "/request-logs?ingress_request_id=ingress_req_42",
    );
  });
});
