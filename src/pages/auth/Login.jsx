import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function getErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email o contraseña incorrectos.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde.'
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada.'
    default:
      return 'Error al iniciar sesión. Intenta nuevamente.'
  }
}

export default function Login() {
  const { user, role, loading, signIn, signOut } = useAuth()
  const navigate = useNavigate()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [error,      setError]      = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (role === 'client') {
        navigate('/portal', { replace: true })
      } else if (role === null) {
        Promise.resolve().then(() => setError('Tu usuario no tiene un rol asignado. Revisa la base de datos.'))
        signOut() // Cerramos sesión para que no se quede atascado
      }
    }
  }, [user, role, loading, navigate, signOut])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      // Navigation handled by the useEffect above once role loads
    } catch (err) {
      setError(getErrorMessage(err.code))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-k-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-k-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-k-orange rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <span className="text-k-text font-semibold text-2xl tracking-tight">Kontenda</span>
        </div>

        {/* Card */}
        <div
          className="bg-k-surface rounded-card-lg p-7"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <h1 className="text-k-text text-xl font-semibold mb-0.5">Iniciar sesión</h1>
          <p className="text-k-muted text-sm mb-6">Ingresa a tu cuenta para continuar</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-k-muted text-sm mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                required
                autoComplete="email"
                className="w-full bg-k-surface2 text-k-text text-sm px-3.5 py-2.5 rounded-card outline-none transition-all placeholder:text-k-muted/40 focus:ring-2 focus:ring-k-orange/30"
                style={{ border: '1px solid var(--color-border)' }}
              />
            </div>

            <div>
              <label className="block text-k-muted text-sm mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-k-surface2 text-k-text text-sm px-3.5 py-2.5 rounded-card outline-none transition-all placeholder:text-k-muted/40 focus:ring-2 focus:ring-k-orange/30"
                style={{ border: '1px solid var(--color-border)' }}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm px-3.5 py-2.5 rounded-card">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-k-orange hover:bg-k-orange/90 active:bg-k-orange/80 text-white font-medium text-sm py-2.5 rounded-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-center text-k-muted text-xs mt-5">
          Kontenda · Liu Creativo
        </p>
      </div>
    </div>
  )
}
