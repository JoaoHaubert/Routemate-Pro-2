import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth({ role, children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  const loginPath = role === 'driver' ? '/drive/login' : '/login'

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-ink/50">Loading…</div>
  }

  if (!session) {
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />
  }

  if (role && profile && profile.role !== role) {
    return <Navigate to={loginPath} replace />
  }

  return children
}
