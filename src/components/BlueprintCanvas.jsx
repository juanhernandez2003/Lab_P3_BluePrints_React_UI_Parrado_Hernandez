import { useEffect, useRef } from 'react'

const PADDING = 30

function fitPoints(points, width, height) {
  if (!points.length) return []
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1
  const scale = Math.min((width - PADDING * 2) / spanX, (height - PADDING * 2) / spanY)
  const offsetX = (width - spanX * scale) / 2
  const offsetY = (height - spanY * scale) / 2
  return points.map((p) => ({
    x: offsetX + (p.x - minX) * scale,
    y: offsetY + (p.y - minY) * scale,
  }))
}

export default function BlueprintCanvas({ points = [], width = 520, height = 360 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = 'rgba(148,163,184,0.15)'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    const fitted = fitPoints(points, canvas.width, canvas.height)
    if (fitted.length > 1) {
      ctx.strokeStyle = '#93c5fd'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(fitted[0].x, fitted[0].y)
      for (let i = 1; i < fitted.length; i++) {
        const p = fitted[i]
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
    }
    ctx.fillStyle = '#fbbf24'
    for (const p of fitted) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [points])

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{
        background: '#0b1220',
        border: '1px solid #334155',
        borderRadius: 12,
        width: '100%',
        maxWidth: width,
      }}
    />
  )
}
