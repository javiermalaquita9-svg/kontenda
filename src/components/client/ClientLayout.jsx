import { NavLink, Outlet } from 'react-router-dom'
import { FiLogOut } from 'react-icons/fi'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!clientId) return
    getDoc(doc(db, 'clients', clientId)).then(snap => {
      if (snap.exists()) setClientData(snap.data())
    })
  }, [clientId])

  return (
    <div className="min-h-screen bg-k-bg">
      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-k-surface"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-k-orange rounded-md flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="text-k-text font-semibold">Kontenda</span>
          </div>

          {/* Client badge */}
          {clientData && (
            <div className="flex items-center gap-2">
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

          {/* Logout */}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-k-muted hover:text-k-text text-sm transition-colors"
          >
            <FiLogOut size={15} />
            Salir
          </button>
        </div>

        {/* Tabs */}
        <div
          className="px-6 flex"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
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
      </header>

      {/* Page content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
