import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('../src/services/blueprintsService.js', () => ({
  default: {
    getAll: vi.fn(),
    getByAuthor: vi.fn(),
    getByAuthorAndName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

import service from '../src/services/blueprintsService.js'
import reducer, { fetchByAuthor } from '../src/features/blueprints/blueprintsSlice.js'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'
import { createMockToken, setToken } from '../src/services/auth.js'

const HOUSE = {
  author: 'john',
  name: 'house',
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ],
}
const GARAGE = { author: 'john', name: 'garage', points: [{ x: 5, y: 5 }] }

function renderPage() {
  const actions = []
  const recorder = () => (next) => (action) => {
    actions.push(action)
    return next(action)
  }
  const store = configureStore({
    reducer: { blueprints: reducer },
    middleware: (getDefault) => getDefault().concat(recorder),
  })
  render(
    <Provider store={store}>
      <MemoryRouter>
        <BlueprintsPage />
      </MemoryRouter>
    </Provider>,
  )
  return { store, actions }
}

describe('BlueprintsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setToken(createMockToken('assistant'))
  })

  it('despacha fetchByAuthor al hacer click en Get blueprints y pinta la tabla', async () => {
    service.getByAuthor.mockResolvedValue([HOUSE, GARAGE])
    const { actions } = renderPage()

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'john' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))

    expect(service.getByAuthor).toHaveBeenCalledWith('john')
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: fetchByAuthor.pending.type,
        meta: expect.objectContaining({ arg: 'john' }),
      }),
    )

    expect(await screen.findByText('house')).toBeInTheDocument()
    expect(screen.getByText('garage')).toBeInTheDocument()
    expect(screen.getByText('Total user points: 4')).toBeInTheDocument()
  })

  it('Open actualiza el nombre del plano actual (estado global)', async () => {
    service.getByAuthor.mockResolvedValue([HOUSE])
    service.getByAuthorAndName.mockResolvedValue(HOUSE)
    const { store } = renderPage()

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'john' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))
    fireEvent.click(await screen.findByText('Open'))

    await waitFor(() => expect(store.getState().blueprints.current?.name).toBe('house'))
    expect(screen.getByText('Current blueprint: house')).toBeInTheDocument()
    expect(screen.getByLabelText('Plano actual')).toHaveValue('john / house')
  })

  it('si el GET falla muestra banner y Reintentar vuelve a despachar el thunk', async () => {
    service.getByAuthor.mockRejectedValueOnce(new Error('Network down'))
    service.getByAuthor.mockResolvedValueOnce([HOUSE])
    renderPage()

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'john' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))

    expect(await screen.findByRole('alert')).toHaveTextContent('Network down')
    fireEvent.click(screen.getByText('Reintentar'))
    expect(await screen.findByText('house')).toBeInTheDocument()
    expect(service.getByAuthor).toHaveBeenCalledTimes(2)
  })

  it('un usuario de solo lectura no puede crear', () => {
    setToken(createMockToken('student'))
    renderPage()
    expect(screen.getByText('Nuevo Blueprint')).toBeDisabled()
  })
})
