import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/services/apiClient.js', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  }
})

import api, { unwrap } from '../src/services/apiClient.js'
import apiclient from '../src/services/apiclientService.js'
import apimock from '../src/services/apimock.js'

const METHODS = ['getAll', 'getByAuthor', 'getByAuthorAndName', 'create', 'update', 'remove']

describe('interfaz común de servicios', () => {
  it('apimock y apiclient exponen los mismos métodos', () => {
    for (const m of METHODS) {
      expect(typeof apimock[m]).toBe('function')
      expect(typeof apiclient[m]).toBe('function')
    }
  })
})

describe('apiclient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('unwrap saca `data` del ApiResponse del backend', () => {
    expect(unwrap({ code: 200, message: 'execute ok', data: [1] })).toEqual([1])
    expect(unwrap([1, 2])).toEqual([1, 2])
  })

  it('usa las rutas /api/v1/blueprints del backend y desempaqueta', async () => {
    api.get.mockResolvedValue({ data: { code: 200, message: 'ok', data: [{ name: 'house' }] } })
    const items = await apiclient.getByAuthor('john doe')
    expect(api.get).toHaveBeenCalledWith('/api/v1/blueprints/john%20doe')
    expect(items).toEqual([{ name: 'house' }])
  })

  it('update hace PUT /blueprints/{author}/{name} y remove hace DELETE', async () => {
    api.put.mockResolvedValue({ data: { code: 200, message: 'ok', data: null } })
    api.delete.mockResolvedValue({ data: { code: 200, message: 'ok', data: null } })
    const pts = [{ x: 1, y: 2 }]
    const saved = await apiclient.update('john', 'house', { points: pts })
    expect(api.put).toHaveBeenCalledWith('/api/v1/blueprints/john/house', {
      author: 'john',
      name: 'house',
      points: pts,
    })
    expect(saved.points).toEqual(pts)
    await apiclient.remove('john', 'house')
    expect(api.delete).toHaveBeenCalledWith('/api/v1/blueprints/john/house')
  })
})

describe('apimock', () => {
  beforeEach(() => apimock.__reset())

  it('CRUD completo en memoria', async () => {
    expect((await apimock.getByAuthor('john')).map((b) => b.name)).toEqual(['house', 'garage'])

    await apimock.create({ author: 'ana', name: 'plaza', points: [{ x: 1, y: 1 }] })
    await expect(apimock.create({ author: 'ana', name: 'plaza', points: [] })).rejects.toThrow(
      /already exists/,
    )

    await apimock.update('ana', 'plaza', { points: [{ x: 9, y: 9 }] })
    expect((await apimock.getByAuthorAndName('ana', 'plaza')).points).toEqual([{ x: 9, y: 9 }])

    await apimock.remove('ana', 'plaza')
    await expect(apimock.getByAuthor('ana')).rejects.toThrow(/No blueprints/)
  })

  it('devuelve copias (mutar el resultado no altera el "servidor")', async () => {
    const bp = await apimock.getByAuthorAndName('john', 'house')
    bp.points.push({ x: 99, y: 99 })
    expect((await apimock.getByAuthorAndName('john', 'house')).points).toHaveLength(4)
  })
})
