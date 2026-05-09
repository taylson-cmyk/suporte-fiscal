import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTickets } from '../hooks/useTickets'
import AppLayout from '../components/layout/AppLayout'
import StatusBadge from '../components/ui/StatusBadge'
import PriorityBadge from '../components/ui/PriorityBadge'
import CategoryBadge from '../components/ui/CategoryBadge'
import Timer from '../components/ui/Timer'
import { PlusCircle, Search, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Tickets() {
  const { user } = useAuth()
  const isEscritorio = user?.perfil === 'escritorio'
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterPrioridade, setFilterPrioridade] = useState('')

  const { tickets, loading } = useTickets({
    status: filterStatus as any,
    categoria: filterCategoria as any,
    prioridade: filterPrioridade as any,
    search,
  })

  return (
    <AppLayout
      title="Tickets"
      subtitle={isEscritorio ? `${tickets.length} tickets encontrados` : `${tickets.length} seus tickets`}
      actions={
        <Link to="/tickets/novo" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Novo ticket
        </Link>
      }
    >
      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Pesquisar por título..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="nao_iniciado">Não iniciado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluído</option>
          <option value="impedido">Impedido</option>
        </select>
        <select className="input w-auto" value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          <option value="tributacao">Tributação</option>
          <option value="revenda">Revenda</option>
          <option value="consumo">Consumo</option>
        </select>
        <select className="input w-auto" value={filterPrioridade} onChange={e => setFilterPrioridade(e.target.value)}>
          <option value="">Todas as prioridades</option>
          <option value="urgente">🔴 Urgente</option>
          <option value="normal">🟢 Normal</option>
        </select>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">Carregando tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">Nenhum ticket encontrado.</p>
          <Link to="/tickets/novo" className="btn-primary inline-flex">
            <PlusCircle className="w-4 h-4" />
            Abrir novo ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(ticket => (
            <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
              <div className={`card p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 ${ticket.prioridade === 'urgente' ? 'border-l-4 border-l-amber-500' : ''}`}>
                <div className="flex-shrink-0">
                  <span className="ticket-number">#{String(ticket.numero).padStart(4, '0')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 truncate">{ticket.titulo}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <StatusBadge status={ticket.status} size="sm" />
                    <CategoryBadge category={ticket.categoria} />
                    <PriorityBadge priority={ticket.prioridade} />
                  </div>
                </div>
                <div className="flex-shrink-0 text-right space-y-1 hidden sm:block">
                  {isEscritorio && ticket.criador && (
                    <p className="text-xs text-gray-500">{ticket.criador.nome}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {format(new Date(ticket.criado_em), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 justify-end">
                    <Clock className="w-3 h-3" />
                    <Timer startDate={ticket.criado_em} endDate={ticket.concluido_em} />
                  </div>
                </div>
                {isEscritorio && (
                  <div className="flex-shrink-0 text-xs text-gray-400 hidden md:block">
                    {ticket.responsavel_user?.nome || 'Sem responsável'}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
