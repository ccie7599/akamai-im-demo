import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { DemoLayout } from "@/components/layout/DemoLayout"
import { MediaTransformSection } from "@/components/sections/media-transform/MediaTransformSection"
import { ObservabilitySection } from "@/components/sections/observability/ObservabilitySection"
import { GovernanceSection } from "@/components/sections/governance/GovernanceSection"
import { EdgeLogicSection } from "@/components/sections/edge-logic/EdgeLogicSection"
import { PerformanceSection } from "@/components/sections/performance/PerformanceSection"

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <DemoLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/media-transform" replace />} />
              <Route path="/media-transform" element={<MediaTransformSection />} />
              <Route path="/observability" element={<ObservabilitySection />} />
              <Route path="/governance" element={<GovernanceSection />} />
              <Route path="/edge-logic" element={<EdgeLogicSection />} />
              <Route path="/performance" element={<PerformanceSection />} />
            </Routes>
          </DemoLayout>
        </main>
      </div>
    </BrowserRouter>
  )
}
