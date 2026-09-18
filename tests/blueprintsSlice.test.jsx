import { describe, it, expect } from 'vitest'
import reducer from '../src/features/blueprints/blueprintsSlice.js'

describe('blueprints slice', () => {
  it('should initialize correctly', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.byAuthor).toEqual({})
    expect(state.current).toBeNull()
    expect(state.status).toBe('idle')
  })
})
