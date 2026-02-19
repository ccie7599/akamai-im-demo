import { Highlight, themes } from "prism-react-renderer"
import { cn } from "@/lib/utils"

interface CodeViewerProps {
  code: string
  language?: string
  title?: string
  className?: string
}

export function CodeViewer({
  code,
  language = "javascript",
  title,
  className,
}: CodeViewerProps) {
  return (
    <div className={cn("bg-surface rounded-xl border border-border-subtle overflow-hidden", className)}>
      {title && (
        <div className="px-4 py-2.5 bg-surface-raised border-b border-border-subtle flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-error/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
          </div>
          <span className="text-xs font-mono text-text-muted ml-2">{title}</span>
        </div>
      )}
      <div className="p-4 overflow-auto max-h-[500px]">
        <Highlight theme={themes.nightOwl} code={code.trim()} language={language}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="text-xs font-mono leading-relaxed">
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="inline-block w-8 text-right mr-4 text-text-muted/40 select-none">
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  )
}
