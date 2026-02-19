import type { ReactNode } from "react"

export function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-fade-in">
      {children}
    </div>
  )
}
