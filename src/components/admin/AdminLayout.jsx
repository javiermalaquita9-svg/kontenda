import { NavLink, Outlet } from 'react-router-dom'
import {
  FiPlusCircle, FiGrid, FiCalendar, FiUsers,
  FiFileText, FiSettings, FiLogOut,
} from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/admin/crear',      icon: FiPlusCircle, label: 'Crear Pieza' },
  { to: '/admin/gestor',     icon: FiGrid,       label: 'Gestor de Contenido' },
  { to: '/admin/calendario', icon: FiCalendar,   label: 'Calendario' },
  { to: '/admin/clientes',   icon: FiUsers,      label: 'Gestión de Clientes' },
  { to: '/admin/guiones',    icon: FiFileText,   label: 'Guiones' },
  { to: '/admin/panel',      icon: FiSettings,   label: 'Panel Interno' },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-k-bg">
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen w-60 bg-k-surface flex flex-col z-30"
        style={{ borderRight: '1px solid var(--color-border)' }}
      >
        {/* Logo */}
        <div
          className="px-5 h-16 flex items-center gap-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="w-8 h-8 bg-k-orange rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-k-text font-semibold text-lg tracking-tight">Kontenda</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-card text-sm transition-colors ${
                  isActive
                    ? 'bg-k-orange/15 text-k-orange font-medium'
                    : 'text-k-muted hover:text-k-text hover:bg-k-surface2'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: email + logout */}
        <div
          className="px-3 pb-4 pt-3 flex flex-col gap-0.5 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="px-3 py-1.5 text-k-muted text-xs truncate">
            {user?.email}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-card text-sm text-k-muted hover:text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
          >
            <FiLogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
