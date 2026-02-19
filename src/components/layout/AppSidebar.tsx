import { NavLink, useLocation } from "react-router-dom"
import { SECTIONS } from "@/lib/constants"
import {
  Image,
  Activity,
  Shield,
  Code,
  Zap,
  type LucideIcon,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, LucideIcon> = {
  Image,
  Activity,
  Shield,
  Code,
  Zap,
}

export function AppSidebar() {
  const location = useLocation()
  const currentIndex = SECTIONS.findIndex((s) => s.path === location.pathname)

  return (
    <aside className="w-72 shrink-0 border-r border-border-subtle bg-surface flex flex-col h-full">
      <div className="p-5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text">Akamai Image Manager</h1>
            <p className="text-xs text-text-muted">Edge Delivery Demo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {SECTIONS.map((section, idx) => {
          const Icon = ICON_MAP[section.icon]
          const isActive = location.pathname === section.path
          const isCompleted = idx < currentIndex

          return (
            <NavLink
              key={section.path}
              to={section.path}
              className={cn(
                "block rounded-lg p-3 transition-all duration-150",
                isActive
                  ? "bg-primary-muted border border-primary/30"
                  : "hover:bg-surface-raised border border-transparent"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                    isActive
                      ? "bg-primary text-white"
                      : isCompleted
                        ? "bg-success/20 text-success"
                        : "bg-surface-raised text-text-muted"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{section.step}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-text" : "text-text-secondary"
                      )}
                    >
                      {section.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(Array.isArray(section.akamaiProduct) ? section.akamaiProduct : [section.akamaiProduct]).map((product) => (
                      <span key={product} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                        {product}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted leading-tight line-clamp-2">
                    {section.useCase}
                  </p>
                </div>
                {Icon && (
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 mt-1",
                      isActive ? "text-primary" : "text-text-muted"
                    )}
                  />
                )}
              </div>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border-subtle">
        <p className="text-[10px] text-text-muted text-center">
          Akamai Edge Delivery Demo
        </p>
      </div>
    </aside>
  )
}
