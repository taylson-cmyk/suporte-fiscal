import { type ReactNode } from 'react'
import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
}

export default function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64">
        {(title || actions) && (
          <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </header>
        )}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
