import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { mockDb } from '../lib/mockDb'
import AppLayout from '../components/layout/AppLayout'
import toast from 'react-hot-toast'
import { Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Perfil() {
  const { user, refreshUser } = useAuth()
  const [nome, setNome] = useState(user?.nome || '')
  const [loading, setLoading] = useState(false)

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    await mockDb.updateUser(user.id, { nome })
    await refreshUser() // atualiza sidebar imediatamente
    setLoading(false)
    toast.success('Perfil atualizado!')
  }

  if (!user) return null

  return (
    <AppLayout title="Meu perfil" subtitle="Gerencie suas informações pessoais">
      <div className="max-w-lg">
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-900 text-white flex items-center justify-center text-2xl font-bold">
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.nome}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                user.perfil === 'escritorio'
                  ? 'bg-primary-50 text-primary-900 border-primary-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                <Building2 className="w-3 h-3" />
                {user.perfil === 'escritorio' ? 'Escritório' : 'Cliente'}
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input
                className="input"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input bg-gray-50 text-gray-500 cursor-not-allowed" value={user.email} disabled />
            </div>
            <div>
              <label className="label">Membro desde</label>
              <input
                className="input bg-gray-50 text-gray-500 cursor-not-allowed"
                value={format(new Date(user.criado_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                disabled
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
