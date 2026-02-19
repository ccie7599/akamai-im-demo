import { Router, type Request, type Response } from "express"
import { akamaiApiRequest } from "../akamai/edgegrid-client.js"
import { readFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { config } from "../config.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const edgeworkersRouter = Router()

// Return the EdgeWorker source code for display
edgeworkersRouter.get("/code", (_req: Request, res: Response) => {
  try {
    const ewPath = path.join(__dirname, "../../../edgeworker/main.js")
    const code = readFileSync(ewPath, "utf-8")
    const bundlePath = path.join(__dirname, "../../../edgeworker/bundle.json")
    const bundleJson = JSON.parse(readFileSync(bundlePath, "utf-8"))
    res.json({ mainJs: code, bundleJson })
  } catch (err) {
    res.status(500).json({ error: `Failed to read EdgeWorker code: ${err}` })
  }
})

// List EdgeWorker versions
edgeworkersRouter.get("/versions", async (_req: Request, res: Response) => {
  if (!config.edgeworkerId) {
    return res.json({ versions: [], message: "No EdgeWorker ID configured" })
  }
  try {
    const response = await akamaiApiRequest(
      "GET",
      `/edgeworkers/v1/ids/${config.edgeworkerId}/versions`
    )
    res.json(response.body)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Get EdgeWorker execution report
edgeworkersRouter.get("/report", async (req: Request, res: Response) => {
  if (!config.edgeworkerId) {
    return res.json({ report: null, message: "No EdgeWorker ID configured" })
  }
  try {
    const start = req.query.start || new Date(Date.now() - 3600000).toISOString()
    const end = req.query.end || new Date().toISOString()
    const response = await akamaiApiRequest(
      "GET",
      `/edgeworkers/v1/ids/${config.edgeworkerId}/reports/1?start=${start}&end=${end}`
    )
    res.json(response.body)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})
