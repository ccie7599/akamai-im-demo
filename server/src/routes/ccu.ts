import { Router } from "express"
import { akamaiApiRequest } from "../akamai/edgegrid-client.js"
import { governanceLog } from "../store/governance-log.js"
import { config } from "../config.js"

export const ccuRouter = Router()

async function ccuPurge(action: "invalidate" | "delete", urls: string[], network: string) {
  // Try URL-based purge first
  const urlResponse = await akamaiApiRequest(
    "POST",
    `/ccu/v3/${action}/url/${network}`,
    { objects: urls }
  )

  // If URL purge returns 403 (unauthorized arl) and we have a CP code, fall back
  if (urlResponse.statusCode === 403 && config.cpCode) {
    const cpCode = parseInt(config.cpCode, 10)
    const cpResponse = await akamaiApiRequest(
      "POST",
      `/ccu/v3/${action}/cpcode/${network}`,
      { objects: [cpCode] }
    )
    return {
      response: cpResponse,
      method: "cpcode",
      path: `/ccu/v3/${action}/cpcode/${network}`,
      body: { objects: [cpCode] },
    }
  }

  if (urlResponse.statusCode >= 400) {
    throw new Error(`CCU API error ${urlResponse.statusCode}: ${JSON.stringify(urlResponse.body)}`)
  }

  return {
    response: urlResponse,
    method: "url",
    path: `/ccu/v3/${action}/url/${network}`,
    body: { objects: urls },
  }
}

ccuRouter.post("/invalidate", async (req, res) => {
  const { urls, network = "production" } = req.body
  const startTime = Date.now()

  try {
    const result = await ccuPurge("invalidate", urls, network)
    const elapsed = Date.now() - startTime

    const logAction = governanceLog.add({
      action: "invalidate",
      urls,
      timestamp: new Date().toISOString(),
      apiResponse: result.response.body,
      latencyMs: elapsed,
      status: "complete",
    })

    res.json({
      success: true,
      action: logAction,
      apiRequest: {
        method: "POST",
        path: result.path,
        body: result.body,
      },
      apiResponse: result.response.body,
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
    const result = await ccuPurge("delete", urls, network)
    const elapsed = Date.now() - startTime

    const logAction = governanceLog.add({
      action: "delete",
      urls,
      timestamp: new Date().toISOString(),
      apiResponse: result.response.body,
      latencyMs: elapsed,
      status: "complete",
    })

    res.json({
      success: true,
      action: logAction,
      apiRequest: {
        method: "POST",
        path: result.path,
        body: result.body,
      },
      apiResponse: result.response.body,
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
