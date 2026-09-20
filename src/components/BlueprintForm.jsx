import { useMemo, useState } from 'react'
import BlueprintCanvas from './BlueprintCanvas.jsx'

function parsePoints(text) {
  let value
  try {
    value = JSON.parse(text)
  } catch {
    return { error: 'JSON de puntos inválido' }
  }
  if (!Array.isArray(value)) return { error: 'Los puntos deben ser un arreglo' }
  const ok = value.every((p) => p && Number.isInteger(p.x) && Number.isInteger(p.y))
  if (!ok) return { error: 'Cada punto debe tener "x" y "y" enteros' }
  return { points: value.map((p) => ({ x: p.x, y: p.y })) }
}

/**
 * Formulario de creación. Los puntos se pueden dibujar con clicks en el lienzo
 * o escribir como JSON; ambos se mantienen sincronizados.
 */
export default function BlueprintForm({ onSubmit, defaultAuthor = '', disabled = false }) {
  const [author, setAuthor] = useState(defaultAuthor)
  const [name, setName] = useState('')
  const [pointsJSON, setPointsJSON] = useState('[]')
  const [error, setError] = useState(null)

  const parsed = useMemo(() => parsePoints(pointsJSON), [pointsJSON])
  const previewPoints = parsed.points ?? []

  const addPoint = (p) => {
    setPointsJSON(JSON.stringify([...previewPoints, p]))
  }

  const handle = (e) => {
    e.preventDefault()
    if (!author.trim() || !name.trim()) {
      setError('Autor y nombre son obligatorios')
      return
    }
    if (parsed.error) {
      setError(parsed.error)
      return
    }
    setError(null)
    onSubmit({ author: author.trim(), name: name.trim(), points: parsed.points })
  }

  return (
    <form onSubmit={handle} className="card">
      <h3 className="card-title">Crear Blueprint</h3>
      <div className="grid cols-2">
        <div>
          <label htmlFor="bp-author">Autor</label>
          <input
            id="bp-author"
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="juan.perez"
          />
        </div>
        <div>
          <label htmlFor="bp-name">Nombre</label>
          <input
            id="bp-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mi-dibujo"
          />
        </div>
      </div>

      <div className="field">
        <span className="label">Dibujo (click para agregar puntos)</span>
        <BlueprintCanvas
          id="blueprint-form-canvas"
          width={480}
          height={260}
          points={previewPoints}
          viewKey="new-blueprint"
          onAddPoint={addPoint}
        />
      </div>

      <div className="field">
        <label htmlFor="bp-points">Puntos (JSON)</label>
        <textarea
          id="bp-points"
          className="input mono"
          rows="4"
          value={pointsJSON}
          onChange={(e) => setPointsJSON(e.target.value)}
        />
        {parsed.error && <p className="muted small">{parsed.error}</p>}
      </div>

      {error && (
        <p className="text-error" role="alert">
          {error}
        </p>
      )}
      <div className="toolbar">
        <button className="btn primary" disabled={disabled}>
          Guardar
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setPointsJSON(JSON.stringify(previewPoints.slice(0, -1)))}
          disabled={!previewPoints.length}
        >
          Deshacer punto
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setPointsJSON('[]')}
          disabled={!previewPoints.length}
        >
          Limpiar
        </button>
      </div>
    </form>
  )
}
