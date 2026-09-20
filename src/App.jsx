import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import BlueprintsPage from './pages/BlueprintsPage.jsx'
import BlueprintDetailPage from './pages/BlueprintDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFound from './pages/NotFound.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import { AUTH_EXPIRED_EVENT, clearToken, getSession } from './services/auth.js'

const THEME_KEY = 'theme'

function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* sin almacenamiento */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function useTheme() {
  const [theme, setTheme] = useState(readTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* sin almacenamiento */
    }
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

function Nav() {
  const navigate = useNavigate()
  useLocation() // re-render al navegar para refrescar el estado de sesión
  const session = getSession()
  const [theme, toggleTheme] = useTheme()

  // Si el interceptor detecta un 401, vuelve al login.
  useEffect(() => {
    const onExpired = () => navigate('/login', { replace: true, state: { expired: true } })
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [navigate])

  const logout = () => {
    clearToken()
    navigate('/login')
  }

  return (
    <nav>
      <NavLink to="/" end>
        Blueprints
      </NavLink>
      <button
        className="btn ghost"
        onClick={toggleTheme}
        aria-label="Cambiar tema"
        title="Cambiar tema"
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
      {session.authenticated ? (
        <>
          {session.username && (
            <span className="user">
              {session.username}
              {!session.canWrite && <em> (solo lectura)</em>}
            </span>
          )}
          <button className="btn" onClick={logout}>
            Logout
          </button>
        </>
      ) : (
        <NavLink to="/login">Login</NavLink>
      )}
    </nav>
  )
}

export default function App() {
  return (
    <div className="container">
      <header className="app-header">
        <h1>ECI - Laboratorio de Blueprints en React</h1>
        <Nav />
      </header>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <BlueprintsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/blueprints/:author/:name"
          element={
            <PrivateRoute>
              <BlueprintDetailPage />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
