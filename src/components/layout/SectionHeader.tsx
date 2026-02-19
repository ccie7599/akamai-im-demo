import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  step: number
  title: string
  akamaiProduct: string | string[]
  useCase: string
  description: string
}

export function SectionHeader({
  step,
  title,
  akamaiProduct,
  useCase,
  description,
}: SectionHeaderProps) {
  const products = Array.isArray(akamaiProduct) ? akamaiProduct : [akamaiProduct]

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Step {step} of 5
        </span>
        {products.map((product) => (
          <span key={product} className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20">
            {product}
          </span>
        ))}
      </div>
      <h2 className="text-2xl font-bold text-text mb-2">{title}</h2>
      <div className="bg-accent-red-muted/30 border border-accent-red/20 rounded-lg px-4 py-2.5 mb-3">
        <p className="text-xs font-medium text-accent-red/80 uppercase tracking-wider mb-0.5">
          Use Case
        </p>
        <p className="text-sm text-text">{useCase}</p>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  )
}
