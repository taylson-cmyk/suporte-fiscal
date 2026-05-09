import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTicket } from '../hooks/useTickets'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/layout/AppLayout'
import StatusBadge from '../components/ui/StatusBadge'
import PriorityBadge from '../components/ui/PriorityBadge'
import CategoryBadge from '../components/ui/CategoryBadge'
import Timer from '../components/ui/Timer'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, User, Send, ArrowLeft, ZoomIn, X, ChevronDown } from 'lucide-react'
import type { TicketStatus } from '../lib/types'

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'nao_iniciado', label: '⚪ Não iniciado' },
  { value: 'em_andamento', label: '🔵 Em andamento' },
  { value: 'concluido', label: '✅ Concluído' },
  { value: 'impedido', label: '🚫 Impedido' },
]

export default function TicketDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { ticket, loading, refresh } = useTicket(id!)
  const [comentario, setComentario] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const isEscritorio = user?.perfil === 'escritorio'

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!ticket) return
    setUpdatingStatus(true)
    setShowStatusMenu(false)

    const updates: Record<string, any> = { status: newStatus }
    if (newStatus === 'em_andamento' && !ticket.iniciado_em) {
      updates.iniciado_em = new Date().toISOString()
    }
    if (newStatus === 'concluido') {
      updates.concluido_em = new Date().toISOString()
    }
    if (newStatus !== 'concluido') {
      updates.concluido_em = null
    }

    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticket.id)

    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      toast.success('Status atualizado!')
      refresh()
    }
    setUpdatingStatus(false)
  }

  async function handleResponsavelChange(responsavelId: string) {
    if (!ticket) return
    const { error } = await supabase
      .from('tickets')
      .update({ responsavel: responsavelId || null })
      .eq('id', ticket.id)
    if (error) {
      toast.error('Erro ao atualizar responsável')
    } else {
      toast.success('Responsável atualizado!')
      refresh()
    }
  }

  async function handleSendComment(e: FormEvent) {
    e.preventDefault()
    if (!comentario.trim() || !user || !ticket) return
    setSendingComment(true)
    const { error } = await supabase.from('ticket_comentarios').insert({
      ticket_id: ticket.id,
      usuario_id: user.id,
      mensagem: comentario.trim(),
    })
    if (error) {
      toast.error('Erro ao enviar comentário')
    } else {
      setComentario('')
      refresh()
    }
    setSendingComment(false)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-gray-500">Carregando ticket...</div>
      </AppLayout>
    )
  }

  if (!ticket) {
    return (
      <AppLayout>
        <div className="text-center py-24">
          <p className="text-gray-500 mb-4">Ticket não encontrado.</p>
          <button onClick={() => navigate('/tickets')} className="btn-secondary">
            Voltar aos tickets
          </button>
        </div>
      </AppLayout>
    )
  }

  const tempoAtePrimeiroAtendimento = ticket.iniciado_em
    ? Math.floor((new Date(ticket.iniciado_em).getTime() - new Date(ticket.criado_em).getTime()) / 1000)
    : null

  function formatSeconds(s: number) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (h > 0) return `${h}h ${m}min`
    return `${m}min`
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/tickets')} className="btn-secondary py-1.5 px-2.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="ticket-number text-base">#{String(ticket.numero).padStart(4, '0')}</span>
            <h1 className="text-lg font-semibold text-gray-900">{ticket.titulo}</h1>
          </div>
          <p className="text-sm text-gray-500">
            Aberto em {format(new Date(ticket.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por{' '}
            <span className="font-medium">{ticket.criador?.nome}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Descrição</h3>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{ticket.descricao}</p>

            {ticket.observacoes && (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Observações</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{ticket.observacoes}</p>
              </>
            )}
          </div>

          {/* Attachments */}
          {ticket.anexos && ticket.anexos.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Anexos ({ticket.anexos.length})</h3>
              <div className="grid grid-cols-4 gap-3">
                {ticket.anexos.map(anexo => (
                  <div
                    key={anexo.id}
                    className="relative group cursor-pointer"
                    onClick={() => setPreviewImage(anexo.url_arquivo)}
                  >
                    <img
                      src={anexo.url_arquivo}
                      alt={anexo.nome_arquivo}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/40 rounded-full p-1.5">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">{anexo.nome_arquivo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Histórico de comentários ({ticket.comentarios?.length || 0})
            </h3>

            {ticket.comentarios && ticket.comentarios.length > 0 ? (
              <div className="space-y-4 mb-4">
                {ticket.comentarios.map(comentario => (
                  <div key={comentario.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                      {comentario.usuario?.nome?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">{comentario.usuario?.nome}</span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(comentario.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          comentario.usuario?.perfil === 'escritorio'
                            ? 'bg-primary-50 text-primary-900'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {comentario.usuario?.perfil === 'escritorio' ? 'Escritório' : 'Cliente'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">
                        {comentario.mensagem}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">Nenhum comentário ainda.</p>
            )}

            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Escreva um comentário..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
              />
              <button
                type="submit"
                disabled={sendingComment || !comentario.trim()}
                className="btn-primary disabled:opacity-60 px-3"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status</h3>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={ticket.status} />
            </div>

            {isEscritorio && (
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={updatingStatus}
                  className="w-full btn-secondary justify-between disabled:opacity-60"
                >
                  <span>Alterar status</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showStatusMenu && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(opt.value)}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                          ticket.status === opt.value ? 'bg-primary-50 text-primary-900 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timers */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cronômetros</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Tempo desde a abertura
                </p>
                <Timer
                  startDate={ticket.criado_em}
                  endDate={ticket.concluido_em}
                  className="text-primary-900 font-bold text-lg"
                />
              </div>
              {tempoAtePrimeiroAtendimento !== null && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tempo até 1º atendimento</p>
                  <p className="font-mono text-sm font-bold text-blue-700">
                    {formatSeconds(tempoAtePrimeiroAtendimento)}
                  </p>
                </div>
              )}
              {ticket.concluido_em && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tempo total de resolução</p>
                  <p className="font-mono text-sm font-bold text-green-700">
                    {formatSeconds(
                      Math.floor(
                        (new Date(ticket.concluido_em).getTime() - new Date(ticket.criado_em).getTime()) / 1000
                      )
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Informações</h3>
            <div>
              <p className="text-xs text-gray-400">Categoria</p>
              <CategoryBadge category={ticket.categoria} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Prioridade</p>
              <PriorityBadge priority={ticket.prioridade} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Solicitante</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-700">{ticket.criador?.nome}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Responsável</p>
              {isEscritorio ? (
                <ResponsavelSelector
                  currentId={ticket.responsavel}
                  currentName={ticket.responsavel_user?.nome}
                  onChange={handleResponsavelChange}
                />
              ) : (
                <p className="text-sm text-gray-700">{ticket.responsavel_user?.nome || '—'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImage}
            alt="Prévia"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </AppLayout>
  )
}

function ResponsavelSelector({
  currentId,
  currentName,
  onChange,
}: {
  currentId: string | null
  currentName?: string
  onChange: (id: string) => void
}) {
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([])
  const [open, setOpen] = useState(false)

  async function loadUsers() {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome')
      .eq('perfil', 'escritorio')
      .order('nome')
    if (data) setUsuarios(data)
    setOpen(true)
  }

  return (
    <div className="relative">
      <button
        onClick={loadUsers}
        className="text-sm text-gray-700 hover:text-primary-900 flex items-center gap-1 underline-offset-2 hover:underline"
      >
        {currentName || 'Atribuir responsável'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              Sem responsável
            </button>
            {usuarios.map(u => (
              <button
                key={u.id}
                onClick={() => { onChange(u.id); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${u.id === currentId ? 'text-primary-900 font-medium' : 'text-gray-700'}`}
              >
                {u.nome}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
