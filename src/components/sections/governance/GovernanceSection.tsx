import { useState, useEffect } from "react"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { ApiRequestViewer } from "@/components/shared/ApiRequestViewer"
import { MetricCard } from "@/components/shared/MetricCard"
import { SECTIONS, PRODUCT_CATALOG, IMAGE_BASE_URL } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useGovernanceLog, type GovernanceAction } from "@/hooks/use-governance-log"
import { Shield, AlertTriangle, RefreshCw, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react"

const section = SECTIONS[2]

interface AssetStatus {
  id: string
  status: "active" | "expired" | "replaced"
}

export function GovernanceSection() {
  const { actions, loading, purge, refresh, clear } = useGovernanceLog()
  const [assetStatuses, setAssetStatuses] = useState<AssetStatus[]>(
    PRODUCT_CATALOG.map((p) => ({ id: p.id, status: "active" as const }))
  )
  const [lastPurgeResult, setLastPurgeResult] = useState<{
    apiRequest: any
    apiResponse: any
    latencyMs: number
  } | null>(null)
  const [propagating, setPropagating] = useState<string | null>(null)
  const [propagationTime, setPropagationTime] = useState(0)

  useEffect(() => { refresh() }, [refresh])

  // Propagation timer
  useEffect(() => {
    if (!propagating) return
    const start = Date.now()
    const interval = setInterval(() => {
      setPropagationTime(Date.now() - start)
    }, 100)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setPropagating(null)
      setPropagationTime(0)
    }, 5000) // Akamai Fast Purge typically 5s
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [propagating])

  const handleExpire = async (productId: string) => {
    const product = PRODUCT_CATALOG.find((p) => p.id === productId)
    if (!product) return
    const url = `${IMAGE_BASE_URL}/${product.filename}`
    try {
      const result = await purge([url], "invalidate")
      setLastPurgeResult({
        apiRequest: result.apiRequest,
        apiResponse: result.apiResponse,
        latencyMs: result.latencyMs,
      })
      setPropagating(productId)
      setAssetStatuses((prev) =>
        prev.map((a) => (a.id === productId ? { ...a, status: "expired" as const } : a))
      )
    } catch (err) {
      console.error("Purge failed:", err)
    }
  }

  const handleReplace = async (productId: string) => {
    const product = PRODUCT_CATALOG.find((p) => p.id === productId)
    if (!product) return
    const url = `${IMAGE_BASE_URL}/${product.filename}`
    try {
      const result = await purge([url], "invalidate")
      setLastPurgeResult({
        apiRequest: result.apiRequest,
        apiResponse: result.apiResponse,
        latencyMs: result.latencyMs,
      })
      setPropagating(productId)
      setAssetStatuses((prev) =>
        prev.map((a) => (a.id === productId ? { ...a, status: "replaced" as const } : a))
      )
    } catch (err) {
      console.error("Replace failed:", err)
    }
  }

  const handleReset = () => {
    setAssetStatuses(PRODUCT_CATALOG.map((p) => ({ id: p.id, status: "active" as const })))
    setLastPurgeResult(null)
    clear()
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

      {/* Product Image Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {PRODUCT_CATALOG.map((product) => {
          const status = assetStatuses.find((a) => a.id === product.id)?.status || "active"
          const isPropagating = propagating === product.id

          return (
            <div
              key={product.id}
              className={cn(
                "bg-surface rounded-xl border overflow-hidden transition-all",
                status === "active" ? "border-border-subtle" :
                status === "expired" ? "border-error/30" :
                "border-primary/30"
              )}
            >
              <div className="aspect-video bg-background relative flex items-center justify-center overflow-hidden">
                {status === "expired" ? (
                  <div className="flex flex-col items-center text-error/60">
                    <XCircle className="w-10 h-10 mb-2" />
                    <span className="text-xs font-medium">Asset Expired</span>
                  </div>
                ) : (
                  <img
                    src={`${IMAGE_BASE_URL}/${status === "replaced" && product.replacementFilename ? product.replacementFilename : product.filename}?imwidth=640&imformat=webp&_cb=${status}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/640x360/1e293b/64748b?text=${product.name}` }}
                  />
                )}
                {isPropagating && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs text-primary font-medium">
                      Propagating... {(propagationTime / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-text">{product.name}</p>
                    <p className="text-[10px] font-mono text-text-muted">{product.sku}</p>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      status === "active" ? "bg-success-muted text-success" :
                      status === "expired" ? "bg-error-muted text-error" :
                      "bg-primary-muted text-primary"
                    )}
                  >
                    {status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExpire(product.id)}
                    disabled={status !== "active" || loading}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      status === "active"
                        ? "bg-error/10 text-error hover:bg-error/20"
                        : "bg-surface-raised text-text-muted cursor-not-allowed"
                    )}
                  >
                    <Trash2 className="w-3 h-3" />
                    Expire
                  </button>
                  <button
                    onClick={() => handleReplace(product.id)}
                    disabled={status !== "active" || loading || !product.replacementFilename}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      status === "active" && product.replacementFilename
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-surface-raised text-text-muted cursor-not-allowed"
                    )}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Replace
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reset Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-raised text-text-secondary hover:text-text transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Demo
        </button>
      </div>

      {/* API Request/Response Viewer */}
      {lastPurgeResult && (
        <div className="mb-6">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            Last CCU API Call
          </p>
          <ApiRequestViewer
            method="POST"
            path={lastPurgeResult.apiRequest.path}
            requestBody={lastPurgeResult.apiRequest.body}
            responseBody={lastPurgeResult.apiResponse}
            statusCode={lastPurgeResult.apiResponse?.httpStatus || 201}
            latencyMs={lastPurgeResult.latencyMs}
          />
        </div>
      )}

      {/* Audit Trail */}
      <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
        <div className="px-4 py-3 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Governance Audit Trail
            </span>
          </div>
          <span className="text-xs text-text-muted">{actions.length} actions</span>
        </div>
        {actions.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            No governance actions yet. Expire or replace an asset to see the audit trail.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {actions.map((action) => (
              <div key={action.id} className="px-4 py-3 flex items-center gap-4">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    action.action === "invalidate" ? "bg-warning-muted" :
                    action.action === "delete" ? "bg-error-muted" :
                    "bg-primary-muted"
                  )}
                >
                  {action.action === "invalidate" ? (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  ) : action.action === "delete" ? (
                    <Trash2 className="w-4 h-4 text-error" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text capitalize">{action.action}</p>
                  <p className="text-xs text-text-muted font-mono truncate">
                    {action.urls.join(", ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-text-secondary">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-[10px] text-text-muted font-mono">{action.latencyMs}ms</p>
                </div>
                <div className="shrink-0">
                  {action.status === "complete" ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : action.status === "error" ? (
                    <XCircle className="w-4 h-4 text-error" />
                  ) : (
                    <Clock className="w-4 h-4 text-warning animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
