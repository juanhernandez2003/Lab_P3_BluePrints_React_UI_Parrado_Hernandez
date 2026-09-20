import axios from 'axios'
import { AUTH_EXPIRED_EVENT, clearToken, getToken } from './auth.js'

// Rutas relativas: en desarrollo el proxy de Vite las reenvía al backend (evita CORS).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
export const AUTH_URL = import.meta.env.VITE_AUTH_URL || '/auth/login'

const api = axios.create({ timeout: 8000 })

// Interceptor de salida: adjunta el JWT a cada petición.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor de entrada: mensajes de error legibles y manejo centralizado del 401.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const backendMessage = err.response?.data?.message
    const isLogin = err.config?.url === AUTH_URL

    if (!err.response) {
      err.message =
        err.code === 'ECONNABORTED'
          ? 'El backend tardó demasiado en responder'
          : 'No se pudo conectar con el backend'
    } else if (status === 401 && !isLogin) {
      clearToken()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
      err.message = 'Sesión expirada o token inválido. Inicia sesión de nuevo.'
    } else if (status === 403) {
      err.message = 'Tu usuario no tiene permiso para esta acción (scope insuficiente)'
    } else if (backendMessage) {
      err.message = backendMessage
    }
    return Promise.reject(err)
  },
)

/** El backend envuelve todo en { code, message, data }; esto devuelve solo `data`. */
export function unwrap(body) {
  if (
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    'code' in body &&
    'data' in body
  ) {
    return body.data
  }
  return body
}

export default api
