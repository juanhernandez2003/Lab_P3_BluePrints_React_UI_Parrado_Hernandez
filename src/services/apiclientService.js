import api, { API_BASE_URL, unwrap } from './apiClient.js'

const url = (...parts) =>
  [`${API_BASE_URL}/blueprints`, ...parts.map((p) => encodeURIComponent(p))].join('/')

const toArray = (value) => (Array.isArray(value) ? value : value ? Object.values(value) : [])

export default {
  async getAll() {
    const { data } = await api.get(url())
    return toArray(unwrap(data))
  },
  async getByAuthor(author) {
    const { data } = await api.get(url(author))
    return toArray(unwrap(data))
  },
  async getByAuthorAndName(author, name) {
    const { data } = await api.get(url(author, name))
    return unwrap(data)
  },
  async create(blueprint) {
    const { data } = await api.post(url(), blueprint)
    return unwrap(data) ?? blueprint
  },
  async update(author, name, blueprint) {
    const body = { author, name, points: blueprint.points ?? [] }
    const { data } = await api.put(url(author, name), body)
    return unwrap(data) ?? body
  },
  async remove(author, name) {
    await api.delete(url(author, name))
    return { author, name }
  },
}
