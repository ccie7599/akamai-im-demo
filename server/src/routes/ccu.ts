import { Router } from "express"
import { akamaiApiRequest } from "../akamai/edgegrid-client.js"
import { governanceLog } from "../store/governance-log.js"

export const ccuRouter = Router()

ccuRouter.post("/invalidate", async (req, res) => {
  const { urls, network = "production" } = req.body
  const startTime = Date.now()

  try {
    const response = await akamaiApiRequest(
      "POST",
      `/ccu/v3/invalidate/url/${network}`,
      { objects: urls }
    )

    const elapsed = Date.now() - startTime

    const action = governanceLog.add({
      action: "invalidate",
      urls,
      timestamp: new Date().toISOString(),
      apiResponse: response.body,
      latencyMs: elapsed,
      status: "complete",
    })

    res.json({
      success: true,
      action,
      apiRequest: {
        method: "POST",
        path: `/ccu/v3/invalidate/url/${network}`,
        body: { objects: urls },
      },
      apiResponse: response.body,
      latencyMs: elapsed,
    })
  } catch (err) {
    const elapsed = Date.now() - startTime
    governanceLog.add({
      action: "invalidate",
      urls,
      timestamp: new Date().toISOString(),
      apiResponse: null,
      latencyMs: elapsed,
      status: "error",
      error: String(err),
    })
    res.status(500).json({ success: false, error: String(err) })
  }
})

ccuRouter.post("/delete", async (req, res) => {
  const { urls, network = "production" } = req.body
  const startTime = Date.now()

  try {
    const response = await akamaiApiRequest(
      "POST",
      `/ccu/v3/delete/url/${network}`,
      { objects: urls }
    )
    const elapsed = Date.now() - startTime

    const action = governanceLog.add({
      action: "delete",
      urls,
      timestamp: new Date().toISOString(),
      apiResponse: response.body,
      latencyMs: elapsed,
      status: "complete",
    })

    res.json({
      success: true,
      action,
      apiRequest: {
        method: "POST",
        path: `/ccu/v3/delete/url/${network}`,
        body: { objects: urls },
      },
      apiResponse: response.body,
      latencyMs: elapsed,
    })
  } catch (err) {
    const elapsed = Date.now() - startTime
    governanceLog.add({
      action: "delete",
      urls,
      timestamp: new Date().toISOString(),
      apiResponse: null,
      latencyMs: elapsed,
      status: "error",
      error: String(err),
    })
    res.status(500).json({ success: false, error: String(err) })
  }
})
