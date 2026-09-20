import api, { AUTH_URL } from './apiClient.js'
import { createMockToken, setToken } from './auth.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

/** Inicia sesión y guarda el token. Con VITE_USE_MOCK=true no llama al backend. */
export async function login(username, password) {
  const user = username.trim()
  if (!user) throw new Error('Ingresa un usuario')
  if (useMock) {
    const token = createMockToken(user)
    setToken(token)
    return token
  }
  try {
    const { data } = await api.post(AUTH_URL, { username: user, password })
    if (!data?.access_token) throw new Error('Respuesta de login inválida')
    setToken(data.access_token)
    return data.access_token
  } catch (err) {
    if (err.response?.status === 401) throw new Error('Usuario o contraseña incorrectos')
    throw err
  }
}
