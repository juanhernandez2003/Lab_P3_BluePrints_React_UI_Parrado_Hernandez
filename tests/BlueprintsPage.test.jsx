import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, createSlice } from '@reduxjs/toolkit'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'

vi.mock('../src/features/blueprints/blueprintsSlice.js', () => ({
  fetchByAuthor: (author) => ({ type: 'blueprints/fetchByAuthor', payload: author }),
  fetchBlueprint: (payload) => ({ type: 'blueprints/fetchBlueprint', payload }),
  createBlueprint: (payload) => ({ type: 'blueprints/createBlueprint', payload }),
  selectTopBlueprints: (() => {
    let lastByAuthor
    let lastResult = []
    return (state) => {
      if (state.blueprints.byAuthor !== lastByAuthor) {
        lastByAuthor = state.blueprints.byAuthor
        lastResult = Object.values(lastByAuthor)
          .flat()
          .sort((a, b) => (b.points?.length || 0) - (a.points?.length || 0))
          .slice(0, 5)
      }
      return lastResult
    }
  })(),
}))

function makeStore(preloaded = {}) {
  const slice = createSlice({
    name: 'blueprints',
    initialState: {
      byAuthor: {},
      current: null,
      status: 'idle',
      error: null,
      lastAuthorQuery: null,
      blueprintStatus: 'idle',
      blueprintError: null,
      createStatus: 'idle',
      createError: null,
      ...preloaded,
    },
    reducers: {},
  })
  return configureStore({ reducer: { blueprints: slice.reducer } })
}

describe('BlueprintsPage', () => {
  it('despacha fetchByAuthor al hacer click en Get blueprints', () => {
    const store = makeStore()
    const spy = vi.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'john' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))

    expect(spy).toHaveBeenCalledWith({ type: 'blueprints/fetchByAuthor', payload: 'john' })
  })
})
