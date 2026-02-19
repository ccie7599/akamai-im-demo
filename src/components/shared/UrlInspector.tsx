import { cn } from "@/lib/utils"
import { Link2 } from "lucide-react"

interface UrlParam {
  key: string
  value: string
  description: string
}

interface UrlInspectorProps {
  baseUrl: string
  params: UrlParam[]
  className?: string
}

export function UrlInspector({ baseUrl, params, className }: UrlInspectorProps) {
  const fullUrl = params.length > 0
    ? `${baseUrl}?${params.map((p) => `${p.key}=${p.value}`).join("&")}`
    : baseUrl

  const paramColors = [
    "text-primary",
    "text-success",
    "text-warning",
    "text-purple-400",
  ]

  return (
    <div className={cn("bg-surface rounded-xl border border-border-subtle overflow-hidden", className)}>
      <div className="px-4 py-2.5 bg-surface-raised border-b border-border-subtle flex items-center gap-2">
        <Link2 className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-xs font-medium text-text-muted">Akamai Image Manager URL</span>
      </div>
      <div className="p-4">
        <div className="font-mono text-sm break-all">
          <span className="text-text-secondary">{baseUrl}</span>
          {params.length > 0 && (
            <>
              <span className="text-text-muted">?</span>
              {params.map((param, i) => (
                <span key={param.key}>
                  {i > 0 && <span className="text-text-muted">&amp;</span>}
                  <span className={paramColors[i % paramColors.length]}>
                    {param.key}
                  </span>
                  <span className="text-text-muted">=</span>
                  <span className={cn(paramColors[i % paramColors.length], "font-bold")}>
                    {param.value}
                  </span>
                </span>
              ))}
            </>
          )}
        </div>
        {params.length > 0 && (
          <div className="mt-3 space-y-1">
            {params.map((param, i) => (
              <div key={param.key} className="flex items-center gap-2 text-xs">
                <span className={cn("font-mono font-bold", paramColors[i % paramColors.length])}>
                  {param.key}
                </span>
                <span className="text-text-muted">&mdash;</span>
                <span className="text-text-secondary">{param.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
