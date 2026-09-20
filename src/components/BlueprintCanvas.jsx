import { useEffect, useRef } from 'react'

const PADDING = 30
const MAX_SCALE = 20
const GRID = 40

/**
 * Transformación mundo -> lienzo que encuadra todos los puntos con un margen.
 * Sin puntos se usa la identidad (1 unidad = 1 px).
 */
export function computeView(points, width, height) {
  if (!points.length) return { scale: 1, offsetX: 0, offsetY: 0, minX: 0, minY: 0 }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1
  const scale = Math.min((width - PADDING * 2) / spanX, (height - PADDING * 2) / spanY, MAX_SCALE)
  return {
    scale,
    minX,
    minY,
    offsetX: (width - (maxX - minX) * scale) / 2,
    offsetY: (height - (maxY - minY) * scale) / 2,
  }
}

export const toCanvas = (p, v) => ({
  x: v.offsetX + (p.x - v.minX) * v.scale,
  y: v.offsetY + (p.y - v.minY) * v.scale,
})

/** Inversa de toCanvas; redondea porque el backend guarda coordenadas enteras. */
export const toWorld = (cx, cy, v) => ({
  x: Math.round((cx - v.offsetX) / v.scale + v.minX),
  y: Math.round((cy - v.offsetY) / v.scale + v.minY),
})

/**
 * Lienzo del blueprint. Dibuja los segmentos consecutivos y marca cada punto.
 * Si recibe `onAddPoint` se vuelve interactivo: cada click agrega un punto.
 * En modo interactivo la escala se congela (por `viewKey`) para que el dibujo no "salte".
 */
export default function BlueprintCanvas({
  points = [],
  width = 520,
  height = 360,
  id = 'blueprint-canvas',
  onAddPoint,
  viewKey = 'default',
}) {
  const ref = useRef(null)
  const frozen = useRef({ key: null, view: null })
  const interactive = typeof onAddPoint === 'function'

  let view
  if (interactive) {
    if (frozen.current.key !== viewKey || !frozen.current.view) {
      frozen.current = { key: viewKey, view: computeView(points, width, height) }
    }
    view = frozen.current.view
  } else {
    frozen.current = { key: null, view: null }
    view = computeView(points, width, height)
  }

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(148,163,184,0.15)'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += GRID) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += GRID) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    const fitted = points.map((p) => toCanvas(p, view))
    if (fitted.length > 1) {
      ctx.strokeStyle = '#93c5fd'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(fitted[0].x, fitted[0].y)
      for (let i = 1; i < fitted.length; i++) ctx.lineTo(fitted[i].x, fitted[i].y)
      ctx.stroke()
    }
    fitted.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#34d399' : '#fbbf24'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [points, view])

  const handleClick = (e) => {
    if (!interactive) return
    const canvas = ref.current
    const rect = canvas.getBoundingClientRect()
    // El canvas puede estar escalado por CSS (width: 100%): convertir a píxeles internos.
    const sx = rect.width ? canvas.width / rect.width : 1
    const sy = rect.height ? canvas.height / rect.height : 1
    const cx = (e.clientX - rect.left) * sx
    const cy = (e.clientY - rect.top) * sy
    onAddPoint(toWorld(cx, cy, view))
  }

  return (
    <canvas
      ref={ref}
      id={id}
      data-testid={id}
      width={width}
      height={height}
      className={`bp-canvas${interactive ? ' interactive' : ''}`}
      style={{ maxWidth: width }}
      onClick={handleClick}
      aria-label={interactive ? 'Lienzo interactivo del blueprint' : 'Lienzo del blueprint'}
    />
  )
}
