import { useState, useEffect } from 'react'
import { mockDb } from '../lib/mockDb'
import AppLayout from '../components/layout/AppLayout'
import type { User } from '../lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Building2, UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Configuracoes() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchUsuarios() {
    const data = await mockDb.getAllUsers()
    setUsuarios(data.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()))
    setLoading(false)
  }

  useEffect(() => { fetchUsuarios() }, [])

  const filtered = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function togglePerfil(u: User) {
    const novo = u.perfil === 'escritorio' ? 'cliente' : 'escritorio'
    await mockDb.updateUser(u.id, { perfil: novo })
    toast.success(`Perfil alterado para ${novo === 'escritorio' ? 'Escritório' : 'Cliente'}`)
    fetchUsuarios()
  }

  return (
    <AppLayout
      title="Configurações"
      subtitle="Gerenciamento de usuários do sistema"
    >
      <div className="max-w-4xl">
        <div className="card mb-6 p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar usuário por nome ou e-mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500 whitespace-nowrap">
            {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-gray-500">Carregando usuários...</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cadastrado em</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        u.perfil === 'escritorio'
                          ? 'bg-primary-50 text-primary-900 border-primary-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {u.perfil === 'escritorio' ? <Building2 className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        {u.perfil === 'escritorio' ? 'Escritório' : 'Cliente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(u.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePerfil(u)}
                        className="text-xs text-primary-900 hover:underline font-medium"
                      >
                        Alterar para {u.perfil === 'escritorio' ? 'Cliente' : 'Escritório'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
