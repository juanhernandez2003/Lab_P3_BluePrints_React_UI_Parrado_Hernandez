import { describe, it, expect } from 'vitest'
import reducer, {
  fetchByAuthor,
  fetchBlueprint,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
  clearMutationErrors,
  selectTopBlueprints,
} from '../src/features/blueprints/blueprintsSlice.js'

const HOUSE = {
  author: 'john',
  name: 'house',
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ],
}
const GARAGE = { author: 'john', name: 'garage', points: [{ x: 5, y: 5 }] }

const loaded = () => {
  let s = reducer(undefined, { type: '@@INIT' })
  s = reducer(s, fetchByAuthor.fulfilled({ author: 'john', items: [HOUSE, GARAGE] }, 'r1', 'john'))
  s = reducer(s, fetchBlueprint.fulfilled(HOUSE, 'r2', { author: 'john', name: 'house' }))
  return s
}

describe('blueprints slice', () => {
  it('should initialize correctly', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.byAuthor).toEqual({})
    expect(state.current).toBeNull()
    expect(state.status).toBe('idle')
    expect(state.updateStatus).toBe('idle')
    expect(state.deleteStatus).toBe('idle')
  })

  it('fetchByAuthor: loading -> succeeded / failed', () => {
    let s = reducer(undefined, fetchByAuthor.pending('r', 'john'))
    expect(s.status).toBe('loading')
    expect(s.lastAuthorQuery).toBe('john')
    s = reducer(s, fetchByAuthor.fulfilled({ author: 'john', items: [HOUSE] }, 'r', 'john'))
    expect(s.status).toBe('succeeded')
    expect(s.byAuthor.john).toHaveLength(1)
    s = reducer(s, fetchByAuthor.rejected(new Error('boom'), 'r2', 'jane'))
    expect(s.status).toBe('failed')
    expect(s.error).toBe('boom')
  })

  it('createBlueprint agrega el plano a la lista del autor y lo deja como actual', () => {
    const bp = { author: 'john', name: 'shed', points: [] }
    const s = reducer(loaded(), createBlueprint.fulfilled(bp, 'r', bp))
    expect(s.byAuthor.john.map((b) => b.name)).toContain('shed')
    expect(s.current.name).toBe('shed')
  })

  describe('updateBlueprint (optimista)', () => {
    const arg = { author: 'john', name: 'house', points: [{ x: 1, y: 1 }] }

    it('aplica el cambio de inmediato en pending', () => {
      const s = reducer(loaded(), updateBlueprint.pending('u1', arg))
      expect(s.byAuthor.john[0].points).toEqual([{ x: 1, y: 1 }])
      expect(s.current.points).toEqual([{ x: 1, y: 1 }])
      expect(s.updateStatus).toBe('loading')
    })

    it('confirma y limpia el rollback en fulfilled', () => {
      let s = reducer(loaded(), updateBlueprint.pending('u1', arg))
      s = reducer(s, updateBlueprint.fulfilled(arg, 'u1', arg))
      expect(s.updateStatus).toBe('succeeded')
      expect(s.rollback).toEqual({})
      expect(s.current.points).toEqual([{ x: 1, y: 1 }])
    })

    it('revierte al estado anterior si el servidor falla', () => {
      let s = reducer(loaded(), updateBlueprint.pending('u1', arg))
      s = reducer(s, updateBlueprint.rejected(new Error('403'), 'u1', arg))
      expect(s.byAuthor.john[0].points).toEqual(HOUSE.points)
      expect(s.current.points).toEqual(HOUSE.points)
      expect(s.updateStatus).toBe('failed')
      expect(s.updateError).toBe('403')
      expect(s.rollback).toEqual({})
    })
  })

  describe('deleteBlueprint (optimista)', () => {
    const arg = { author: 'john', name: 'house' }

    it('quita el plano de inmediato y lo restaura en su posición si falla', () => {
      let s = reducer(loaded(), deleteBlueprint.pending('d1', arg))
      expect(s.byAuthor.john.map((b) => b.name)).toEqual(['garage'])
      expect(s.current).toBeNull()

      s = reducer(s, deleteBlueprint.rejected(new Error('server'), 'd1', arg))
      expect(s.byAuthor.john.map((b) => b.name)).toEqual(['house', 'garage'])
      expect(s.current.name).toBe('house')
      expect(s.deleteError).toBe('server')
    })

    it('mantiene el borrado si el servidor confirma', () => {
      let s = reducer(loaded(), deleteBlueprint.pending('d1', arg))
      s = reducer(s, deleteBlueprint.fulfilled(arg, 'd1', arg))
      expect(s.byAuthor.john).toHaveLength(1)
      expect(s.deleteStatus).toBe('succeeded')
      expect(s.rollback).toEqual({})
    })
  })

  it('clearMutationErrors limpia los errores de escritura', () => {
    const arg = { author: 'john', name: 'house', points: [] }
    let s = reducer(loaded(), updateBlueprint.rejected(new Error('x'), 'u', arg))
    s = reducer(s, clearMutationErrors())
    expect(s.updateError).toBeNull()
    expect(s.updateStatus).toBe('idle')
  })

  it('selectTopBlueprints devuelve máximo 5 ordenados por puntos y está memoizado', () => {
    const items = Array.from({ length: 7 }, (_, i) => ({
      author: 'a',
      name: `bp${i}`,
      points: Array.from({ length: i }, () => ({ x: 0, y: 0 })),
    }))
    const state = { blueprints: { byAuthor: { a: items } } }
    const top = selectTopBlueprints(state)
    expect(top.map((b) => b.name)).toEqual(['bp6', 'bp5', 'bp4', 'bp3', 'bp2'])
    expect(selectTopBlueprints(state)).toBe(top)
  })
})
