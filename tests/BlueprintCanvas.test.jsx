import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlueprintCanvas, {
  computeView,
  toCanvas,
  toWorld,
} from '../src/components/BlueprintCanvas.jsx'

describe('BlueprintCanvas', () => {
  it('renderiza un canvas con id propio, 520x360, y llama getContext', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    const { container } = render(
      <BlueprintCanvas
        points={[
          { x: 10, y: 10 },
          { x: 50, y: 60 },
        ]}
      />,
    )
    const canvas = container.querySelector('canvas#blueprint-canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('width', '520')
    expect(canvas).toHaveAttribute('height', '360')
    expect(spy).toHaveBeenCalledWith('2d')
    spy.mockRestore()
  })

  it('dibuja segmentos consecutivos y marca cada punto', () => {
    const ctx = HTMLCanvasElement.prototype.getContext()
    const lineTo = vi.spyOn(ctx, 'lineTo')
    const arc = vi.spyOn(ctx, 'arc')
    render(
      <BlueprintCanvas
        points={[
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ]}
      />,
    )
    // 3 puntos => 3 círculos; al menos 2 lineTo del trazo (más los de la grilla)
    expect(arc).toHaveBeenCalledTimes(3)
    expect(lineTo.mock.calls.length).toBeGreaterThanOrEqual(2)
    lineTo.mockRestore()
    arc.mockRestore()
  })

  it('en modo interactivo un click agrega un punto', () => {
    const onAddPoint = vi.fn()
    render(<BlueprintCanvas points={[]} onAddPoint={onAddPoint} />)
    fireEvent.click(screen.getByTestId('blueprint-canvas'), { clientX: 30, clientY: 40 })
    expect(onAddPoint).toHaveBeenCalledWith({ x: 30, y: 40 })
  })

  it('sin onAddPoint el click no hace nada', () => {
    const { container } = render(<BlueprintCanvas points={[]} />)
    expect(() => fireEvent.click(container.querySelector('canvas'))).not.toThrow()
  })
})

describe('transformaciones del lienzo', () => {
  it('toWorld es la inversa de toCanvas', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
    ]
    const view = computeView(pts, 520, 360)
    for (const p of pts) {
      const c = toCanvas(p, view)
      expect(toWorld(c.x, c.y, view)).toEqual(p)
    }
  })

  it('los puntos encuadrados quedan dentro del lienzo', () => {
    const view = computeView(
      [
        { x: -500, y: 20 },
        { x: 900, y: 7000 },
      ],
      520,
      360,
    )
    const a = toCanvas({ x: -500, y: 20 }, view)
    const b = toCanvas({ x: 900, y: 7000 }, view)
    for (const p of [a, b]) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(520)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(360)
    }
  })
})
