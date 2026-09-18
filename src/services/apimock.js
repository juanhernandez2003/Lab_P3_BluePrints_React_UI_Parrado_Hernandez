const MOCK_DATA = [
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

const delay = () => new Promise((r) => setTimeout(r, 300))

export default {
  async getAll() {
    await delay()
    return [...MOCK_DATA]
  },
  async getByAuthor(author) {
    await delay()
    const result = MOCK_DATA.filter((bp) => bp.author === author)
    if (!result.length) throw new Error(`No blueprints for author: ${author}`)
    return result
  },
  async getByAuthorAndName(author, name) {
    await delay()
    const bp = MOCK_DATA.find((bp) => bp.author === author && bp.name === name)
    if (!bp) throw new Error(`Blueprint not found: ${author}/${name}`)
    return bp
  },
  async create(blueprint) {
    await delay()
    MOCK_DATA.push(blueprint)
    return blueprint
  },
}
