import { Router, type Request, type Response } from "express"

export const performanceRouter = Router()

// Probe a URL through Akamai and measure timing
performanceRouter.get("/probe", async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string
  if (!targetUrl) {
    return res.status(400).json({ error: "url query parameter required" })
  }

  const bypassCache = req.query.bypass === "true"
  const qaToken = req.query.qaToken as string
  const saleEvent = req.query.saleEvent as string

  const headers: Record<string, string> = {
    Pragma:
      "akamai-x-cache-on,akamai-x-cache-remote-on,akamai-x-check-cacheable,akamai-x-get-cache-key,akamai-x-get-true-cache-key,akamai-x-get-request-id",
  }
  if (bypassCache) {
    headers["Cache-Control"] = "no-cache"
  }
  if (qaToken) {
    headers["X-QA-Token"] = qaToken
  }
  if (saleEvent) {
    headers["X-Sale-Event"] = saleEvent
  }

  try {
    const start = performance.now()
    const response = await fetch(targetUrl, { headers })
    const ttfb = performance.now() - start
    const body = await response.arrayBuffer()
    const total = performance.now() - start

    const akamaiHeaders: Record<string, string> = {}
    for (const [key, value] of response.headers.entries()) {
      if (
        key.startsWith("x-") ||
        key === "server-timing" ||
        key === "server" ||
        key === "content-type" ||
        key === "content-length" ||
        key === "cache-control" ||
        key === "age"
      ) {
        akamaiHeaders[key] = value
      }
    }

    res.json({
      url: targetUrl,
      timing: { ttfbMs: Math.round(ttfb), totalMs: Math.round(total) },
      responseSize: body.byteLength,
      statusCode: response.status,
      contentType: response.headers.get("content-type"),
      akamaiHeaders,
      cacheStatus: akamaiHeaders["x-cache"] || "unknown",
      requestId: akamaiHeaders["x-akamai-request-id"] || "unknown",
    })
  } catch (err) {
    res.status(500).json({ error: String(err), url: targetUrl })
  }
})
