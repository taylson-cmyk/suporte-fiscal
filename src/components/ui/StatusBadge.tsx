import type { TicketStatus } from '../../lib/types'

const statusConfig = {
  nao_iniciado: { label: 'Não iniciado', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  concluido: { label: 'Concluído', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  impedido: { label: 'Impedido', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
}

interface StatusBadgeProps {
  status: TicketStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full font-medium ${config.color} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export { statusConfig }
