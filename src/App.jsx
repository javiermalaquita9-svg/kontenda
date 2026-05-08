import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { useAuth } from './hooks/useAuth' // Import useAuth from its new location
import AdminRoutes from './router/AdminRoutes'
import ClientRoutes from './router/ClientRoutes'
import AdminLayout from './components/admin/AdminLayout'
import ClientLayout from './components/client/ClientLayout'
import LoadingScreen from './components/shared/LoadingScreen'
import Login from './pages/auth/Login'
import CreatePiece    from './pages/admin/CreatePiece'
import ContentManager from './pages/admin/ContentManager'
import Calendar       from './pages/admin/Calendar'
import ClientManager  from './pages/admin/ClientManager'
import Scripts        from './pages/admin/Scripts'
import AdminPanel     from './pages/admin/AdminPanel'
import Dashboard    from './pages/client/Dashboard'
import MyContent    from './pages/client/MyContent'
import MyGestor     from './pages/client/MyGestor'
import MyPlan       from './pages/client/MyPlan'
import MyBrand      from './pages/client/MyBrand'
import Subscription from './pages/client/Subscription'
import ClientBrandView from './pages/admin/ClientBrandView' // NEW: Import the new admin component
import BrandForm    from './pages/client/BrandForm'

function RootRedirect() {
  const { user, role, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  if (role === 'client') return <Navigate to="/portal" replace />
  return <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"      element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      {/* Admin */}
      <Route element={<AdminRoutes />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/gestor" replace />} />
          <Route path="crear"      element={<CreatePiece />} />
          <Route path="gestor"     element={<ContentManager />} />
          <Route path="calendario" element={<Calendar />} />
          <Route path="clientes"   element={<ClientManager />} />
          <Route path="guiones"    element={<Scripts />} />
          <Route path="panel"      element={<AdminPanel />} />
          <Route path="clientes/:clientId/marca" element={<ClientBrandView />} /> {/* NEW: Route for admin to view client brand form */}
        </Route>
      </Route>

      {/* Cliente */}
      <Route element={<ClientRoutes />}>
        <Route path="/portal" element={<ClientLayout />}>
          <Route index element={<Navigate to="/portal/escritorio" replace />} />
          <Route path="escritorio" element={<Dashboard />} />
          <Route path="contenido"  element={<MyContent />} />
          <Route path="gestor"     element={<MyGestor />} />
          <Route path="plan"       element={<MyPlan />} />
          <Route path="marca"      element={<MyBrand />} />
          <Route path="suscripcion" element={<Subscription />} />
          <Route path="formulario-marca" element={<BrandForm />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/kontenda/">
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
