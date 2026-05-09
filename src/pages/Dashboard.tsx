import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTickets } from '../hooks/useTickets'
import AppLayout from '../components/layout/AppLayout'
import StatusBadge from '../components/ui/StatusBadge'
import PriorityBadge from '../components/ui/PriorityBadge'
import CategoryBadge from '../components/ui/CategoryBadge'
import Timer from '../components/ui/Timer'
import { PlusCircle, LayoutGrid, List, Clock, AlertCircle, CheckCircle, Pause } from 'lucide-react'
import { format, subDays, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Ticket, TicketStatus } from '../lib/types'

export default function Dashboard() {
  const { user } = useAuth()
  const isEscritorio = user?.perfil === 'escritorio'
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterPrioridade, setFilterPrioridade] = useState('')
  const [filterDias, setFilterDias] = useState('30')

  // Busca todos os tickets sem filtro de status para os cartões de resumo
  const { tickets: allTickets, loading } = useTickets({
    categoria: filterCategoria as any,
    prioridade: filterPrioridade as any,
  })

  // Cartões sempre mostram todos os tickets (sem filtro de período)
  const stats = useMemo(() => ({
    nao_iniciado: allTickets.filter(t => t.status === 'nao_iniciado').length,
    em_andamento: allTickets.filter(t => t.status === 'em_andamento').length,
    concluido: allTickets.filter(t => t.status === 'concluido').length,
    impedido: allTickets.filter(t => t.status === 'impedido').length,
  }), [allTickets])

  // Lista/Kanban filtram pelo período selecionado
  const filteredTickets = useMemo(() => {
    const cutoff = subDays(new Date(), parseInt(filterDias))
    return allTickets.filter(t => isAfter(new Date(t.criado_em), cutoff))
  }, [allTickets, filterDias])

  const chartData = useMemo(() => {
    const days = Math.min(parseInt(filterDias), 30) // limita a 30 barras para legibilidade
    const buckets: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'dd/MM', { locale: ptBR })
      buckets[d] = 0
    }
    filteredTickets.forEach(t => {
      const d = format(new Date(t.criado_em), 'dd/MM', { locale: ptBR })
      if (d in buckets) buckets[d]++
    })
    return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  }, [filteredTickets, filterDias])

  const statCards = [
    { label: 'Não iniciado', value: stats.nao_iniciado, icon: Pause, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
    { label: 'Em andamento', value: stats.em_andamento, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Concluído', value: stats.concluido, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Impedido', value: stats.impedido, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  ]

  const kanbanColumns: { status: TicketStatus; label: string; color: string }[] = [
    { status: 'nao_iniciado', label: 'Não iniciado', color: 'border-t-gray-400' },
    { status: 'em_andamento', label: 'Em andamento', color: 'border-t-blue-500' },
    { status: 'concluido', label: 'Concluído', color: 'border-t-green-500' },
    { status: 'impedido', label: 'Impedido', color: 'border-t-red-500' },
  ]

  return (
    <AppLayout
      title="Painel de controle"
      subtitle={isEscritorio ? 'Visão geral de todos os tickets' : 'Acompanhe seus tickets'}
      actions={
        <Link to="/tickets/novo" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Novo ticket
        </Link>
      }
    >
      {/* Stats cards — mostram totais globais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => (
          <div key={card.label} className={`card p-4 border ${card.border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 font-medium">{card.label}</span>
              <div className={`rounded-lg p-1.5 ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <select className="input w-auto" value={filterDias} onChange={e => setFilterDias(e.target.value)}>
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
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
        <div className="ml-auto flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setView('table')}
            className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${view === 'table' ? 'bg-primary-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" /> Lista
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${view === 'kanban' ? 'bg-primary-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
        </div>
      </div>

      {/* Chart */}
      {isEscritorio && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Tickets abertos por dia</h3>
            <span className="text-xs text-gray-400">{filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} no período</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                labelStyle={{ fontWeight: 600 }}
                cursor={{ fill: 'rgba(26,58,110,0.04)' }}
              />
              <Bar dataKey="count" fill="#1a3a6e" radius={[4, 4, 0, 0]} name="Tickets" maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ticket list / kanban */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-6 h-6 border-2 border-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Carregando tickets...</p>
        </div>
      ) : view === 'table' ? (
        <TicketTable tickets={filteredTickets} isEscritorio={isEscritorio} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map(col => (
            <div key={col.status} className={`bg-gray-50 rounded-xl border-t-4 ${col.color} border border-gray-200 p-3`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-full px-2 py-0.5">
                  {filteredTickets.filter(t => t.status === col.status).length}
                </span>
              </div>
              <div className="space-y-2">
                {filteredTickets.filter(t => t.status === col.status).map(ticket => (
                  <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer mb-2">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="ticket-number">#{String(ticket.numero).padStart(4, '0')}</span>
                        <PriorityBadge priority={ticket.prioridade} />
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">{ticket.titulo}</p>
                      <CategoryBadge category={ticket.categoria} />
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <Timer startDate={ticket.criado_em} endDate={ticket.concluido_em} />
                      </div>
                    </div>
                  </Link>
                ))}
                {filteredTickets.filter(t => t.status === col.status).length === 0 && (
                  <div className="text-center py-6 text-sm text-gray-400">Nenhum ticket</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}

function TicketTable({ tickets, isEscritorio }: { tickets: Ticket[]; isEscritorio: boolean }) {
  if (tickets.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500 mb-4">Nenhum ticket no período selecionado.</p>
        <Link to="/tickets/novo" className="btn-primary inline-flex">
          <PlusCircle className="w-4 h-4" /> Criar ticket
        </Link>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nº</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
              {isEscritorio && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>}
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridade</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tempo aberto</th>
              {isEscritorio && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Responsável</th>}
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="ticket-number">#{String(ticket.numero).padStart(4, '0')}</span>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium text-gray-800 truncate">{ticket.titulo}</p>
                </td>
                {isEscritorio && (
                  <td className="px-4 py-3 text-gray-600">{ticket.criador?.nome || '—'}</td>
                )}
                <td className="px-4 py-3"><CategoryBadge category={ticket.categoria} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={ticket.prioridade} /></td>
                <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                <td className="px-4 py-3 text-gray-500">
                  <Timer startDate={ticket.criado_em} endDate={ticket.concluido_em} />
                </td>
                {isEscritorio && (
                  <td className="px-4 py-3 text-gray-600">{ticket.responsavel_user?.nome || '—'}</td>
                )}
                <td className="px-4 py-3">
                  <Link to={`/tickets/${ticket.id}`} className="text-primary-900 hover:underline text-xs font-medium">
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
