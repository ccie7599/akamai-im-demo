import { useState, useEffect } from "react"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { CodeViewer } from "@/components/shared/CodeViewer"
import { SECTIONS, IMAGE_BASE_URL, PRODUCT_CATALOG } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api"
import { Tag, GitBranch, Play, Loader2, Eye, Cpu, Code2, Zap, Box } from "lucide-react"

const section = SECTIONS[3]

const AUDIT_HEADER_KEYS = [
  "x-cdn-provider",
  "x-request-trace-id",
  "x-edge-timestamp",
  "x-edge-worker-version",
]

const CACHE_HIGHLIGHT_KEYS = [
  ...AUDIT_HEADER_KEYS,
  "x-cache-bypass-reason",
]

export function EdgeLogicSection() {
  const [ewCode, setEwCode] = useState("")
  const [ewBundle, setEwBundle] = useState<any>(null)
  const [auditHeaders, setAuditHeaders] = useState<Record<string, string> | null>(null)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [cacheHeaders, setCacheHeaders] = useState<{
    normal: Record<string, string>
    enforced: Record<string, string>
  } | null>(null)
  const [loadingCache, setLoadingCache] = useState(false)
  const [versions, setVersions] = useState<any[]>([])

  useEffect(() => {
    apiFetch<{ mainJs: string; bundleJson: any }>("/api/edgeworkers/code")
      .then(({ mainJs, bundleJson }) => {
        setEwCode(mainJs)
        setEwBundle(bundleJson)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    apiFetch<{ versions?: any[] }>("/api/edgeworkers/versions")
      .then((data) => setVersions(data.versions || []))
      .catch(console.error)
  }, [])

  const testUrl = `${IMAGE_BASE_URL}/${PRODUCT_CATALOG[0].filename}?imwidth=640`

  // Multi-CDN audit tag demo — send a normal request, show injected headers
  const handleAuditRequest = async () => {
    setLoadingAudit(true)
    try {
      const result = await apiFetch<any>(
        `/api/performance/probe?url=${encodeURIComponent(testUrl)}`
      )
      setAuditHeaders(result.akamaiHeaders || {})
    } catch (err) {
      console.error("Audit request failed:", err)
    } finally {
      setLoadingAudit(false)
    }
  }

  // QA cache bypass demo — compare normal (cached) vs QA bypass (miss)
  const handleCacheDemo = async () => {
    setLoadingCache(true)
    setCacheHeaders(null)
    try {
      // Use a unique imwidth on QA bypass to guarantee an IM cache miss
      // (IM overrides EdgeWorker cacheKey modifications with its own derivative key)
      const qaUrl = testUrl.replace(/imwidth=(\d+)/, `imwidth=${1000 + (Date.now() % 9000)}`)
      const [normalResult, enforcedResult] = await Promise.all([
        apiFetch<any>(`/api/performance/probe?url=${encodeURIComponent(testUrl)}`),
        apiFetch<any>(
          `/api/performance/probe?url=${encodeURIComponent(qaUrl)}&qaToken=preview&bypass=true`
        ),
      ])
      setCacheHeaders({
        normal: normalResult.akamaiHeaders || {},
        enforced: enforcedResult.akamaiHeaders || {},
      })
    } catch (err) {
      console.error("Cache demo failed:", err)
    } finally {
      setLoadingCache(false)
    }
  }

  const hasAuditHeaders = auditHeaders
    ? AUDIT_HEADER_KEYS.some((k) => auditHeaders[k])
    : false

  return (
    <div>
      <SectionHeader
        step={section.step}
        title={section.title}
        akamaiProduct={section.akamaiProduct}
        useCase={section.useCase}
        description={section.description}
      />

      <div className="grid grid-cols-[1fr_1fr] gap-6">
        {/* Left: Code Viewer */}
        <div>
          <CodeViewer
            code={ewCode || "// Loading EdgeWorker code..."}
            language="javascript"
            title={
              ewBundle
                ? `main.js — v${ewBundle["edgeworker-version"]}`
                : "main.js"
            }
          />

          {/* Version History */}
          <div className="mt-4 bg-surface rounded-xl border border-border-subtle p-4">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Version History
              </span>
            </div>
            {versions.length === 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <div>
                    <span className="text-sm font-mono text-primary">
                      v1.1.0
                    </span>
                    <span className="text-xs text-text-muted ml-2">
                      (deployed)
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">Current</span>
                </div>
                <p className="text-xs text-text-muted">
                  Multi-CDN audit metadata, QA cache bypass, Origin shield
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.slice(0, 5).map((v: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0"
                  >
                    <span className="text-sm font-mono text-primary">
                      v{v.version || v.edgeworkerVersion}
                    </span>
                    <span className="text-xs text-text-muted">
                      {v.createdTime
                        ? new Date(v.createdTime).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Interactive Demos */}
        <div className="space-y-4">
          {/* 1. Multi-CDN Audit Metadata */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-text">
                  Multi-CDN Audit Metadata
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  CDN attribution headers
                </p>
              </div>
              <button
                onClick={handleAuditRequest}
                disabled={loadingAudit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {loadingAudit ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                Send Request
              </button>
            </div>

            <p className="text-xs text-text-muted mb-3">
              Multi-CDN environments require consistent audit headers. Every response carries
              headers so analytics platforms can attribute performance by
              provider, trace requests end-to-end, and segment by cache status.
            </p>

            {auditHeaders && (
              <div className="bg-background rounded-lg p-4 space-y-2 font-mono text-xs">
                {AUDIT_HEADER_KEYS.map((key) => {
                  const value = auditHeaders[key]
                  return (
                    <div key={key} className="flex items-start gap-2">
                      <Tag className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-purple-400">{key}</span>
                        <span className="text-text-muted">: </span>
                        <span className="text-text">
                          {value || (
                            <span className="italic text-text-muted">
                              awaiting EdgeWorker deployment
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {!hasAuditHeaders && (
                  <p className="text-text-muted text-xs mt-2">
                    Audit headers will appear once the EdgeWorker v1.1.0 is
                    deployed and activated on the Akamai property.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. QA Cache Bypass */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-text">
                  QA Image Preview — Cache Bypass
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Bypass edge cache for creative team verification
                </p>
              </div>
              <Eye className="w-4 h-4 text-primary" />
            </div>

            <p className="text-xs text-text-muted mb-4">
              When the creative team uploads a new product image and needs to verify it on the live CDN immediately — without cache serving the old version. The EdgeWorker detects the <code className="text-primary">X-QA-Token</code> header and modifies the cache key so the request bypasses cached content entirely.
            </p>

            <button
              onClick={handleCacheDemo}
              disabled={loadingCache}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors mb-4"
            >
              {loadingCache ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              Compare: Normal vs. QA Bypass
            </button>

            {cacheHeaders && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-medium text-text-muted uppercase mb-2">
                    Normal Request
                  </p>
                  <div className="bg-background rounded-lg p-3 space-y-1 font-mono text-[10px]">
                    {Object.entries(cacheHeaders.normal)
                      .filter(
                        ([k]) =>
                          k.startsWith("x-") ||
                          k === "age" ||
                          k === "cache-control"
                      )
                      .slice(0, 12)
                      .map(([key, value]) => (
                        <div key={key}>
                          <span className="text-success">{key}</span>
                          <span className="text-text-muted">: </span>
                          <span className="text-text-secondary">
                            {String(value).slice(0, 60)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-primary uppercase mb-2">
                    QA Bypass Active
                  </p>
                  <div className="bg-background rounded-lg p-3 space-y-1 font-mono text-[10px]">
                    {Object.entries(cacheHeaders.enforced)
                      .filter(
                        ([k]) =>
                          k.startsWith("x-") ||
                          k === "age" ||
                          k === "cache-control"
                      )
                      .slice(0, 12)
                      .map(([key, value]) => {
                        const isHighlight = CACHE_HIGHLIGHT_KEYS.includes(key)
                        return (
                          <div key={key}>
                            <span className={isHighlight ? "text-primary" : "text-success"}>
                              {key}
                            </span>
                            <span className="text-text-muted">: </span>
                            <span className="text-text-secondary">
                              {String(value).slice(0, 60)}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Akamai Functions — Wasm */}
      <div className="mt-6 bg-surface rounded-xl border border-border-subtle p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text">Akamai Functions</h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                WASM
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Full WebAssembly compute at the edge
            </p>
          </div>
        </div>

        <p className="text-xs text-text-secondary mb-4">
          Akamai Functions brings full WebAssembly (Wasm) serverless compute to the edge. It extends beyond EdgeWorkers' request-lifecycle hooks into a complete edge application platform — run Rust, Go, Python, JavaScript, and any language that compiles to Wasm directly on Akamai's global edge network.
        </p>

        {/* Capability grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-background rounded-lg p-3 border border-border-subtle">
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-semibold text-text">Polyglot Runtime</span>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed">
              Rust, Go, Python, JavaScript, C/C++, C#, Ruby — any language with a Wasm compile target. No vendor lock-in to a single language.
            </p>
          </div>

          <div className="bg-background rounded-lg p-3 border border-border-subtle">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-semibold text-text">Sub-Millisecond Cold Start</span>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed">
              Wasm modules start in under 1ms — no cold start penalty. Instant scale-to-zero without the latency tax of container-based serverless.
            </p>
          </div>

          <div className="bg-background rounded-lg p-3 border border-border-subtle">
            <div className="flex items-center gap-2 mb-2">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-semibold text-text">Component Model</span>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed">
              Built-in KV store, SQLite, outbound HTTP, and pub/sub — no external dependencies. Compose modular components into full edge applications.
            </p>
          </div>
        </div>

        {/* EdgeWorkers + Functions comparison */}
        <div className="bg-background rounded-lg p-4 border border-border-subtle">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3">
            Complementary Edge Logic
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-semibold text-primary">EdgeWorkers</span>
              </div>
              <ul className="space-y-1.5 text-[10px] text-text-secondary">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">›</span>
                  <span>CDN-native hooks (request/response lifecycle)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">›</span>
                  <span>Deep integration with IM, Bot Manager, WAF, Property Manager</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">›</span>
                  <span>Header manipulation, routing, cache key logic</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">›</span>
                  <span>Lightweight, purpose-built for CDN augmentation</span>
                </li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px] font-semibold text-cyan-400">Akamai Functions</span>
              </div>
              <ul className="space-y-1.5 text-[10px] text-text-secondary">
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 mt-0.5">›</span>
                  <span>Full application logic — API endpoints, auth, data processing</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 mt-0.5">›</span>
                  <span>Polyglot: Rust, Go, Python, JS, C++, and more via Wasm</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 mt-0.5">›</span>
                  <span>Higher resource limits — complex compute at the edge</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 mt-0.5">›</span>
                  <span>Component model with built-in KV, SQLite, pub/sub</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-text-muted mt-3">
          EdgeWorkers handles CDN-layer logic (header injection, cache key manipulation, A/B routing). Akamai Functions handles application-layer compute (API gateways, personalization engines, real-time data processing). Together, they cover the full spectrum from lightweight CDN augmentation to full edge applications.
        </p>
      </div>
    </div>
  )
}
