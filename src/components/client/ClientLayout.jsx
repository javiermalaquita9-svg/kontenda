import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'

const TABS = [
  { to: '/portal/escritorio', label: 'Escritorio' },
  { to: '/portal/contenido',  label: 'Calendario' },
  { to: '/portal/gestor',     label: 'Gestor' },
  { to: '/portal/plan',       label: 'Mi Plan' },
  { to: '/portal/marca',      label: 'Mi Marca' },
  { to: '/portal/suscripcion',label: 'Suscripción' },
]

export default function ClientLayout() {
  const { clientId, signOut } = useAuth()
  const [clientData, setClientData] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!clientId) return
    getDoc(doc(db, 'clients', clientId)).then(snap => {
      if (snap.exists()) setClientData(snap.data())
    })
  }, [clientId])

  return (
    <div className="min-h-screen bg-k-bg">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 h-screen w-60 bg-k-surface flex flex-col z-30 md:hidden transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderRight: '1px solid var(--color-border)' }}
      >
        {/* Drawer header */}
        <div
          className="px-5 h-14 flex items-center gap-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="w-7 h-7 bg-k-orange rounded-md flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">K</span>
          </div>
          <span className="text-k-text font-semibold flex-1">Kontenda</span>
          <button onClick={() => setOpen(false)} className="text-k-muted hover:text-k-text p-1">
            <FiX size={18} />
          </button>
        </div>

        {/* Client info */}
        {clientData && (
          <div
            className="px-5 py-3 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              {clientData.logoUrl ? (
                <img
                  src={clientData.logoUrl}
                  alt={clientData.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-k-surface2 flex items-center justify-center text-k-orange text-sm font-bold">
                  {clientData.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-k-text text-sm font-medium">{clientData.name}</span>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {TABS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-card text-sm transition-colors ${
                  isActive
                    ? 'bg-k-orange/15 text-k-orange font-medium'
                    : 'text-k-muted hover:text-k-text hover:bg-k-surface2'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer logout */}
        <div
          className="px-3 pb-4 pt-3 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-card text-sm text-k-muted hover:text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
          >
            <FiLogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Header */}
      <header
        className="sticky top-0 z-10 bg-k-surface"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setOpen(true)}
              className="md:hidden text-k-muted hover:text-k-text mr-0.5"
            >
              <FiMenu size={20} />
            </button>
            <div className="w-7 h-7 bg-k-orange rounded-md flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="text-k-text font-semibold">Kontenda</span>
          </div>

          {/* Client badge — hidden on mobile (shown in drawer) */}
          {clientData && (
            <div className="hidden sm:flex items-center gap-2">
              {clientData.logoUrl ? (
                <img
                  src={clientData.logoUrl}
                  alt={clientData.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-k-surface2 flex items-center justify-center text-k-muted text-xs font-bold">
                  {clientData.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-k-text text-sm font-medium">{clientData.name}</span>
            </div>
          )}

          {/* Logout — hidden on mobile (available in drawer) */}
          <button
            onClick={signOut}
            className="hidden md:flex items-center gap-1.5 text-k-muted hover:text-k-text text-sm transition-colors"
          >
            <FiLogOut size={15} />
            Salir
          </button>
        </div>

        {/* Tabs — desktop only */}
        <div
          className="hidden md:block overflow-x-auto"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="flex px-6 min-w-max">
            {TABS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-k-orange text-k-orange'
                      : 'border-transparent text-k-muted hover:text-k-text'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
