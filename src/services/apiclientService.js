import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 8000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) localStorage.removeItem('token')
    return Promise.reject(err)
  },
)

export default {
  async getAll() {
    const { data } = await http.get('/blueprints')
    return data
  },
  async getByAuthor(author) {
    const { data } = await http.get(`/blueprints/${encodeURIComponent(author)}`)
    return data
  },
  async getByAuthorAndName(author, name) {
    const { data } = await http.get(
      `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
    )
    return data
  },
  async create(blueprint) {
    const { data } = await http.post('/blueprints', blueprint)
    return data
  },
}
