import { logger } from "log";

// ---------------------------------------------------------------------------
// 1. Multi-CDN Audit Metadata
//    In a multi-CDN environment, every response must carry consistent audit
//    headers so analytics platforms can attribute performance by provider,
//    trace requests end-to-end, and segment by cache status.
// ---------------------------------------------------------------------------
function injectAuditMetadata(request) {
  const traceId =
    "akai-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  request.setVariable("PMUSER_TRACE_ID", traceId);
}

// ---------------------------------------------------------------------------
// 2. QA Image Preview — Cache Bypass
//    When the creative team uploads a new product image, they need to verify
//    it on the live CDN without cache serving the old version. A QA token
//    triggers full cache key exclusion.
// ---------------------------------------------------------------------------
function handleQaBypass(request) {
  const qaToken = request.getHeader("X-QA-Token");
  if (qaToken && qaToken[0]) {
    // Add a unique value to the cache key so QA always gets fresh content
    const bustKey = "qa-" + Date.now();
    request.setVariable("PMUSER_QA_BUST", bustKey);
    request.cacheKey.includeVariable("PMUSER_QA_BUST");
    request.setVariable("PMUSER_CACHE_BYPASS", "qa-preview");
    logger.log(
      "QA preview bypass for: %s (token: %s)",
      request.path,
      qaToken[0]
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Origin Shield — Flash Sale / High-Traffic Protection
//    During high-traffic sale events, the origin needs protection from
//    traffic spikes. The EdgeWorker detects a sale event header and signals
//    Property Manager rules to extend TTLs at the edge.
// ---------------------------------------------------------------------------
function handleOriginShield(request) {
  const saleEvent = request.getHeader("X-Sale-Event");
  if (saleEvent && saleEvent[0]) {
    request.setVariable("PMUSER_SALE_EVENT", saleEvent[0]);
    request.setVariable("PMUSER_ORIGIN_SHIELD", "active");
    logger.log("Origin shield active — sale event: %s", saleEvent[0]);
  }
}

export function onClientRequest(request) {
  injectAuditMetadata(request);
  handleQaBypass(request);
  handleOriginShield(request);
}

export function onClientResponse(request, response) {
  // --- Multi-CDN audit headers (always injected) ---
  const traceId = request.getVariable("PMUSER_TRACE_ID") || "none";
  response.setHeader("X-CDN-Provider", "akamai");
  response.setHeader("X-Request-Trace-ID", traceId);
  response.setHeader("X-Edge-Timestamp", new Date().toISOString());
  response.setHeader("X-Edge-Worker-Version", "1.1.1");

  // --- QA cache bypass indicator ---
  const bypassReason = request.getVariable("PMUSER_CACHE_BYPASS");
  if (bypassReason) {
    response.setHeader("X-Cache-Bypass-Reason", bypassReason);
  }

  // --- Origin shield indicator ---
  const saleEvent = request.getVariable("PMUSER_SALE_EVENT");
  if (saleEvent) {
    response.setHeader("X-Origin-Shield", "active");
    response.setHeader("X-Sale-Event", saleEvent);
  }
}
