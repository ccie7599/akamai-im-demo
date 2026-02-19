import { useState, useCallback } from "react"
import { apiFetch } from "@/lib/api"

export interface GovernanceAction {
  id: string
  action: "invalidate" | "delete" | "replace"
  urls: string[]
  timestamp: string
  apiResponse: any
  latencyMs: number
  status: "pending" | "complete" | "error"
  error?: string
}

export function useGovernanceLog() {
  const [actions, setActions] = useState<GovernanceAction[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<GovernanceAction[]>("/api/governance/actions")
      setActions(data)
    } catch (err) {
      console.error("Failed to fetch governance log:", err)
    }
  }, [])

  const purge = useCallback(
    async (urls: string[], type: "invalidate" | "delete" = "invalidate") => {
      setLoading(true)
      try {
        const result = await apiFetch<{
          success: boolean
          action: GovernanceAction
          apiRequest: any
          apiResponse: any
          latencyMs: number
        }>(`/api/ccu/${type}`, {
          method: "POST",
          body: JSON.stringify({ urls }),
        })
        setActions((prev) => [...prev, result.action])
        return result
      } catch (err) {
        console.error("Purge failed:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const clear = useCallback(async () => {
    await apiFetch("/api/governance/actions", { method: "DELETE" })
    setActions([])
  }, [])

  return { actions, loading, refresh, purge, clear }
}
