import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlueprintForm from '../src/components/BlueprintForm.jsx'

describe('BlueprintForm', () => {
  it('envía el formulario con puntos parseados', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), {
      target: { value: '[{"x":1,"y":2}]' },
    })
    fireEvent.click(screen.getByText(/Guardar/i))

    expect(onSubmit).toHaveBeenCalledWith({
      author: 'john',
      name: 'house',
      points: [{ x: 1, y: 2 }],
    })
  })

  it('los clicks en el lienzo agregan puntos al JSON', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} defaultAuthor="jane" />)
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'sketch' } })

    const canvas = screen.getByTestId('blueprint-form-canvas')
    fireEvent.click(canvas, { clientX: 10, clientY: 20 })
    fireEvent.click(canvas, { clientX: 30, clientY: 40 })

    expect(screen.getByLabelText(/Puntos/i)).toHaveValue(
      JSON.stringify([
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ]),
    )
    fireEvent.click(screen.getByText('Guardar'))
    expect(onSubmit).toHaveBeenCalledWith({
      author: 'jane',
      name: 'sketch',
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
    })
  })

  it('no envía si falta el nombre o el JSON es inválido', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('Guardar'))
    expect(screen.getByRole('alert')).toHaveTextContent(/obligatorios/i)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'x' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), { target: { value: '{no json' } })
    fireEvent.click(screen.getByText('Guardar'))
    expect(screen.getByRole('alert')).toHaveTextContent(/JSON de puntos inválido/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
