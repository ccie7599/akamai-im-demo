import express from "express"
import { createServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import cors from "cors"
import { config } from "./config.js"
import { ccuRouter } from "./routes/ccu.js"
import { ds2WebhookRouter } from "./routes/ds2-webhook.js"
import { edgeworkersRouter } from "./routes/edgeworkers.js"
import { performanceRouter } from "./routes/performance.js"
import { governanceRouter } from "./routes/governance.js"
import { setupDS2Stream } from "./websocket/ds2-stream.js"

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: config.corsOrigin, methods: ["GET", "POST"] },
})

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json({ limit: "5mb" }))

// Query-string token auth middleware
function requireToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!config.authToken || req.query.auth === config.authToken) {
    return next()
  }
  res.status(403).json({ error: "forbidden" })
}

// Health check (no token required)
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }))

// DS2 webhook (has its own Basic Auth)
app.use("/api/ds2", ds2WebhookRouter)

// All other API routes require token
app.use("/api/ccu", requireToken, ccuRouter)
app.use("/api/edgeworkers", requireToken, edgeworkersRouter)
app.use("/api/performance", requireToken, performanceRouter)
app.use("/api/governance", requireToken, governanceRouter)

// Socket.IO for live DS2 streaming
setupDS2Stream(io)

httpServer.listen(config.port, () => {
  console.log(`[IM Demo] Backend listening on port ${config.port}`)
  console.log(`[IM Demo] CORS origin: ${config.corsOrigin}`)
  console.log(`[IM Demo] EdgeGrid config: ${config.edgercPath} [${config.edgercSection}]`)
})
