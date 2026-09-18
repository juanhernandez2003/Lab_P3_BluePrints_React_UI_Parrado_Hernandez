import mock from './apimock.js'
import real from './apiclientService.js'

const service = import.meta.env.VITE_USE_MOCK === 'true' ? mock : real

export default service
