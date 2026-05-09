import type { TicketCategory } from '../../lib/types'

const categoryConfig = {
  tributacao: { label: 'Tributação', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  revenda: { label: 'Revenda', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  consumo: { label: 'Consumo', color: 'bg-orange-50 text-orange-700 border-orange-200' },
}

interface CategoryBadgeProps {
  category: TicketCategory
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = categoryConfig[category]
  return (
    <span className={`inline-flex items-center border rounded-full text-xs px-2.5 py-1 font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
