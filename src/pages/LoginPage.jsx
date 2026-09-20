import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../services/authService.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const expired = location.state?.expired

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Credenciales inválidas o servidor no disponible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h2 className="card-title">Login</h2>
      {expired && <p className="banner warn">Tu sesión expiró. Vuelve a iniciar sesión.</p>}
      <div className="grid cols-2">
        <div>
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="assistant"
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      </div>
      {error && (
        <p className="text-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
      <p className="muted small">
        {useMock
          ? 'Modo mock: cualquier usuario entra; "student" queda con permiso solo de lectura.'
          : 'Usuarios: student / student123 (lectura) · assistant / assistant123 (lectura y escritura).'}
      </p>
    </form>
  )
}
