import { useEffect, useState, useRef, useMemo } from "react"
import { ds2Socket } from "@/lib/socket"

export interface DS2LogEntry {
  reqId?: string
  reqTimeSec?: number
  cliIP?: string
  statusCode?: number
  bytes?: number
  totalBytes?: number
  cacheStatus?: number
  cacheable?: number
  country?: string
  city?: string
  state?: string
  edgeIP?: string
  reqHost?: string
  reqMethod?: string
  reqPath?: string
  queryStr?: string
  rspContentType?: string
  rspContentLen?: number
  turnAroundTimeMSec?: number
  transferTimeMSec?: number
  timeToFirstByte?: number
  UA?: string
  ewUsageInfo?: string
  ewExecutionInfo?: string
  [key: string]: unknown
}

export function useDS2Stream(maxEntries = 500) {
  const [logs, setLogs] = useState<DS2LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    ds2Socket.connect()

    ds2Socket.on("connect", () => setConnected(true))
    ds2Socket.on("disconnect", () => setConnected(false))

    ds2Socket.on("ds2:initial", (entries: DS2LogEntry[]) => {
      setLogs(entries.slice(-maxEntries))
    })

    ds2Socket.on("ds2:logs", (entries: DS2LogEntry[]) => {
      if (!pausedRef.current) {
        setLogs((prev) => [...prev, ...entries].slice(-maxEntries))
      }
    })

    return () => {
      ds2Socket.off("connect")
      ds2Socket.off("disconnect")
      ds2Socket.off("ds2:initial")
      ds2Socket.off("ds2:logs")
      ds2Socket.disconnect()
    }
  }, [maxEntries])

  const stats = useMemo(() => {
    const total = logs.length
    const hits = logs.filter((l) => l.cacheStatus === 1).length
    const avgLatency =
      logs.reduce((s, l) => s + (l.turnAroundTimeMSec || 0), 0) / (total || 1)
    const geoBreakdown = logs.reduce(
      (acc, l) => {
        const key = l.country || "unknown"
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    return { total, cacheHitRatio: total ? hits / total : 0, avgLatency, geoBreakdown }
  }, [logs])

  return { logs, connected, paused, setPaused, stats }
}
