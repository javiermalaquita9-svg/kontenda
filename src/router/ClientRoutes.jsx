import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth' // Import useAuth from its new location
import LoadingScreen from '../components/shared/LoadingScreen'

export default function ClientRoutes() {
  const { user, role, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user)           return <Navigate to="/login" replace />
  if (role === 'admin')  return <Navigate to="/admin" replace />
  if (role !== 'client') return <Navigate to="/login" replace />

  return <Outlet />
}
