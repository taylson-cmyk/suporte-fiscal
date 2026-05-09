import { useState, type FormEvent, type ChangeEvent, type ClipboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockDb } from '../lib/mockDb'
import { useAuth } from '../contexts/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import toast from 'react-hot-toast'
import { Upload, X, ClipboardPaste } from 'lucide-react'

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

  function addImageFiles(files: File[]) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return false
    const previews = imageFiles.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name || `print-${Date.now()}-${i}.png`,
    }))
    setAttachments(prev => [...prev, ...previews])
    return true
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    addImageFiles(Array.from(e.target.files || []))
    e.target.value = ''
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return

    const files = imageItems
      .map(item => item.getAsFile())
      .filter((f): f is File => f !== null)
      .map((f, i) => new File([f], `print-colado-${Date.now()}-${i}.png`, { type: f.type }))

    const added = addImageFiles(files)
    if (added) {
      e.preventDefault()
      toast.success(`${files.length} imagem${files.length > 1 ? 's' : ''} colada${files.length > 1 ? 's' : ''}!`)
    }
  }

  function removeAttachment(index: number) {
    setAttachments(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    const ticket = await mockDb.createTicket({
      titulo,
      descricao,
      observacoes: observacoes || null,
      categoria,
      prioridade,
      criado_por: user.id,
    })

    for (const att of attachments) {
      await mockDb.addAnexo(ticket.id, att.file)
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
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Descrição *</label>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <ClipboardPaste className="w-3 h-3" /> Cole imagens com Ctrl+V
                </span>
              </div>
              <textarea
                className="input min-h-[120px] resize-y"
                placeholder="Descreva detalhadamente o problema... você também pode colar prints aqui com Ctrl+V"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                onPaste={handlePaste}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Observações</label>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <ClipboardPaste className="w-3 h-3" /> Cole imagens com Ctrl+V
                </span>
              </div>
              <textarea
                className="input min-h-[80px] resize-y"
                placeholder="Informações adicionais, referências... você também pode colar prints aqui com Ctrl+V"
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                onPaste={handlePaste}
              />
            </div>

            <div>
              <label className="label">Anexos (imagens)</label>
              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-700 hover:bg-primary-50 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600 font-medium">Clique para selecionar</span>
                  <span className="text-sm text-gray-400"> ou cole um print com </span>
                  <span className="text-sm font-mono font-bold text-gray-500">Ctrl+V</span>
                  <span className="text-sm text-gray-400"> nos campos acima</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {attachments.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">{attachments.length} imagem{attachments.length > 1 ? 's' : ''} anexada{attachments.length > 1 ? 's' : ''}</p>
                  <div className="grid grid-cols-4 gap-2">
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
