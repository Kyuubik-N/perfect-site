import { useAuth } from '../context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

export default function Protected({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="container-wide pt-32 text-white/70">Загрузка…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
