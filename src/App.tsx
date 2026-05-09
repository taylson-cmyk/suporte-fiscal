import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import NovoTicket from './pages/NovoTicket'
import TicketDetalhe from './pages/TicketDetalhe'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Perfil from './pages/Perfil'

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RequireEscritorio({ children }: { children: React.ReactElement }) {
  const { user } = useAuth()
  if (user?.perfil !== 'escritorio') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/cadastro" element={!session ? <Cadastro /> : <Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/tickets" element={<RequireAuth><Tickets /></RequireAuth>} />
      <Route path="/tickets/novo" element={<RequireAuth><NovoTicket /></RequireAuth>} />
      <Route path="/tickets/:id" element={<RequireAuth><TicketDetalhe /></RequireAuth>} />
      <Route path="/perfil" element={<RequireAuth><Perfil /></RequireAuth>} />

      <Route
        path="/relatorios"
        element={
          <RequireAuth>
            <RequireEscritorio>
              <Relatorios />
            </RequireEscritorio>
          </RequireAuth>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <RequireAuth>
            <RequireEscritorio>
              <Configuracoes />
            </RequireEscritorio>
          </RequireAuth>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
