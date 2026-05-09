import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  User,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const isEscritorio = user?.perfil === 'escritorio'

  async function handleSignOut() {
    await signOut()
    toast.success('Sessão encerrada')
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`

  return (
    <aside className="w-64 min-h-screen bg-primary-900 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="bg-amber-500 rounded-xl p-2">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-base leading-tight block">Suporte Fiscal</span>
          <span className="text-blue-300 text-xs">Gestão contábil</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="text-blue-400 text-xs font-medium px-3 mb-2 uppercase tracking-wider">Menu</p>

        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          <span>Painel de controle</span>
        </NavLink>

        <NavLink to="/tickets" className={linkClass}>
          <Ticket className="w-4 h-4 flex-shrink-0" />
          <span>Tickets</span>
        </NavLink>

        <NavLink to="/tickets/novo" className={linkClass}>
          <PlusCircle className="w-4 h-4 flex-shrink-0" />
          <span>Novo ticket</span>
        </NavLink>

        {isEscritorio && (
          <>
            <div className="pt-2 pb-1">
              <p className="text-blue-400 text-xs font-medium px-3 uppercase tracking-wider">Gestão</p>
            </div>
            <NavLink to="/relatorios" className={linkClass}>
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              <span>Relatórios</span>
            </NavLink>
            <NavLink to="/configuracoes" className={linkClass}>
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span>Configurações</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <NavLink to="/perfil" className={linkClass}>
          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.nome}</p>
            <p className="text-blue-300 text-xs truncate capitalize">
              {user?.perfil === 'escritorio' ? 'Escritório' : 'Cliente'}
            </p>
          </div>
        </NavLink>
        <button
          onClick={handleSignOut}
          className="sidebar-item sidebar-item-inactive w-full text-left"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
