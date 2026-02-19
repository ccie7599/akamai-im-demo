import { EventEmitter } from "events"
import type { DS2LogEntry } from "../types/ds2.js"

class DS2Buffer extends EventEmitter {
  private buffer: DS2LogEntry[] = []
  private maxSize = 5000

  push(entry: DS2LogEntry) {
    this.buffer.push(entry)
    if (this.buffer.length > this.maxSize) {
      this.buffer = this.buffer.slice(-this.maxSize)
    }
    this.emit("entries", [entry])
  }

  pushBatch(entries: DS2LogEntry[]) {
    this.buffer.push(...entries)
    if (this.buffer.length > this.maxSize) {
      this.buffer = this.buffer.slice(-this.maxSize)
    }
    this.emit("entries", entries)
  }

  getRecent(limit: number): DS2LogEntry[] {
    return this.buffer.slice(-limit)
  }

  getStats() {
    const total = this.buffer.length
    const hits = this.buffer.filter((e) => e.cacheStatus === 1).length
    const avgLatency =
      this.buffer.reduce((sum, e) => sum + (e.turnAroundTimeMSec || 0), 0) /
      (total || 1)
    const geoBreakdown = this.buffer.reduce(
      (acc, e) => {
        const key = e.country || "unknown"
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return { total, cacheHitRatio: total ? hits / total : 0, avgLatency, geoBreakdown }
  }
}

export const ds2Buffer = new DS2Buffer()
