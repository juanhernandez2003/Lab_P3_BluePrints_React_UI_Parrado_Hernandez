# Informe Lab P3 – React UI para Blueprints

**Integrantes:** Nicolás Parrado, Hernandez

---

## Qué se hizo

Se construyó una SPA en React que consume el backend de los labs anteriores (Spring Boot + JWT). La app permite buscar blueprints por autor, verlos en una tabla y dibujarlos en un canvas. También tiene login con JWT y un formulario para crear blueprints nuevos.

---

## Partes principales

### Servicios (`apimock` / `apiclient`)

Se implementaron dos servicios con la misma interfaz (`getAll`, `getByAuthor`, `getByAuthorAndName`, `create`):

- `apimock.js`: devuelve datos en memoria, no necesita backend.
- `apiclientService.js`: hace las llamadas reales con Axios, manda el JWT en cada request.
- `blueprintsService.js`: decide cuál usar según `VITE_USE_MOCK` en el `.env`.

Para cambiar entre uno y otro basta con editar el `.env`:
```
VITE_USE_MOCK=true   # mock
VITE_USE_MOCK=false  # backend real
```

### Redux

El slice `blueprintsSlice` maneja tres thunks: `fetchByAuthor`, `fetchBlueprint` y `createBlueprint`. Cada thunk tiene su propio par `status`/`error` (`status`/`error` para la búsqueda por autor, `blueprintStatus`/`blueprintError` para abrir un plano, `createStatus`/`createError` para crear uno), así la UI puede mostrar carga y error de forma independiente para cada acción. Si un `GET` falla, se muestra un banner con botón **Reintentar** que vuelve a despachar el mismo thunk. También se agregó `selectTopBlueprints`, un selector memoizado (`createSelector` de Redux Toolkit) que deriva el top-5 de blueprints por cantidad de puntos a partir de todos los autores consultados. Ningún componente toca el DOM directamente.

### Canvas

`BlueprintCanvas` recibe un array de puntos y los dibuja con líneas y círculos sobre un fondo oscuro con grilla. Los puntos se auto-escalan (`fitPoints`) para ocupar el canvas completo con un margen, sin importar el rango de coordenadas que use el backend o el mock. Se actualiza solo cuando cambian los puntos.

### Login y rutas protegidas

El login llama a `POST /auth/login`, guarda el `access_token` en `localStorage` y redirige al inicio. `PrivateRoute` revisa si hay token antes de dejar entrar a cualquier ruta protegida; si no hay, manda al login. Con `VITE_USE_MOCK=true` el login no llama al backend: genera un token local para poder probar toda la app (incluido el login) sin tener el backend corriendo.

---

## Decisiones de diseño

- Se usó `blueprintsService.js` como capa de abstracción para que el resto del código no sepa si está hablando con el mock o con el backend real.
- El mock usa los mismos datos iniciales que el backend (`john/house`, `john/garage`, `jane/garden`) para que la experiencia sea consistente.
- El `apiClient.js` original se dejó solo para el login (que no pasa por el servicio de blueprints).

---

## Pruebas

Se tienen 4 pruebas con Vitest + Testing Library:

| Test | Qué valida |
|------|-----------|
| `BlueprintCanvas` | Que el canvas renderiza y llama `getContext` |
| `BlueprintForm` | Que el formulario parsea el JSON y llama `onSubmit` con los datos correctos |
| `BlueprintsPage` | Que al hacer click en "Get blueprints" se despacha `fetchByAuthor` con el autor correcto |
| `blueprintsSlice` | Que el estado inicial del slice es el esperado |

Todas pasan. El mock del canvas en `tests/setup.js` usa `Object.defineProperty` para sobreescribir `getContext` en jsdom.

---

## Cómo correr

```bash
npm install
# con mock (sin backend):
# VITE_USE_MOCK=true en .env
npm run dev

# con backend real:
# VITE_USE_MOCK=false en .env
# arrancar Lab P2 en puerto 8080
npm run dev
```

Usuarios del backend: `student / student123` o `assistant / assistant123`.

```bash
npm test       # correr pruebas
npm run lint   # linter
npm run build  # build de producción
```
