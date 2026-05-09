import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import toast from 'react-hot-toast'
import { Upload, X } from 'lucide-react'

interface AttachmentPreview {
  file: File
  preview: string
  name: string
}

export default function NovoTicket() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<'tributacao' | 'revenda' | 'consumo'>('tributacao')
  const [prioridade, setPrioridade] = useState<'urgente' | 'normal'>('normal')
  const [descricao, setDescricao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    const previews = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }))
    setAttachments(prev => [...prev, ...previews])
    e.target.value = ''
  }

  function removeAttachment(index: number) {
    setAttachments(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function uploadAttachment(ticketId: string, att: AttachmentPreview): Promise<string | null> {
    const ext = att.file.name.split('.').pop()
    const path = `${ticketId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('ticket-attachments')
      .upload(path, att.file)
    if (error) return null
    const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        titulo,
        descricao,
        observacoes: observacoes || null,
        categoria,
        prioridade,
        status: 'nao_iniciado',
        criado_por: user.id,
      })
      .select()
      .single()

    if (error || !ticket) {
      toast.error('Erro ao criar ticket')
      setLoading(false)
      return
    }

    // Upload attachments
    for (const att of attachments) {
      const url = await uploadAttachment(ticket.id, att)
      if (url) {
        await supabase.from('ticket_anexos').insert({
          ticket_id: ticket.id,
          url_arquivo: url,
          nome_arquivo: att.name,
        })
      }
    }

    toast.success(`Ticket #${String(ticket.numero).padStart(4, '0')} criado com sucesso!`)
    navigate(`/tickets/${ticket.id}`)
  }

  return (
    <AppLayout title="Novo ticket" subtitle="Preencha os dados para abrir um novo chamado">
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-5">
            <div>
              <label className="label">Título *</label>
              <input
                className="input"
                placeholder="Descreva brevemente o problema ou solicitação"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Categoria *</label>
                <select
                  className="input"
                  value={categoria}
                  onChange={e => setCategoria(e.target.value as any)}
                  required
                >
                  <option value="tributacao">Tributação</option>
                  <option value="revenda">Revenda</option>
                  <option value="consumo">Consumo</option>
                </select>
              </div>

              <div>
                <label className="label">Prioridade *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPrioridade('urgente')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      prioridade === 'urgente'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    🔴 Urgente
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrioridade('normal')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      prioridade === 'normal'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    🟢 Normal
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Descrição *</label>
              <textarea
                className="input min-h-[120px] resize-y"
                placeholder="Descreva detalhadamente o problema ou solicitação..."
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input min-h-[80px] resize-y"
                placeholder="Informações adicionais, referências, etc..."
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Anexos (imagens)</label>
              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-700 hover:bg-primary-50 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Clique para adicionar prints ou imagens</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {attachments.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {attachments.map((att, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={att.preview}
                        alt={att.name}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-gray-500 truncate mt-1">{att.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-60"
            >
              {loading ? 'Criando ticket...' : 'Criar ticket'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
