import { Router, type Request, type Response } from "express"
import { config } from "../config.js"
import { ds2Buffer } from "../store/ds2-buffer.js"

export const ds2WebhookRouter = Router()

function validateBasicAuth(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  const credentials = Buffer.from(authHeader.slice(6), "base64").toString()
  const [username, password] = credentials.split(":")
  if (username !== config.ds2WebhookUsername || password !== config.ds2WebhookPassword) {
    return res.status(401).json({ error: "Invalid credentials" })
  }
  next()
}

// Receives DS2 log pushes from Akamai
ds2WebhookRouter.post("/webhook", validateBasicAuth, (req: Request, res: Response) => {
  const logs = Array.isArray(req.body) ? req.body : [req.body]

  // Handle DS2 access validation probe
  if (logs.length === 1 && logs[0]?.access_validation) {
    return res.status(200).json({ status: "ok" })
  }

  // DS2 sends all values as strings — coerce numeric fields
  const NUMERIC_FIELDS = [
    "reqTimeSec", "statusCode", "bytes", "totalBytes", "cacheStatus",
    "cacheable", "rspContentLen", "turnAroundTimeMSec", "transferTimeMSec",
    "timeToFirstByte", "dnsLookupTimeMSec",
  ]
  const parsed = logs.map((entry: any) => {
    const out = { ...entry }
    for (const field of NUMERIC_FIELDS) {
      if (out[field] != null && out[field] !== "") {
        out[field] = Number(out[field])
      }
    }
    return out
  })
  ds2Buffer.pushBatch(parsed)
  console.log(`[DS2] Received ${parsed.length} log entries`)
  res.status(200).json({ received: logs.length })
})

// Fetch buffered logs for initial page load
ds2WebhookRouter.get("/recent", (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  res.json(ds2Buffer.getRecent(limit))
})

// Get aggregate stats
ds2WebhookRouter.get("/stats", (_req: Request, res: Response) => {
  res.json(ds2Buffer.getStats())
})
