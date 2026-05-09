import type { TicketPriority } from '../../lib/types'

const priorityConfig = {
  urgente: { label: 'Urgente', color: 'bg-amber-50 text-amber-700 border-amber-300', emoji: '🔴' },
  normal: { label: 'Normal', color: 'bg-green-50 text-green-700 border-green-200', emoji: '🟢' },
}

interface PriorityBadgeProps {
  priority: TicketPriority
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full text-xs px-2.5 py-1 font-medium ${config.color}`}>
      <span>{config.emoji}</span>
      {config.label}
    </span>
  )
}
