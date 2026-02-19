import { useState, useCallback, useMemo } from "react"
import { apiFetch } from "@/lib/api"

export interface ProbeResult {
  url: string
  timing: { ttfbMs: number; totalMs: number }
  responseSize: number
  statusCode: number
  contentType: string
  akamaiHeaders: Record<string, string>
  cacheStatus: string
  requestId: string
  index: number
  isColdStart: boolean
}

export function useLatencyProbe() {
  const [results, setResults] = useState<ProbeResult[]>([])
  const [running, setRunning] = useState(false)

  const runProbe = useCallback(
    async (url: string, count = 10, bypassFirst = true) => {
      setRunning(true)
      setResults([])

      for (let i = 0; i < count; i++) {
        const bypass = bypassFirst && i === 0
        // Use a unique imwidth on bypass request to guarantee an IM cache miss
        // without interfering with IM processing (non-IM params can break format negotiation)
        const probeUrl = bypass ? url.replace(/imwidth=(\d+)/, `imwidth=${1000 + (Date.now() % 9000)}`) : url
        try {
          const result = await apiFetch<Omit<ProbeResult, "index" | "isColdStart">>(
            `/api/performance/probe?url=${encodeURIComponent(probeUrl)}&bypass=${bypass}`
          )
          setResults((prev) => [...prev, { ...result, index: i, isColdStart: bypass }])
        } catch (err) {
          console.error(`Probe ${i} failed:`, err)
        }
        // Small delay for visual effect
        await new Promise((r) => setTimeout(r, 200))
      }

      setRunning(false)
    },
    []
  )

  const stats = useMemo(() => {
    if (!results.length) return null
    const cachedResults = results.filter((r) => !r.isColdStart)
    if (!cachedResults.length) return null
    const latencies = cachedResults.map((r) => r.timing.ttfbMs).sort((a, b) => a - b)
    return {
      avg: Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length),
      p50: latencies[Math.floor(latencies.length * 0.5)],
      p95: latencies[Math.floor(latencies.length * 0.95)],
      p99: latencies[Math.floor(latencies.length * 0.99)],
      coldStart: results.find((r) => r.isColdStart)?.timing.ttfbMs,
      firstRequest: results[0]?.timing.ttfbMs,
    }
  }, [results])

  const clearResults = useCallback(() => setResults([]), [])

  return { results, stats, running, runProbe, clearResults }
}
