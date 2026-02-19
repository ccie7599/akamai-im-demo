import { useState } from "react"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { MetricCard } from "@/components/shared/MetricCard"
import { SECTIONS, IMAGE_BASE_URL, PRODUCT_CATALOG } from "@/lib/constants"
import { cn, formatBytes, formatDuration } from "@/lib/utils"
import { useLatencyProbe, type ProbeResult } from "@/hooks/use-latency-probe"
import { Zap, Play, Loader2, Server, Clock, ArrowDown, CheckCircle2, XCircle, BarChart3, Gauge, Shield, Globe, Cloud, Image } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const section = SECTIONS[4]

function ProbeResultRow({ result }: { result: ProbeResult }) {
  const isFast = result.timing.ttfbMs < 50
  const cacheHit = result.cacheStatus.includes("HIT")

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border-subtle animate-slide-in">
      <span className="text-xs text-text-muted w-6 shrink-0 font-mono">
        #{result.index + 1}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-mono font-bold",
            result.isColdStart ? "text-warning" : isFast ? "text-success" : "text-primary"
          )}>
            {result.timing.ttfbMs}ms
          </span>
          <span className="text-xs text-text-muted">TTFB</span>
          <span className="text-text-muted mx-1">/</span>
          <span className="text-xs font-mono text-text-secondary">
            {result.timing.totalMs}ms total
          </span>
        </div>
      </div>
      <span className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-bold",
        cacheHit ? "bg-success-muted text-success" : "bg-warning-muted text-warning"
      )}>
        {cacheHit ? "HIT" : "MISS"}
      </span>
      <span className="text-xs text-text-muted font-mono w-16 text-right">
        {formatBytes(result.responseSize)}
      </span>
      {result.isColdStart && (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-muted text-warning">
          COLD
        </span>
      )}
    </div>
  )
}

