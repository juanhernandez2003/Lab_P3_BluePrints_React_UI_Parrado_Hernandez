import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="card">
      <p>404: Página no encontrada</p>
      <Link to="/" className="btn">
        Ir al inicio
      </Link>
    </div>
  )
}
