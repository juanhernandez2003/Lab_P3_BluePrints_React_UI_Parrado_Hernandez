import mock from './apimock.js'
import real from './apiclientService.js'

// Cambio mock <-> API real en una sola línea, controlado por VITE_USE_MOCK en .env.
const service = import.meta.env.VITE_USE_MOCK === 'true' ? mock : real

export default service
