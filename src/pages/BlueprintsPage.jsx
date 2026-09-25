import { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  fetchByAuthor,
  fetchBlueprint,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
  clearMutationErrors,
  selectTopBlueprints,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintEditor from '../components/BlueprintEditor.jsx'
import BlueprintForm from '../components/BlueprintForm.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { getSession } from '../services/auth.js'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const {
    byAuthor,
    current,
    status,
    error,
    lastAuthorQuery,
    blueprintStatus,
    blueprintError,
    createStatus,
    createError,
    updateStatus,
    updateError,
    deleteStatus,
    deleteError,
  } = useSelector((s) => s.blueprints)
  const topBlueprints = useSelector(selectTopBlueprints)
  const { canWrite } = getSession()
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [lastOpened, setLastOpened] = useState(null)
  const items = useMemo(() => byAuthor[selectedAuthor] || [], [byAuthor, selectedAuthor])

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  const getBlueprints = useCallback((author = authorInput) => {
    const value = (author || '').trim()
    if (!value) return
    setSelectedAuthor(value)
    dispatch(fetchByAuthor(value))
  }, [authorInput, dispatch])

  const openBlueprint = useCallback((bp) => {
    setLastOpened({ author: bp.author, name: bp.name })
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  }, [dispatch])

  const handleCreate = useCallback(async (blueprint) => {
    const result = await dispatch(createBlueprint(blueprint))
    if (createBlueprint.fulfilled.match(result)) setShowForm(false)
  }, [dispatch])

  const handleSave = useCallback((points) => {
    if (!current) return
    dispatch(updateBlueprint({ author: current.author, name: current.name, points }))
  }, [current, dispatch])

  const handleDelete = useCallback(() => {
    if (!current) return
    dispatch(deleteBlueprint({ author: current.author, name: current.name }))
  }, [current, dispatch])

  const mutationError =
    (updateError && `No se pudo guardar: ${updateError}. Se revirtió el cambio.`) ||
    (deleteError && `No se pudo eliminar: ${deleteError}. Se restauró el plano.`)

  return (
    <div className="layout">
      <section className="stack">
        <div className="card">
          <h2 className="card-title">Blueprints</h2>
          <div className="row">
            <input
              className="input"
              placeholder="Author"
              aria-label="Autor a consultar"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && getBlueprints()}
            />
            <button className="btn primary" onClick={() => getBlueprints()}>
              Get blueprints
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">
            {selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Results'}
          </h3>
          {status === 'loading' && <p className="muted">Cargando...</p>}
          {status === 'failed' && (
            <ErrorBanner
              message={error}
              onRetry={() => getBlueprints(lastAuthorQuery || authorInput)}
            />
          )}
          {!items.length && status !== 'loading' && status !== 'failed' && (
            <p className="muted">Sin resultados.</p>
          )}
          {!!items.length && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Blueprint name</th>
                    <th className="num">Number of points</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((bp) => {
                    const active = current?.author === bp.author && current?.name === bp.name
                    return (
                      <tr key={bp.name} className={active ? 'active' : undefined}>
                        <td>{bp.name}</td>
                        <td className="num">{bp.points?.length || 0}</td>
                        <td className="actions">
                          <button className="btn" onClick={() => openBlueprint(bp)}>
                            Open
                          </button>
                          <Link
                            className="btn ghost"
                            to={`/blueprints/${encodeURIComponent(bp.author)}/${encodeURIComponent(bp.name)}`}
                          >
                            Detalle
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="total">Total user points: {totalPoints}</p>
        </div>

        <div className="card">
          <h3 className="card-title">Top 5 blueprints (por puntos)</h3>
          {!topBlueprints.length && (
            <p className="muted">Sin datos todavía. Busca un autor primero.</p>
          )}
          {!!topBlueprints.length && (
            <ol className="top-list">
              {topBlueprints.map((bp) => (
                <li key={`${bp.author}-${bp.name}`}>
                  {bp.name} ({bp.author}) — {bp.points?.length || 0} puntos
                </li>
              ))}
            </ol>
          )}
        </div>

        <button
          className="btn primary"
          onClick={() => setShowForm((v) => !v)}
          disabled={!canWrite}
          title={canWrite ? undefined : 'Requiere el scope blueprints.write'}
        >
          {showForm ? 'Cancelar' : 'Nuevo Blueprint'}
        </button>
        {showForm && (
          <BlueprintForm
            onSubmit={handleCreate}
            defaultAuthor={selectedAuthor}
            disabled={createStatus === 'loading'}
          />
        )}
        {createStatus === 'loading' && <p className="muted">Creando blueprint...</p>}
        {createStatus === 'failed' && (
          <ErrorBanner
            message={`Error al crear: ${createError}`}
            onClose={() => dispatch(clearMutationErrors())}
          />
        )}
      </section>

      <section className="card">
        <h3 className="card-title">Current blueprint: {current?.name || '—'}</h3>
        <div className="field">
          <label htmlFor="current-blueprint">Plano actual</label>
          <input
            id="current-blueprint"
            className="input"
            readOnly
            value={current ? `${current.author} / ${current.name}` : ''}
            placeholder="Ninguno — pulsa Open en la tabla"
          />
        </div>
        {blueprintStatus === 'loading' && <p className="muted">Cargando plano...</p>}
        {blueprintStatus === 'failed' && (
          <ErrorBanner
            message={blueprintError}
            onRetry={() => lastOpened && dispatch(fetchBlueprint(lastOpened))}
          />
        )}
        {mutationError && (
          <ErrorBanner message={mutationError} onClose={() => dispatch(clearMutationErrors())} />
        )}
        {(updateStatus === 'loading' || deleteStatus === 'loading') && (
          <p className="muted small">Sincronizando con el servidor...</p>
        )}
        <BlueprintEditor
          blueprint={current}
          canWrite={canWrite}
          onSave={handleSave}
          onDelete={handleDelete}
        />
        {current && <p className="muted small">Puntos: {current.points?.length || 0}</p>}
      </section>
    </div>
  )
}
