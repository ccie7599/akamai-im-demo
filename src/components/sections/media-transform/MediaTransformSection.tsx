import { useState, useEffect } from "react"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { UrlInspector } from "@/components/shared/UrlInspector"
import { MetricCard } from "@/components/shared/MetricCard"
import { SECTIONS, PRODUCT_CATALOG, IMAGE_BASE_URL, ORIGIN_IMAGE_BASE_URL, DEVICE_PRESETS, FORMAT_OPTIONS, QUALITY_PRESETS } from "@/lib/constants"
import { cn, formatBytes } from "@/lib/utils"
import { Monitor, Smartphone, Tablet, MonitorCheck, Loader2, Paintbrush, Scissors } from "lucide-react"

const section = SECTIONS[0]

const DeviceIcon = {
  Smartphone,
  Tablet,
  Monitor,
  MonitorCheck,
} as const

export function MediaTransformSection() {
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_CATALOG[0])
  const [format, setFormat] = useState("")
  const [device, setDevice] = useState(DEVICE_PRESETS[0])
  const [qualityPreset, setQualityPreset] = useState(QUALITY_PRESETS[2]) // "High" default
  const [originalSize, setOriginalSize] = useState<number | null>(null)
  const [transformedSize, setTransformedSize] = useState<number | null>(null)
  const [transformedFormat, setTransformedFormat] = useState<string>("")
  const [loadingOriginal, setLoadingOriginal] = useState(false)
  const [loadingTransformed, setLoadingTransformed] = useState(false)

  // Build IM URL params
  const imParams: { key: string; value: string; description: string }[] = []
  imParams.push({ key: "imwidth", value: String(device.width), description: `Resize to ${device.width}px for ${device.label}` })
  if (device.density > 1) {
    imParams.push({ key: "imdensity", value: String(device.density), description: `${device.density}x pixel density for Retina` })
  }
  imParams.push({ key: "impolicy", value: qualityPreset.policy, description: `perceptualQuality: ${qualityPreset.label.toLowerCase()}` })

  const originalUrl = `${ORIGIN_IMAGE_BASE_URL}/${selectedProduct.filename}`
  const transformedUrl = `${IMAGE_BASE_URL}/${selectedProduct.filename}?${imParams.map(p => `${p.key}=${p.value}`).join("&")}`

  // Accept header — IM requires wildcard fallback (image/*;q=0.8) for format negotiation
  const acceptHeader = (() => {
    switch (format) {
      case "webp": return "image/webp,image/*;q=0.8"
      case "avif": return "image/avif,image/webp;q=0.9,image/*;q=0.8"
      case "jpeg": return "image/jpeg"
      default:     return "image/avif,image/webp,image/*;q=0.8"
    }
  })()

  // Fetch original size
  useEffect(() => {
    setLoadingOriginal(true)
    const controller = new AbortController()
    fetch(originalUrl, { signal: controller.signal })
      .then((res) => res.blob())
      .then((blob) => setOriginalSize(blob.size))
      .catch(() => setOriginalSize(null))
      .finally(() => setLoadingOriginal(false))
    return () => controller.abort()
  }, [originalUrl])

  // Fetch transformed size with Accept header for format negotiation
  useEffect(() => {
    setLoadingTransformed(true)
    const controller = new AbortController()
    fetch(transformedUrl, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: acceptHeader },
    })
      .then((res) => {
        const ct = res.headers.get("content-type") || ""
        return res.blob().then((blob) => ({ blob, ct }))
      })
      .then(({ blob, ct }) => {
        setTransformedSize(blob.size)
        setTransformedFormat(ct || blob.type)
      })
      .catch(() => {
        setTransformedSize(null)
        setTransformedFormat("")
      })
      .finally(() => setLoadingTransformed(false))
    return () => controller.abort()
  }, [transformedUrl, acceptHeader])

  const savings = originalSize && transformedSize
    ? ((1 - transformedSize / originalSize) * 100).toFixed(1)
    : null

  return (
    <div>
      <SectionHeader
        step={section.step}
        title={section.title}
        akamaiProduct={section.akamaiProduct}
        useCase={section.useCase}
        description={section.description}
      />

      {/* Product Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {PRODUCT_CATALOG.map((product) => (
          <button
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className={cn(
              "shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all",
              selectedProduct.id === product.id
                ? "border-primary ring-2 ring-primary/20"
                : "border-border-subtle hover:border-border"
            )}
          >
            <img
              src={`${IMAGE_BASE_URL}/${product.filename}?imwidth=160`}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
        <div className="shrink-0 flex items-center pl-2">
          <p className="text-xs text-text-muted">
            <span className="font-medium text-text">{selectedProduct.name}</span>
            <br />
            {selectedProduct.sku}
          </p>
        </div>
      </div>

      {/* Controls Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Format Selector */}
        <div className="bg-surface rounded-xl border border-border-subtle p-4">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Output Format</p>
          <div className="grid grid-cols-2 gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                  format === opt.value
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-raised text-text-secondary border-border-subtle hover:border-border"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            IM auto-negotiates via Accept header
          </p>
        </div>

        {/* Device Selector */}
        <div className="bg-surface rounded-xl border border-border-subtle p-4">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Device Target</p>
          <div className="grid grid-cols-2 gap-2">
            {DEVICE_PRESETS.map((preset) => {
              const Icon = DeviceIcon[preset.icon]
              return (
                <button
                  key={preset.label}
                  onClick={() => setDevice(preset)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                    device.label === preset.label
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-raised text-text-secondary border-border-subtle hover:border-border"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Quality Preset */}
        <div className="bg-surface rounded-xl border border-border-subtle p-4">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            Perceptual Quality
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUALITY_PRESETS.map((preset) => (
              <button
                key={preset.policy}
                onClick={() => setQualityPreset(preset)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                  qualityPreset.policy === preset.policy
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-raised text-text-secondary border-border-subtle hover:border-border"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            IM policy controls output quality
          </p>
        </div>
      </div>

      {/* Savings Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Original Size"
          value={loadingOriginal ? "..." : originalSize ? formatBytes(originalSize) : "—"}
          color="warning"
        />
        <MetricCard
          label="Optimized Size"
          value={loadingTransformed ? "..." : transformedSize ? formatBytes(transformedSize) : "—"}
          color="success"
        />
        <MetricCard
          label="Size Reduction"
          value={loadingOriginal || loadingTransformed ? "..." : savings ? `${savings}%` : "—"}
          subtitle={savings ? "Bandwidth saved per request" : undefined}
          color="success"
        />
        <MetricCard
          label="Format Served"
          value={loadingTransformed ? "..." : transformedFormat.split("/")[1]?.toUpperCase() || "—"}
          subtitle={`${device.label} @ ${device.width}px`}
          color="primary"
        />
      </div>

      {/* Image Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Original (from origin)</span>
            <div className="flex items-center gap-2">
              {loadingOriginal && <Loader2 className="w-3 h-3 animate-spin text-text-muted" />}
              {originalSize && !loadingOriginal && (
                <span className="text-xs font-mono text-warning">{formatBytes(originalSize)}</span>
              )}
            </div>
          </div>
          <div className="aspect-square bg-background flex items-center justify-center p-4">
            <img
              src={originalUrl}
              alt="Original"
              className="max-w-full max-h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/800x800/1e293b/64748b?text=${selectedProduct.name}` }}
            />
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-raised border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">
              Optimized (via Image Manager)
            </span>
            <div className="flex items-center gap-2">
              {loadingTransformed && <Loader2 className="w-3 h-3 animate-spin text-text-muted" />}
              {transformedFormat && !loadingTransformed && (
                <span className="text-xs font-mono text-primary">{transformedFormat.split("/")[1]?.toUpperCase()}</span>
              )}
              {transformedSize && !loadingTransformed && (
                <span className="text-xs font-mono text-success">{formatBytes(transformedSize)}</span>
              )}
            </div>
          </div>
          <div className="aspect-square bg-background flex items-center justify-center p-4">
            <img
              key={`${transformedUrl}-${format}`}
              src={transformedUrl}
              alt="Transformed"
              className="max-w-full max-h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/800x800/1e293b/3b82f6?text=IM+Transform` }}
            />
          </div>
        </div>
      </div>

      {/* URL Inspector */}
      <UrlInspector
        baseUrl={`${IMAGE_BASE_URL}/${selectedProduct.filename}`}
        params={[
          ...imParams,
          { key: "Accept", value: acceptHeader, description: format ? `Request ${format.toUpperCase()} format via content negotiation` : "Auto-negotiate best format the client supports" },
        ]}
      />

      {/* Available Transformations */}
      <div className="mt-6 bg-surface rounded-xl border border-border-subtle overflow-hidden">
        <div className="px-5 py-4 bg-surface-raised border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text">All Available IM Transformations</h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            Beyond resize and format — Image Manager supports 30+ policy-driven transformations, all applied at the edge with zero origin-side processing.
          </p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-6">
          {/* Visual Effects */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Paintbrush className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-text uppercase tracking-wider">Visual Effects</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                { name: "Background Color", desc: "Set or swap background fill" },
                { name: "Blur", desc: "Gaussian blur at configurable radius" },
                { name: "Chroma Key", desc: "Remove specific colors (green screen)" },
                { name: "Composite", desc: "Overlay watermarks or badges" },
                { name: "Contrast", desc: "Adjust contrast levels" },
                { name: "Goop", desc: "Liquify / distortion effect" },
                { name: "Grayscale", desc: "Convert to grayscale" },
                { name: "HSL Adjust", desc: "Tune hue, saturation, lightness" },
                { name: "HSV Adjust", desc: "Tune hue, saturation, value" },
                { name: "Max Colors", desc: "Reduce color palette" },
                { name: "Mono Hue", desc: "Monochromatic color effect" },
                { name: "Opacity", desc: "Adjust transparency" },
                { name: "Remove Color", desc: "Eliminate specific colors" },
                { name: "Unsharp Mask", desc: "Sharpen fine details" },
              ].map((t) => (
                <div key={t.name} className="group flex items-start gap-1.5 py-0.5">
                  <span className="text-[11px] font-medium text-text-secondary group-hover:text-text transition-colors">{t.name}</span>
                  <span className="text-[10px] text-text-muted hidden group-hover:inline">— {t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Crop & Resize */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scissors className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-text uppercase tracking-wider">Crop & Manipulation</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                { name: "Append", desc: "Concatenate images together" },
                { name: "Aspect Crop", desc: "Crop to exact aspect ratio" },
                { name: "Crop", desc: "Remove image regions" },
                { name: "Face Crop", desc: "Auto-detect and crop around faces" },
                { name: "Feature Crop", desc: "Crop around key visual features" },
                { name: "Fit and Fill", desc: "Resize to fit dimensions" },
                { name: "Mirror", desc: "Horizontal or vertical flip" },
                { name: "ROI Crop", desc: "Crop to region of interest" },
                { name: "Relative Crop", desc: "Proportional crop" },
                { name: "Resize", desc: "Change dimensions" },
                { name: "Rotate", desc: "Rotate at any angle" },
                { name: "Scale", desc: "Proportional size adjust" },
                { name: "Shear", desc: "Skew transformation" },
                { name: "Smart Crop", desc: "AI-driven content-aware crop" },
                { name: "Trim", desc: "Remove empty borders" },
              ].map((t) => (
                <div key={t.name} className="group flex items-start gap-1.5 py-0.5">
                  <span className="text-[11px] font-medium text-text-secondary group-hover:text-text transition-colors">{t.name}</span>
                  <span className="text-[10px] text-text-muted hidden group-hover:inline">— {t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-4">
          <p className="text-[10px] text-text-muted">
            All transformations are configured via IM policies — no application code changes required. Transformations chain together and execute in a single pass at the edge.
          </p>
        </div>
      </div>
    </div>
  )
}
