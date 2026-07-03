/**
 * Best-effort client IP from proxy headers. On Vercel the real client IP is in
 * `x-forwarded-for` (first hop); `x-real-ip` is a fallback. Used as a rate-limit
 * key. Note: guests in one venue often share a NAT IP (restaurant Wi-Fi), so an
 * IP key should only be a coarse DoS backstop — per-resource keys (e.g. table)
 * carry the real anti-spam weight.
 */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}
