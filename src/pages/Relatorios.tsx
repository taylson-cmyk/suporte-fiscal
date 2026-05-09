import { useState, useMemo } from 'react'
import { useTickets } from '../hooks/useTickets'
import AppLayout from '../components/layout/AppLayout'
import StatusBadge from '../components/ui/StatusBadge'
import CategoryBadge from '../components/ui/CategoryBadge'
import PriorityBadge from '../components/ui/PriorityBadge'
import { subDays, isAfter, format } from 'date-fns'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Download, FileText } from 'lucide-react'
import { formatDuration } from '../components/ui/Timer'

const COLORS = ['#6b7280', '#3b82f6', '#22c55e', '#ef4444']
const BAR_COLORS = ['#a855f7', '#06b6d4', '#f97316']

function calcSeconds(start: string, end: string) {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)
}

export default function Relatorios() {
  const [filterDias, setFilterDias] = useState('30')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterPrioridade, setFilterPrioridade] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const { tickets } = useTickets({
    categoria: filterCategoria as any,
    prioridade: filterPrioridade as any,
    status: filterStatus as any,
  })

  const filtered = useMemo(() => {
    const cutoff = subDays(new Date(), parseInt(filterDias))
    return tickets.filter(t => isAfter(new Date(t.criado_em), cutoff))
  }, [tickets, filterDias])

  const statusData = useMemo(() => [
    { name: 'Não iniciado', value: filtered.filter(t => t.status === 'nao_iniciado').length },
    { name: 'Em andamento', value: filtered.filter(t => t.status === 'em_andamento').length },
    { name: 'Concluído', value: filtered.filter(t => t.status === 'concluido').length },
    { name: 'Impedido', value: filtered.filter(t => t.status === 'impedido').length },
  ], [filtered])

  const categoryData = useMemo(() => [
    { name: 'Tributação', value: filtered.filter(t => t.categoria === 'tributacao').length },
    { name: 'Revenda', value: filtered.filter(t => t.categoria === 'revenda').length },
    { name: 'Consumo', value: filtered.filter(t => t.categoria === 'consumo').length },
  ], [filtered])

  const priorityData = useMemo(() => [
    { name: 'Urgente', value: filtered.filter(t => t.prioridade === 'urgente').length },
    { name: 'Normal', value: filtered.filter(t => t.prioridade === 'normal').length },
  ], [filtered])

  const avgResolutionTime = useMemo(() => {
    const concluidos = filtered.filter(t => t.status === 'concluido' && t.concluido_em)
    if (concluidos.length === 0) return null
    const total = concluidos.reduce((acc, t) => acc + calcSeconds(t.criado_em, t.concluido_em!), 0)
    return Math.floor(total / concluidos.length)
  }, [filtered])

  const avgByResponsavel = useMemo(() => {
    const map: Record<string, { nome: string; times: number[]; count: number }> = {}
    filtered
      .filter(t => t.status === 'concluido' && t.concluido_em && t.responsavel_user)
      .forEach(t => {
        const key = t.responsavel!
        if (!map[key]) map[key] = { nome: t.responsavel_user!.nome, times: [], count: 0 }
        map[key].times.push(calcSeconds(t.criado_em, t.concluido_em!))
        map[key].count++
      })
    return Object.values(map).map(r => ({
      nome: r.nome,
      count: r.count,
      avg: Math.floor(r.times.reduce((a, b) => a + b, 0) / r.times.length),
    }))
  }, [filtered])

  function exportCSV() {
    const headers = ['Nº', 'Título', 'Categoria', 'Prioridade', 'Status', 'Abertura', 'Conclusão', 'Tempo Total (s)', 'Responsável']
    const rows = filtered.map(t => [
      String(t.numero).padStart(4, '0'),
      t.titulo,
      t.categoria,
      t.prioridade,
      t.status,
      format(new Date(t.criado_em), 'dd/MM/yyyy HH:mm'),
      t.concluido_em ? format(new Date(t.concluido_em), 'dd/MM/yyyy HH:mm') : '',
      t.concluido_em ? calcSeconds(t.criado_em, t.concluido_em) : '',
      t.responsavel_user?.nome || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-suporte-fiscal-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout
      title="Relatórios"
      subtitle="Métricas e análise de atendimento"
      actions={
        <button onClick={exportCSV} className="btn-secondary">
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      }
    >
      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3">
        <select className="input w-auto" value={filterDias} onChange={e => setFilterDias(e.target.value)}>
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </select>
        <select className="input w-auto" value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          <option value="tributacao">Tributação</option>
          <option value="revenda">Revenda</option>
          <option value="consumo">Consumo</option>
        </select>
        <select className="input w-auto" value={filterPrioridade} onChange={e => setFilterPrioridade(e.target.value)}>
          <option value="">Todas as prioridades</option>
          <option value="urgente">Urgente</option>
          <option value="normal">Normal</option>
        </select>
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="nao_iniciado">Não iniciado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluído</option>
          <option value="impedido">Impedido</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total de tickets</p>
          <p className="text-3xl font-bold text-primary-900 mt-1">{filtered.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Concluídos</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {filtered.filter(t => t.status === 'concluido').length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Tempo médio resolução</p>
          <p className="text-xl font-bold text-primary-900 mt-1 font-mono">
            {avgResolutionTime !== null ? formatDuration(avgResolutionTime) : '—'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Urgentes</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {filtered.filter(t => t.prioridade === 'urgente').length}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tickets por status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tickets por categoria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tickets por prioridade</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
                <Cell fill="#f59e0b" />
                <Cell fill="#22c55e" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {avgByResponsavel.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tempo médio por responsável</h3>
            <div className="space-y-3">
              {avgByResponsavel.map(r => (
                <div key={r.nome} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{r.nome}</p>
                    <p className="text-xs text-gray-400">{r.count} ticket{r.count !== 1 ? 's' : ''} concluído{r.count !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary-900">
                    {formatDuration(r.avg)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Tabela detalhada ({filtered.length} tickets)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nº</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Abertura</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Conclusão</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tempo total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="ticket-number">#{String(ticket.numero).padStart(4, '0')}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-800 truncate">{ticket.titulo}</p>
                  </td>
                  <td className="px-4 py-3"><CategoryBadge category={ticket.categoria} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={ticket.prioridade} /></td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} size="sm" /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(ticket.criado_em), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {ticket.concluido_em ? format(new Date(ticket.concluido_em), 'dd/MM/yyyy HH:mm') : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {ticket.concluido_em
                      ? formatDuration(calcSeconds(ticket.criado_em, ticket.concluido_em))
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {ticket.responsavel_user?.nome || '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    Nenhum ticket no período selecionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