export function PerformanceSection() {
  const { results, stats, running, runProbe, clearResults } = useLatencyProbe()
  const [selectedProduct] = useState(PRODUCT_CATALOG[0])
  const [cacheShield, setCacheShield] = useState(false)

  const testUrl = `${IMAGE_BASE_URL}/${selectedProduct.filename}?imwidth=1280&impolicy=high`

  const handleRunTest = () => {
    clearResults()
    // When Cache+ is enabled, don't bypass on first request — simulates mid-tier cache hit
    runProbe(testUrl, 10, !cacheShield)
  }

  // Chart data for cache vs origin
  const chartData = results.length > 0
    ? cacheShield
      ? [
          {
            name: "Cache+ Hit\n(Mid-Tier Derivative)",
            ttfb: results[0]?.timing.ttfbMs || 0,
            type: "cached",
          },
          {
            name: "Edge Cache Hit\n(Subsequent)",
            ttfb: stats?.avg || 0,
            type: "cached",
          },
        ]
      : [
          {
            name: "Cold Start\n(Origin + IM Transform)",
            ttfb: results.find((r) => r.isColdStart)?.timing.ttfbMs || 0,
            type: "cold",
          },
          {
            name: "Cached\n(Edge Delivery)",
            ttfb: stats?.avg || 0,
            type: "cached",
          },
        ]
    : []

  // Waterfall data from the last cached result
  const lastCached = results.filter((r) => !r.isColdStart).at(-1)

  return (
    <div>
      <SectionHeader
        step={section.step}
        title={section.title}
        akamaiProduct={section.akamaiProduct}
        useCase={section.useCase}
        description={section.description}
      />

      {/* Run Test Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleRunTest}
          disabled={running}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all",
            running
              ? "bg-primary/20 text-primary cursor-wait"
              : "bg-primary text-white hover:bg-primary-hover animate-pulse-glow"
          )}
        >
          {running ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {running ? `Testing... (${results.length}/10)` : "Run Latency Test"}
        </button>

        {/* CloudWrapper + Cache+ Toggle */}
        <button
          onClick={() => { setCacheShield(!cacheShield); clearResults() }}
          disabled={running}
          className={cn(
            "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all border",
            cacheShield
              ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
              : "bg-surface-raised border-border-subtle text-text-muted hover:text-text-secondary"
          )}
        >
          {/* Toggle track */}
          <div className={cn(
            "relative w-8 h-4.5 rounded-full transition-colors",
            cacheShield ? "bg-purple-500" : "bg-surface"
          )} style={{ height: "18px" }}>
            <div className={cn(
              "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm",
              cacheShield ? "translate-x-[14px]" : "translate-x-0.5"
            )} style={{ height: "14px", width: "14px" }} />
          </div>
          <div className="flex flex-col items-start">
            <span className={cn("font-semibold", cacheShield ? "text-purple-400" : "text-text-secondary")}>
              CloudWrapper + Cache+
            </span>
            <span className="text-[10px] text-text-muted">
              {cacheShield ? "Mid-tier cache active — no cold starts" : "Disabled — cold starts hit origin"}
            </span>
          </div>
        </button>

        <div className="text-xs text-text-muted flex-1">
          {cacheShield
            ? "All requests served from CloudWrapper mid-tier cache. No origin round-trip, no IM re-transformation."
            : "First request bypasses cache to show cold-start vs. cached performance."
          }
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <MetricCard
            label={cacheShield ? "First Request" : "Cold Start"}
            value={`${cacheShield ? (stats.firstRequest ?? "—") : (stats.coldStart ?? "—")}ms`}
            subtitle={cacheShield ? "Cache+ mid-tier hit" : "First request (IM transform)"}
            icon={Clock}
            color={cacheShield ? "success" : "warning"}
          />
          <MetricCard
            label="Average TTFB"
            value={`${stats.avg}ms`}
            subtitle="Cached requests"
            icon={Gauge}
            color={stats.avg < 50 ? "success" : "primary"}
          />
          <MetricCard
            label="P50"
            value={`${stats.p50}ms`}
            subtitle="Median latency"
            icon={BarChart3}
            color="primary"
          />
          <MetricCard
            label="P95"
            value={`${stats.p95}ms`}
            subtitle="95th percentile"
            icon={BarChart3}
            color="primary"
          />
          <MetricCard
            label="P99"
            value={`${stats.p99}ms`}
            subtitle="99th percentile"
            icon={BarChart3}
            color="primary"
          />
        </div>
      )}

      <div className="grid grid-cols-[1fr_1fr] gap-6">
        {/* Left: Probe Results */}
        <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
          <div className="px-4 py-3 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Probe Results
              </span>
            </div>
            <span className="text-xs text-text-muted">{results.length} requests</span>
          </div>
          <div className="max-h-[400px] overflow-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm">
                Click "Run Latency Test" to begin
              </div>
            ) : (
              results.map((result) => (
                <ProbeResultRow key={result.index} result={result} />
              ))
            )}
          </div>
        </div>

        {/* Right: Charts and Info */}
        <div className="space-y-4">
          {/* Cache vs Origin Chart */}
          {chartData.length > 0 && (
            <div className="bg-surface rounded-xl border border-border-subtle p-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">
                Cold Start vs. Cached Delivery
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" domain={[0, "auto"]} tick={{ fill: "#94a3b8", fontSize: 11 }} unit="ms" />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={120} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#f1f5f9" }}
                    />
                    <Bar dataKey="ttfb" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.type === "cold" ? "#f59e0b" : "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                First request includes Image Manager transformation time. Subsequent requests served from edge cache at sub-50ms latency.
              </p>
            </div>
          )}

          {/* CloudWrapper Architecture */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                CloudWrapper — Mid-Tier Cache
              </span>
            </div>

            {/* Animated architecture diagram */}
            <div className="relative bg-background rounded-lg p-5 overflow-hidden">
              {/* Animated pulse lines (CSS keyframe via inline style) */}
              <style>{`
                @keyframes flowRight { 0% { transform: translateX(-100%); opacity: 0; } 30% { opacity: 1; } 70% { opacity: 1; } 100% { transform: translateX(200%); opacity: 0; } }
                @keyframes flowLeft  { 0% { transform: translateX(200%); opacity: 0; } 30% { opacity: 1; } 70% { opacity: 1; } 100% { transform: translateX(-100%); opacity: 0; } }
                @keyframes shieldPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); } 50% { box-shadow: 0 0 16px 4px rgba(59,130,246,0.15); } }
                .flow-dot { position: absolute; width: 4px; height: 4px; border-radius: 50%; }
                .flow-right { animation: flowRight 2s ease-in-out infinite; }
                .flow-left  { animation: flowLeft 2s ease-in-out infinite; }
                .shield-glow { animation: shieldPulse 3s ease-in-out infinite; }
              `}</style>

              <div className="flex items-center justify-between gap-2">
                {/* CDN Providers */}
                <div className="flex flex-col gap-2 shrink-0 w-24">
                  {["Akamai", "CDN B", "CDN C"].map((cdn, i) => (
                    <div key={cdn} className="flex items-center gap-1.5 bg-surface-raised rounded-lg px-2 py-1.5 border border-border-subtle">
                      <Globe className="w-3 h-3 text-text-muted shrink-0" />
                      <span className="text-[10px] font-medium text-text-secondary truncate">{cdn}</span>
                    </div>
                  ))}
                </div>

                {/* Flow arrows to CloudWrapper */}
                <div className="flex-1 relative h-20 min-w-[40px]">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="absolute left-0 right-0" style={{ top: `${10 + i * 28}px` }}>
                      <div className="h-px bg-border-subtle w-full" />
                      <div className="flow-dot flow-right bg-primary" style={{ top: "-1.5px", animationDelay: `${i * 0.4}s` }} />
                    </div>
                  ))}
                </div>

                {/* CloudWrapper Shield */}
                <div className="shield-glow shrink-0 flex flex-col items-center gap-1 bg-primary/10 border-2 border-primary/30 rounded-xl px-3 py-3 relative">
                  <Shield className="w-6 h-6 text-primary" />
                  <span className="text-[10px] font-bold text-primary">Cloud</span>
                  <span className="text-[10px] font-bold text-primary -mt-1">Wrapper</span>
                </div>

                {/* Flow arrow to Origin */}
                <div className="flex-1 relative h-20 min-w-[40px]">
                  <div className="absolute left-0 right-0 top-[38px]">
                    <div className="h-px bg-border-subtle w-full" />
                    <div className="flow-dot flow-right bg-success" style={{ top: "-1.5px", animationDelay: "0.8s" }} />
                  </div>
                  {/* "Reduced" label */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-[48px]">
                    <span className="text-[9px] text-success font-medium">90% fewer</span>
                  </div>
                </div>

                {/* Origin */}
                <div className="shrink-0 flex flex-col items-center gap-1 bg-surface-raised rounded-xl px-3 py-3 border border-border-subtle">
                  <Server className="w-5 h-5 text-text-muted" />
                  <span className="text-[10px] font-medium text-text-secondary">Origin</span>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-text-secondary">
              <p><span className="text-primary font-medium">CloudWrapper</span> is a persistent mid-tier cache layer that sits between edge PoPs and the origin. All CDN providers pull from this shared cache instead of hitting the origin directly.</p>
              <p>During traffic spikes, CloudWrapper absorbs cache misses so the origin stays cool. Cold-start penalties are eliminated across <span className="font-medium text-text">any CDN</span> — if Akamai already warmed the cache, CDN B and CDN C benefit immediately.</p>
            </div>
          </div>

          {/* Cache+ — IM Derivative Cache */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Cache+ — IM Derivative Cache
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 ml-auto">
                AKAMAI EXCLUSIVE
              </span>
            </div>

            {/* Animated diagram */}
            <div className="relative bg-background rounded-lg p-5 overflow-hidden">
              <style>{`
                @keyframes imTransform { 0% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 0.6; } }
                @keyframes derivFlow { 0% { transform: translateX(-100%); opacity: 0; } 30% { opacity: 1; } 70% { opacity: 1; } 100% { transform: translateX(200%); opacity: 0; } }
                .im-pulse { animation: imTransform 3s ease-in-out infinite; }
                .deriv-dot { position: absolute; width: 4px; height: 4px; border-radius: 50%; animation: derivFlow 2.5s ease-in-out infinite; }
              `}</style>

              <div className="flex items-center justify-between gap-2">
                {/* Master Image */}
                <div className="shrink-0 flex flex-col items-center gap-1 bg-surface-raised rounded-xl px-3 py-3 border border-border-subtle">
                  <Image className="w-5 h-5 text-text-muted" />
                  <span className="text-[10px] font-medium text-text-secondary">Master</span>
                  <span className="text-[9px] text-text-muted">JPEG</span>
                </div>

                {/* Arrow to IM */}
                <div className="flex-1 relative h-16 min-w-[30px]">
                  <div className="absolute left-0 right-0 top-[30px]">
                    <div className="h-px bg-border-subtle w-full" />
                    <div className="deriv-dot bg-purple-400" style={{ top: "-1.5px" }} />
                  </div>
                </div>

                {/* IM Engine */}
                <div className="im-pulse shrink-0 flex flex-col items-center gap-1 bg-purple-500/10 border-2 border-purple-500/30 rounded-xl px-3 py-2.5 relative">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <span className="text-[9px] font-bold text-purple-400">Image</span>
                  <span className="text-[9px] font-bold text-purple-400 -mt-1">Manager</span>
                </div>

                {/* Arrows to derivatives */}
                <div className="flex-1 relative h-16 min-w-[30px]">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="absolute left-0 right-0" style={{ top: `${8 + i * 20}px` }}>
                      <div className="h-px bg-border-subtle w-full" />
                      <div className="deriv-dot bg-purple-400" style={{ top: "-1.5px", animationDelay: `${i * 0.3}s` }} />
                    </div>
                  ))}
                </div>

                {/* Cache+ Shield */}
                <div className="shrink-0 flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1">
                    <span className="text-[9px] text-purple-300">320px WebP</span>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1">
                    <span className="text-[9px] text-purple-300">768px AVIF</span>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1">
                    <span className="text-[9px] text-purple-300">2560px 2x</span>
                  </div>
                </div>
              </div>

              {/* Cache+ label below derivatives */}
              <div className="mt-3 flex justify-end">
                <div className="text-center bg-purple-500/5 border border-purple-500/15 rounded-md px-3 py-1">
                  <span className="text-[10px] font-bold text-purple-400">Cache+</span>
                  <span className="text-[9px] text-text-muted ml-1">persistent derivative cache</span>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-text-secondary">
              <p><span className="text-purple-400 font-medium">Cache+</span> is a dedicated CloudWrapper cache tier exclusively for Image Manager derivatives. Every resized, reformatted, and quality-adjusted variant is cached persistently — not just at the edge, but in a mid-tier shield.</p>
              <p>When a derivative is evicted from the edge, Cache+ serves it instantly instead of re-transforming from the master. This eliminates redundant IM processing and keeps <span className="font-medium text-text">cold-start latency near zero</span> even for long-tail product images.</p>
            </div>
          </div>

          {/* SLA Display */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Akamai SLA Commitment
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-success">100%</p>
                <p className="text-xs text-text-muted mt-1">Uptime SLA</p>
              </div>
              <div className="bg-background rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">&lt;50ms</p>
                <p className="text-xs text-text-muted mt-1">Edge Latency Target</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-text-secondary">
              <p>Akamai's platform spans ~4,000 PoPs globally, placing servers closer to end users than any other CDN provider.</p>
            </div>
          </div>

          {/* Response Headers from Last Probe */}
          {lastCached && (
            <div className="bg-surface rounded-xl border border-border-subtle p-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                Last Response Headers
              </p>
              <div className="bg-background rounded-lg p-3 space-y-1 font-mono text-[10px]">
                {Object.entries(lastCached.akamaiHeaders).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-primary">{key}</span>
                    <span className="text-text-muted">: </span>
                    <span className="text-text-secondary">{String(value).slice(0, 100)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
