import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchByAuthor,
  fetchBlueprint,
  createBlueprint,
  selectTopBlueprints,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import BlueprintForm from '../components/BlueprintForm.jsx'

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
  } = useSelector((s) => s.blueprints)
  const topBlueprints = useSelector(selectTopBlueprints)
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [lastOpened, setLastOpened] = useState(null)
  const items = byAuthor[selectedAuthor] || []

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  const getBlueprints = (author = authorInput) => {
    if (!author.trim()) return
    setSelectedAuthor(author.trim())
    dispatch(fetchByAuthor(author.trim()))
  }

  const openBlueprint = (bp) => {
    setLastOpened({ author: bp.author, name: bp.name })
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  }

  const handleCreate = (blueprint) => {
    dispatch(createBlueprint(blueprint))
    setShowForm(false)
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.1fr 1.4fr', gap: 24 }}>
      <section className="grid" style={{ gap: 16 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Blueprints</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="input"
              placeholder="Author"
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
          <h3 style={{ marginTop: 0 }}>
            {selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Results'}
          </h3>
          {status === 'loading' && <p>Cargando...</p>}
          {status === 'failed' && (
            <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>{error}</span>
              <button className="btn" onClick={() => getBlueprints(lastAuthorQuery || authorInput)}>
                Reintentar
              </button>
            </div>
          )}
          {!items.length && status !== 'loading' && status !== 'failed' && <p>Sin resultados.</p>}
          {!!items.length && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #334155' }}>
                      Blueprint name
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #334155' }}>
                      Number of points
                    </th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #334155' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((bp) => (
                    <tr key={bp.name}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>{bp.name}</td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #1f2937' }}>
                        {bp.points?.length || 0}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                        <button className="btn" onClick={() => openBlueprint(bp)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ marginTop: 12, fontWeight: 700 }}>Total user points: {totalPoints}</p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Top 5 blueprints (por puntos)</h3>
          {!topBlueprints.length && <p>Sin datos todavía. Busca un autor primero.</p>}
          {!!topBlueprints.length && (
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {topBlueprints.map((bp) => (
                <li key={`${bp.author}-${bp.name}`}>
                  {bp.name} ({bp.author}) — {bp.points?.length || 0} puntos
                </li>
              ))}
            </ol>
          )}
        </div>

        <button className="btn primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : 'Nuevo Blueprint'}
        </button>
        {showForm && <BlueprintForm onSubmit={handleCreate} />}
        {createStatus === 'loading' && <p>Creando blueprint...</p>}
        {createStatus === 'failed' && (
          <p style={{ color: '#f87171' }}>Error al crear: {createError}</p>
        )}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Current blueprint: {current?.name || '—'}</h3>
        {blueprintStatus === 'loading' && <p>Cargando plano...</p>}
        {blueprintStatus === 'failed' && (
          <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{blueprintError}</span>
            <button className="btn" onClick={() => lastOpened && dispatch(fetchBlueprint(lastOpened))}>
              Reintentar
            </button>
          </div>
        )}
        <BlueprintCanvas points={current?.points || []} />
      </section>
    </div>
  )
}
