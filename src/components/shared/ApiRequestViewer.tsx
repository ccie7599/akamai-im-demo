import { cn } from "@/lib/utils"

interface ApiRequestViewerProps {
  method: string
  path: string
  requestBody?: object
  responseBody?: object
  statusCode?: number
  latencyMs?: number
  className?: string
}

export function ApiRequestViewer({
  method,
  path,
  requestBody,
  responseBody,
  statusCode,
  latencyMs,
  className,
}: ApiRequestViewerProps) {
  const methodColor =
    method === "POST"
      ? "text-warning"
      : method === "DELETE"
        ? "text-error"
        : "text-success"

  const statusColor =
    statusCode && statusCode >= 200 && statusCode < 300
      ? "text-success"
      : "text-error"

  return (
    <div className={cn("bg-surface rounded-xl border border-border-subtle overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-raised border-b border-border-subtle">
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className={cn("font-bold", methodColor)}>{method}</span>
          <span className="text-text-secondary">{path}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {statusCode !== undefined && (
            <span className={cn("font-mono font-bold", statusColor)}>
              {statusCode}
            </span>
          )}
          {latencyMs !== undefined && (
            <span className="text-text-muted font-mono">{latencyMs}ms</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border-subtle">
        {requestBody && (
          <div className="p-4">
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">
              Request Body
            </p>
            <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap overflow-auto max-h-48">
              {JSON.stringify(requestBody, null, 2)}
            </pre>
          </div>
        )}
        {responseBody && (
          <div className="p-4">
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">
              Response Body
            </p>
            <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap overflow-auto max-h-48">
              {JSON.stringify(responseBody, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
