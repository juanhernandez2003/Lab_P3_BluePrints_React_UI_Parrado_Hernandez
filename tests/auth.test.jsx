import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PrivateRoute from '../src/components/PrivateRoute.jsx'
import {
  clearToken,
  createMockToken,
  decodeToken,
  getSession,
  getToken,
  isTokenValid,
  setToken,
} from '../src/services/auth.js'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <p>zona privada</p>
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<p>pantalla login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('auth', () => {
  beforeEach(() => clearToken())

  it('decodifica el JWT y deriva los scopes', () => {
    const token = createMockToken('assistant')
    expect(decodeToken(token).sub).toBe('assistant')
    expect(getSession(token)).toMatchObject({ authenticated: true, canWrite: true })
    expect(getSession(createMockToken('student')).canWrite).toBe(false)
  })

  it('un token expirado no es válido', () => {
    const expired = createMockToken('assistant', -10)
    expect(isTokenValid(expired)).toBe(false)
    expect(getSession(expired).authenticated).toBe(false)
  })

  it('PrivateRoute redirige al login sin token', () => {
    renderAt('/')
    expect(screen.getByText('pantalla login')).toBeInTheDocument()
  })

  it('PrivateRoute deja pasar con un token vigente', () => {
    setToken(createMockToken('assistant'))
    renderAt('/')
    expect(screen.getByText('zona privada')).toBeInTheDocument()
  })

  it('PrivateRoute descarta un token expirado', () => {
    setToken(createMockToken('assistant', -10))
    renderAt('/')
    expect(screen.getByText('pantalla login')).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })
})
