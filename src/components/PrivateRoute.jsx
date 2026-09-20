import { Navigate, useLocation } from 'react-router-dom'
import { clearToken, getToken, isTokenValid } from '../services/auth.js'

/** Deja pasar solo con un token presente y no expirado; si no, redirige al login. */
export default function PrivateRoute({ children }) {
  const location = useLocation()
  const token = getToken()
  if (!isTokenValid(token)) {
    if (token) clearToken()
    return <Navigate to="/login" replace state={{ from: location, expired: !!token }} />
  }
  return children
}
