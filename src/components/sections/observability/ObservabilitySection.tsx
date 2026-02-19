import { useState, useRef, useEffect, useMemo } from "react"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { MetricCard } from "@/components/shared/MetricCard"
import { SECTIONS, IMAGE_BASE_URL, PRODUCT_CATALOG } from "@/lib/constants"
import { cn, formatBytes, formatDuration, formatPercent } from "@/lib/utils"
import { useDS2Stream, type DS2LogEntry } from "@/hooks/use-ds2-stream"
import { apiFetch } from "@/lib/api"
import { Activity, Wifi, WifiOff, Pause, Play, Filter, RefreshCw, Gauge, Globe, Server, Loader2, Database, Zap, TrendingDown, Search, BarChart3 } from "lucide-react"

const section = SECTIONS[1]

function LogEntryRow({ entry }: { entry: DS2LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const cacheHit = entry.cacheStatus === 1
  const timestamp = entry.reqTimeSec
    ? new Date(entry.reqTimeSec * 1000).toLocaleTimeString()
    : "—"

  return (
    <div
      className={cn(
        "border-b border-border-subtle hover:bg-surface-raised/50 cursor-pointer transition-colors animate-slide-in",
        expanded && "bg-surface-raised/30"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3 px-4 py-2 font-mono text-xs">
        <span className="text-text-muted w-20 shrink-0">{timestamp}</span>
        <span className="text-text-secondary w-12 shrink-0">{entry.reqMethod || "GET"}</span>
        <span className="text-text flex-1 truncate">{entry.reqPath || "/"}{entry.queryStr ? `?${entry.queryStr}` : ""}</span>
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
            cacheHit
              ? "bg-success-muted text-success"
              : "bg-warning-muted text-warning"
          )}
        >
          {cacheHit ? "HIT" : "MISS"}
        </span>
        <span className="text-text-muted w-20 shrink-0 text-right">
          {entry.country || "—"}/{entry.city?.slice(0, 8) || "—"}
        </span>
        <span className="text-primary w-16 shrink-0 text-right">
          {entry.turnAroundTimeMSec != null ? `${Math.round(entry.turnAroundTimeMSec)}ms` : "—"}
        </span>
        <span className="text-text-secondary w-16 shrink-0 text-right">
          {entry.bytes ? formatBytes(entry.bytes) : "—"}
        </span>
        <span className="text-text-muted w-12 shrink-0 text-right">
          {entry.rspContentType?.split("/")[1]?.split(";")[0]?.toUpperCase() || "—"}
        </span>
      </div>
      {expanded && (
        <div className="px-4 pb-3">
          <pre className="text-[10px] font-mono text-text-muted bg-background rounded-lg p-3 overflow-auto max-h-40">
            {JSON.stringify(entry, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function ObservabilitySection() {
  const { logs, connected, paused, setPaused, stats } = useDS2Stream(500)
  const [cacheFilter, setCacheFilter] = useState<"all" | "hit" | "miss">("all")
  const [searchFilter, setSearchFilter] = useState("")
  const logEndRef = useRef<HTMLDivElement>(null)

  const filteredLogs = useMemo(() => {
    let filtered = logs
    if (cacheFilter === "hit") filtered = filtered.filter((l) => l.cacheStatus === 1)
    if (cacheFilter === "miss") filtered = filtered.filter((l) => l.cacheStatus !== 1)
    if (searchFilter) {
      const q = searchFilter.toLowerCase()
      filtered = filtered.filter((l) => (l.reqPath || "").toLowerCase().includes(q))
    }
    return filtered
  }, [logs, cacheFilter, searchFilter])

  // Auto-scroll
  useEffect(() => {
    if (!paused && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [filteredLogs.length, paused])

  // Generate traffic for demo
  const [generating, setGenerating] = useState(false)
  const generateTraffic = async () => {
    setGenerating(true)
    try {
      const widths = [320, 640, 1280]
      const requests = PRODUCT_CATALOG.flatMap((product) =>
        widths.map((w) =>
          apiFetch(
            `/api/performance/probe?url=${encodeURIComponent(
              `${IMAGE_BASE_URL}/${product.filename}?imwidth=${w}&_t=${Date.now()}`
            )}`
          ).catch(() => {})
        )
      )
      await Promise.all(requests)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <SectionHeader
        step={section.step}
        title={section.title}
        akamaiProduct={section.akamaiProduct}
        useCase={section.useCase}
        description={section.description}
      />

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left: Log Stream */}
        <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden flex flex-col">
          {/* Log Header */}
          <div className="px-4 py-3 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {connected ? (
                  <Wifi className="w-3.5 h-3.5 text-success" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-error" />
                )}
                <span className="text-xs font-medium text-text-secondary">
                  {connected ? "Live" : "Disconnected"}
                </span>
              </div>
              <span className="text-xs text-text-muted">{filteredLogs.length} entries</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={generateTraffic}
                disabled={generating}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                {generating ? "Generating..." : "Generate Traffic"}
              </button>
              <button
                onClick={() => setPaused(!paused)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  paused
                    ? "bg-warning/10 text-warning hover:bg-warning/20"
                    : "bg-surface text-text-secondary hover:bg-surface-raised"
                )}
              >
                {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-2 border-b border-border-subtle flex items-center gap-3">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <div className="flex gap-1">
              {(["all", "hit", "miss"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setCacheFilter(f)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium uppercase transition-colors",
                    cacheFilter === f
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Filter by path..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="flex-1 bg-transparent text-xs text-text placeholder:text-text-muted outline-none"
            />
          </div>

          {/* Column Headers */}
          <div className="flex items-center gap-3 px-4 py-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wider border-b border-border-subtle bg-surface-raised/50">
            <span className="w-20 shrink-0">Time</span>
            <span className="w-12 shrink-0">Method</span>
            <span className="flex-1">Path</span>
            <span className="w-12 shrink-0">Cache</span>
            <span className="w-20 shrink-0 text-right">Geo</span>
            <span className="w-16 shrink-0 text-right">Latency</span>
            <span className="w-16 shrink-0 text-right">Size</span>
            <span className="w-12 shrink-0 text-right">Format</span>
          </div>

          {/* Log Entries */}
          <div className="flex-1 overflow-auto max-h-[500px]">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                <Activity className="w-8 h-8 mb-3 opacity-40" />
                <p className="text-sm">Waiting for DataStream 2 logs...</p>
                <p className="text-xs mt-1">Logs arrive every ~30 seconds. Click "Generate Traffic" to create requests.</p>
              </div>
            ) : (
              <>
                {filteredLogs.map((entry, i) => (
                  <LogEntryRow key={`${entry.reqId || i}-${i}`} entry={entry} />
                ))}
                <div ref={logEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Right: Mini Dashboard */}
        <div className="space-y-4">
          <MetricCard
            label="Cache Hit Ratio"
            value={formatPercent(stats.cacheHitRatio)}
            subtitle={`${stats.total} total requests`}
            icon={Server}
            color="success"
          />
          <MetricCard
            label="Avg Latency"
            value={formatDuration(stats.avgLatency)}
            subtitle="Turn-around time at edge"
            icon={Gauge}
            color="primary"
          />
          <MetricCard
            label="Total Requests"
            value={stats.total}
            subtitle="In current buffer"
            icon={Activity}
            color="primary"
          />

          {/* Geo Breakdown */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Requests by Geography
              </span>
            </div>
            {Object.keys(stats.geoBreakdown).length === 0 ? (
              <p className="text-xs text-text-muted">No data yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.geoBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([country, count]) => (
                    <div key={country} className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary w-12 shrink-0 font-mono">
                        {country}
                      </span>
                      <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted w-8 text-right font-mono">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Attribution Headers Example */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
              Attribution Headers
            </p>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div>
                <span className="text-primary">X-Akamai-Request-ID</span>
                <span className="text-text-muted">: </span>
                <span className="text-text-secondary">1a2b3c4d</span>
              </div>
              <div>
                <span className="text-success">X-Cache</span>
                <span className="text-text-muted">: </span>
                <span className="text-text-secondary">TCP_HIT</span>
              </div>
              <div>
                <span className="text-warning">Server-Timing</span>
                <span className="text-text-muted">: </span>
                <span className="text-text-secondary">cdn-cache; desc="HIT"</span>
              </div>
              <div>
                <span className="text-purple-400">X-Akamai-Audit-ID</span>
                <span className="text-text-muted">: </span>
                <span className="text-text-secondary">akai-1707...</span>
              </div>
            </div>
            <p className="text-[10px] text-text-muted mt-3">
              These headers let you attribute every request to the correct CDN vendor in a multi-CDN architecture.
            </p>
          </div>
        </div>
      </div>

      {/* Hydrolix TrafficPeak */}
      <div className="mt-6 bg-surface rounded-xl border border-border-subtle overflow-hidden">
        <div className="px-5 py-4 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text">Hydrolix TrafficPeak</h3>
              <p className="text-[11px] text-text-muted">Multi-CDN Observability Platform</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs text-text-secondary mb-5">
            Hydrolix TrafficPeak ingests and indexes CDN telemetry from <span className="font-medium text-text">every provider</span> in
            a multi-CDN stack — Akamai DataStream 2, peer CDN logs, and origin telemetry — into a single,
            query-optimized data lake purpose-built for streaming analytics at petabyte scale.
          </p>

          {/* Key capabilities */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-text">80% Cost Reduction</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Proprietary columnar compression reduces telemetry storage costs by up to 80% vs. traditional SIEM or Splunk retention.
                Keep <span className="font-medium text-text">years</span> of request-level logs for the cost of months.
              </p>
            </div>

            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-text">Sub-Second Queries</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Lightning-fast SQL queries across billions of log rows. Investigate cache anomalies, latency spikes,
                or CDN attribution in real time — no pre-aggregation required.
              </p>
            </div>

            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-text">Unified Multi-CDN View</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Single pane of glass across all CDN vendors. Compare cache hit ratios, latency percentiles, and error
                rates side-by-side to validate vendor performance against SLAs.
              </p>
            </div>
          </div>

          {/* Cost comparison callout */}
          <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/15 rounded-lg p-4 flex items-start gap-4">
            <div className="shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-text mb-1">Telemetry Retention Cost Impact</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Large-scale CDN deployments process billions of requests daily. Traditional log analytics platforms charge per GB ingested
                and retained — costs that scale linearly with traffic. Hydrolix's streaming compression engine indexes data
                at ingest, achieving <span className="font-medium text-cyan-400">8-12x compression ratios</span> on CDN
                telemetry, dramatically reducing the total cost of observability while extending retention windows from
                weeks to years.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
