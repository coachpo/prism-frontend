export function buildRequestLogIngressLink(ingressRequestId: string): string {
  if (!ingressRequestId) {
    return "/request-logs";
  }

  const params = new URLSearchParams();
  params.set("ingress_request_id", ingressRequestId);
  return `/request-logs?${params.toString()}`;
}
