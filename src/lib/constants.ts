export const AKAMAI_HOST = import.meta.env.VITE_AKAMAI_HOST || "demo.example.com"
export const ORIGIN_HOST = import.meta.env.VITE_ORIGIN_HOST || "origin-demo.example.com"

export const IMAGE_BASE_URL = `https://${AKAMAI_HOST}/images`
export const ORIGIN_IMAGE_BASE_URL = `https://${ORIGIN_HOST}/images`

export interface ProductImage {
  id: string
  name: string
  sku: string
  filename: string
  replacementFilename?: string
  category: string
}

export const PRODUCT_CATALOG: ProductImage[] = [
  { id: "001", name: "Wireless Speaker", sku: "DEMO-SPK-001", filename: "product-001.jpg", category: "Electronics" },
  { id: "002", name: "Cotton Throw Pillow", sku: "DEMO-PLW-002", filename: "product-002.jpg", category: "Home" },
  { id: "003", name: "Stainless Steel Tumbler", sku: "DEMO-TMB-003", filename: "product-003.jpg", replacementFilename: "product-003-replacement.jpg", category: "Kitchen" },
  { id: "004", name: "Kids Backpack", sku: "DEMO-BPK-004", filename: "product-004.jpg", category: "Kids" },
  { id: "005", name: "Scented Candle Set", sku: "DEMO-CND-005", filename: "product-005.jpg", category: "Home" },
  { id: "006", name: "Running Shoes", sku: "DEMO-SHO-006", filename: "product-006.jpg", category: "Sports" },
]

export const DEVICE_PRESETS = [
  { label: "Mobile", width: 320, density: 1, icon: "Smartphone" as const },
  { label: "Tablet", width: 768, density: 1, icon: "Tablet" as const },
  { label: "Desktop", width: 1280, density: 1, icon: "Monitor" as const },
  { label: "Retina", width: 2560, density: 2, icon: "MonitorCheck" as const },
]

export const FORMAT_OPTIONS = [
  { label: "WebP", value: "webp", description: "Modern, widely supported" },
  { label: "AVIF", value: "avif", description: "Next-gen, smallest size" },
  { label: "JPEG", value: "jpeg", description: "Universal compatibility" },
  { label: "Auto", value: "", description: "Best format via content negotiation" },
]

export const QUALITY_PRESETS = [
  { label: "Low", policy: "low", description: "Smallest file size" },
  { label: "Medium", policy: "medium", description: "Balanced quality" },
  { label: "High", policy: "high", description: "Near-lossless" },
  { label: "Pristine", policy: "pristine", description: "Maximum fidelity" },
]

export const SECTIONS = [
  {
    path: "/media-transform",
    step: 1,
    title: "Media Transformation",
    akamaiProduct: ["Image Manager"],
    useCase: "One master asset → device-optimized delivery (WebP, AVIF, Retina) on-the-fly",
    icon: "Image" as const,
    description: "Real-time image transformation without pre-rendering. Dynamic resizing, format conversion, and perceptual quality adjustment at the edge.",
  },
  {
    path: "/observability",
    step: 2,
    title: "Observability & Attribution",
    akamaiProduct: ["DataStream 2", "TrafficPeak"],
    useCase: "Request-level telemetry for CDN attribution and analytics integration",
    icon: "Activity" as const,
    description: "Granular, real-time telemetry for every asset request. Feed CDN performance data into your analytics and observability platforms.",
  },
  {
    path: "/governance",
    step: 3,
    title: "Asset Governance",
    akamaiProduct: ["CCU / Fast Purge"],
    useCase: "Rights and expiration enforcement; replace images without URL changes",
    icon: "Shield" as const,
    description: "Manage asset lifecycle with sub-5-second cache invalidation. Enforce rights, expiration, and approval states in near real-time.",
  },
  {
    path: "/edge-logic",
    step: 4,
    title: "Edge Logic",
    akamaiProduct: ["EdgeWorkers", "Functions"],
    useCase: "Multi-CDN audit metadata, QA cache bypass, and dynamic cache policy enforcement",
    icon: "Code" as const,
    description: "Edge-level extensibility for proxy logic, audit tagging, and cache policy enforcement with deterministic, versioned execution.",
  },
  {
    path: "/performance",
    step: 5,
    title: "Performance & Reliability",
    akamaiProduct: ["CDN Delivery", "CloudWrapper"],
    useCase: "100% uptime SLA, sub-50ms edge latency",
    icon: "Zap" as const,
    description: "Measurable CDN performance with CloudWrapper mid-tier caching, Cache+ IM derivative persistence, and latency benchmarking.",
  },
]
