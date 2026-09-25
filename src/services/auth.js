// Utilidades de sesión: guardar/leer el JWT, decodificar su payload y validar expiración.
// No verifica la firma (eso lo hace el backend); solo sirve para decisiones de UI.

const TOKEN_KEY = 'token'
export const AUTH_EXPIRED_EVENT = 'auth:expired'
export const SCOPE_READ = 'blueprints.read'
export const SCOPE_WRITE = 'blueprints.write'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

// NOTA DE SEGURIDAD: localStorage es accesible desde JS y vulnerable a XSS.
// En producción, preferir httpOnly cookies (requiere soporte del backend).
export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* almacenamiento no disponible */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}

function base64UrlDecode(segment) {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function base64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text)
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Devuelve el payload del JWT o null si el token no tiene formato JWT. */
export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}

/** true si hay token y (cuando trae `exp`) todavía no ha expirado. */
export function isTokenValid(token = getToken(), now = Date.now()) {
  if (!token) return false
  const payload = decodeToken(token)
  if (!payload || typeof payload.exp !== 'number') return true
  return payload.exp * 1000 > now
}

/** Información de la sesión actual derivada del JWT. */
export function getSession(token = getToken()) {
  if (!isTokenValid(token))
    return { authenticated: false, username: null, scopes: [], canWrite: false }
  const payload = decodeToken(token)
  // Token opaco (no JWT): dejamos que el backend decida los permisos.
  if (!payload) return { authenticated: true, username: null, scopes: [], canWrite: true }
  const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ').filter(Boolean) : []
  return {
    authenticated: true,
    username: payload.sub ?? null,
    scopes,
    canWrite: scopes.includes(SCOPE_WRITE),
  }
}

/**
 * Token local para el modo mock. Imita al backend del Lab P2:
 * `student` solo lee; cualquier otro usuario lee y escribe.
 */
export function createMockToken(username, ttlSeconds = 3600) {
  const now = Math.floor(Date.now() / 1000)
  const scope = username === 'student' ? SCOPE_READ : `${SCOPE_READ} ${SCOPE_WRITE}`
  const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = base64UrlEncode(
    JSON.stringify({ sub: username, scope, iat: now, exp: now + ttlSeconds, iss: 'mock' }),
  )
  return `${header}.${payload}.mock`
}
