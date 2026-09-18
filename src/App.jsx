import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import BlueprintsPage from './pages/BlueprintsPage.jsx'
import BlueprintDetailPage from './pages/BlueprintDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFound from './pages/NotFound.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'

function Nav() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav>
      <NavLink to="/" end>Blueprints</NavLink>
      {token ? (
        <button className="btn" onClick={logout} style={{ marginLeft: 8 }}>Logout</button>
      ) : (
        <NavLink to="/login">Login</NavLink>
      )}
    </nav>
  )
}

export default function App() {
  return (
    <div className="container">
      <header>
        <h1>ECI - Laboratorio de Blueprints en React</h1>
        <Nav />
      </header>
      <Routes>
        <Route path="/" element={<PrivateRoute><BlueprintsPage /></PrivateRoute>} />
        <Route path="/blueprints/:author/:name" element={<PrivateRoute><BlueprintDetailPage /></PrivateRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
