import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  clearMutationErrors,
  deleteBlueprint,
  fetchBlueprint,
  updateBlueprint,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintEditor from '../components/BlueprintEditor.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { getSession } from '../services/auth.js'

export default function BlueprintDetailPage() {
  const { author, name } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { current, blueprintStatus, blueprintError, updateError, deleteError } = useSelector(
    (s) => s.blueprints,
  )
  const { canWrite } = getSession()

  useEffect(() => {
    dispatch(fetchBlueprint({ author, name }))
  }, [author, name, dispatch])

  // Evita mostrar un plano anterior mientras llega el de la URL.
  const bp = current && current.author === author && current.name === name ? current : null

  const handleDelete = async () => {
    const result = await dispatch(deleteBlueprint({ author, name }))
    if (deleteBlueprint.fulfilled.match(result)) navigate('/')
  }

  return (
    <div className="card detail">
      <p>
        <Link to="/" className="muted">
          ← Volver
        </Link>
      </p>
      {blueprintStatus === 'failed' && !bp && (
        <ErrorBanner
          message={blueprintError}
          onRetry={() => dispatch(fetchBlueprint({ author, name }))}
        />
      )}
      {!bp && blueprintStatus !== 'failed' && <p className="muted">Cargando...</p>}
      {bp && (
        <>
          <h2 className="card-title">{bp.name}</h2>
          <p>
            <strong>Autor:</strong> {bp.author} · <strong>Puntos:</strong> {bp.points?.length || 0}
          </p>
          {(updateError || deleteError) && (
            <ErrorBanner
              message={`${updateError || deleteError}. Se revirtió el cambio.`}
              onClose={() => dispatch(clearMutationErrors())}
            />
          )}
          <BlueprintEditor
            blueprint={bp}
            canWrite={canWrite}
            onSave={(points) => dispatch(updateBlueprint({ author, name, points }))}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  )
}
