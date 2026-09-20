// Servicio mock: misma interfaz que apiclientService, datos en memoria.
// Usa los mismos blueprints iniciales que el backend del Lab P2.

const INITIAL_DATA = [
  {
    author: 'john',
    name: 'house',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
  },
  {
    author: 'john',
    name: 'garage',
    points: [
      { x: 5, y: 5 },
      { x: 15, y: 5 },
      { x: 15, y: 15 },
    ],
  },
  {
    author: 'jane',
    name: 'garden',
    points: [
      { x: 2, y: 2 },
      { x: 3, y: 4 },
      { x: 6, y: 7 },
    ],
  },
]

// Copias profundas: Redux congela lo que guarda, así el "servidor" nunca comparte referencias.
const clone = (bp) => ({ ...bp, points: (bp.points ?? []).map((p) => ({ x: p.x, y: p.y })) })

let data = INITIAL_DATA.map(clone)

const DELAY_MS = Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 300)
// Probabilidad (0..1) de que una escritura falle: sirve para ver el rollback optimista.
const WRITE_FAIL_RATE = Number(import.meta.env.VITE_MOCK_WRITE_FAIL_RATE ?? 0)

const delay = () => new Promise((r) => setTimeout(r, DELAY_MS))

function maybeFail() {
  if (WRITE_FAIL_RATE > 0 && Math.random() < WRITE_FAIL_RATE) {
    throw new Error('Error simulado del mock (VITE_MOCK_WRITE_FAIL_RATE)')
  }
}

const find = (author, name) => data.findIndex((bp) => bp.author === author && bp.name === name)

export default {
  async getAll() {
    await delay()
    return data.map(clone)
  },
  async getByAuthor(author) {
    await delay()
    const result = data.filter((bp) => bp.author === author)
    if (!result.length) throw new Error(`No blueprints for author: ${author}`)
    return result.map(clone)
  },
  async getByAuthorAndName(author, name) {
    await delay()
    const i = find(author, name)
    if (i < 0) throw new Error(`Blueprint not found: ${author}/${name}`)
    return clone(data[i])
  },
  async create(blueprint) {
    await delay()
    maybeFail()
    if (find(blueprint.author, blueprint.name) >= 0) {
      throw new Error(`Blueprint already exists: ${blueprint.author}/${blueprint.name}`)
    }
    data.push(clone(blueprint))
    return clone(blueprint)
  },
  async update(author, name, blueprint) {
    await delay()
    maybeFail()
    const i = find(author, name)
    if (i < 0) throw new Error(`Blueprint not found: ${author}/${name}`)
    data[i] = clone({ author, name, points: blueprint.points })
    return clone(data[i])
  },
  async remove(author, name) {
    await delay()
    maybeFail()
    const i = find(author, name)
    if (i < 0) throw new Error(`Blueprint not found: ${author}/${name}`)
    data.splice(i, 1)
    return { author, name }
  },
  /** Solo para pruebas: restaura los datos iniciales. */
  __reset() {
    data = INITIAL_DATA.map(clone)
  },
}
