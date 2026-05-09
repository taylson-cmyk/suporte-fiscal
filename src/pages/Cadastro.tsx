import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FileText, Eye, EyeOff, Building2, User } from 'lucide-react'

export default function Cadastro() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [perfil, setPerfil] = useState<'escritorio' | 'cliente'>('cliente')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    setLoading(true)
    const { error } = await signUp(email, password, nome, perfil)
    setLoading(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Conta criada! Verifique seu e-mail.')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-amber-500 rounded-xl p-2.5">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold leading-tight">Suporte Fiscal</h1>
            <p className="text-blue-300 text-xs">Gestão de atendimento contábil</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-gray-900 text-xl font-semibold mb-1">Criar conta</h2>
          <p className="text-gray-500 text-sm mb-6">Preencha os dados para se cadastrar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input
                type="text"
                className="input"
                placeholder="João da Silva"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Perfil de acesso</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPerfil('cliente')}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    perfil === 'cliente'
                      ? 'border-primary-900 bg-primary-50 text-primary-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setPerfil('escritorio')}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    perfil === 'escritorio'
                      ? 'border-primary-900 bg-primary-50 text-primary-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Escritório
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {perfil === 'cliente'
                  ? 'Clientes podem abrir e acompanhar tickets'
                  : 'Escritório gerencia todos os tickets e equipe'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-base disabled:opacity-60"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary-900 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
