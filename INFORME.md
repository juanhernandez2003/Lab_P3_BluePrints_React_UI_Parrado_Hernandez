# Informe Lab P3 – React UI para Blueprints

**Integrantes:** Nicolás Parrado, Juan Esteban Hernández

---

## Qué se hizo

Una SPA en React + Vite que consume el backend del Lab P2 (Spring Boot + JWT RS256). Permite:

- Iniciar sesión (JWT) y proteger todas las rutas con `PrivateRoute`.
- Buscar los blueprints de un autor, verlos en una tabla (nombre, número de puntos, `Open`) y el total de puntos.
- Abrir un plano: su nombre queda en el estado global (Redux) y se dibuja en el canvas (segmentos consecutivos + cada punto marcado).
- **CRUD completo**: crear (dibujando con clicks o escribiendo JSON), editar (click en el lienzo agrega puntos → `Guardar` envía `PUT`) y eliminar (`DELETE`), con **optimistic updates** que se revierten si el servidor falla.
- Top-5 de blueprints por cantidad de puntos (selector memoizado).
- Modo claro/oscuro y diseño responsive.

---

## Requerimientos del laboratorio

| # | Requerimiento | Dónde |
|---|---|---|
| 1 | Canvas con id propio (`blueprint-canvas`), 520×360 | `components/BlueprintCanvas.jsx` |
| 2 | Consultar planos por autor y mostrarlos en tabla con `Open` | `pages/BlueprintsPage.jsx` |
| 3 | `Open` actualiza el campo "Plano actual", trae los puntos y los dibuja | `fetchBlueprint` + `BlueprintEditor` |
| 4 | `apimock` y `apiclient` con la misma interfaz; cambio con `VITE_USE_MOCK` | `services/` |
| 5 | Nombre del plano actual desde Redux, sin tocar el DOM | `state.blueprints.current` |
| 6 | Estilos (tabla, botones, tarjetas, banners, tema claro/oscuro) | `styles.css` |
| 7 | Pruebas con Vitest + Testing Library | `tests/` (34 pruebas) |

---

## Partes principales

### Servicios (`apimock` / `apiclient`)

Ambos exponen `getAll`, `getByAuthor`, `getByAuthorAndName`, `create`, `update` y `remove`.

- `apimock.js`: datos en memoria (los mismos tres blueprints que el backend). Devuelve copias para que Redux (que congela el estado) nunca comparta referencias con el "servidor". Con `VITE_MOCK_WRITE_FAIL_RATE` se pueden simular fallos de escritura para ver el rollback.
- `apiclientService.js`: Axios contra `/api/v1/blueprints`. El backend responde `{ code, message, data }`, así que `unwrap` extrae `data`.
- `blueprintsService.js`: la única línea que decide cuál usar según `VITE_USE_MOCK`.

### Seguridad (JWT)

- `apiClient.js`: instancia única de Axios con dos interceptores. El de salida agrega `Authorization: Bearer <token>`. El de entrada traduce errores: un `401` borra el token y emite `auth:expired` (la app redirige al login con el aviso "Tu sesión expiró"); un `403` muestra "scope insuficiente"; si no hay conexión lo dice claramente.
- `auth.js`: decodifica el payload del JWT (solo para la UI, la firma la valida el backend), revisa `exp` y lee el `scope`. Así `PrivateRoute` rechaza tokens vencidos y la UI deshabilita crear/editar/eliminar si el usuario no tiene `blueprints.write` (p. ej. `student`).
- Login contra `POST /auth/login`. En modo mock se genera un token local con el mismo formato (y `student` también queda de solo lectura, igual que en el backend).
- CORS: el backend no lo configura, así que Vite hace de proxy (`/api`, `/auth` → `VITE_BACKEND_URL`); en Docker lo hace nginx. El navegador siempre ve un solo origen.

### Redux

`blueprintsSlice` tiene cinco thunks, cada uno con su propio par estado/error:

| Thunk | Estado | Uso en la UI |
|---|---|---|
| `fetchByAuthor` | `status` / `error` | tabla + banner con **Reintentar** |
| `fetchBlueprint` | `blueprintStatus` / `blueprintError` | canvas + banner con **Reintentar** |
| `createBlueprint` | `createStatus` / `createError` | formulario |
| `updateBlueprint` | `updateStatus` / `updateError` | editor (optimista) |
| `deleteBlueprint` | `deleteStatus` / `deleteError` | editor (optimista) |

**Optimistic updates:** en `pending` se guarda una copia del plano (con `current()` de Immer) en `state.rollback["autor/nombre"]` y se aplica el cambio de inmediato. En `fulfilled` se descarta la copia; en `rejected` se restaura (en el caso de `DELETE`, en la misma posición de la tabla) y se muestra el banner "Se revirtió el cambio".

`selectTopBlueprints` usa `createSelector` para derivar el top-5 por puntos de todos los autores consultados.

### Canvas y dibujo interactivo

`BlueprintCanvas` calcula una transformación mundo→lienzo que encuadra los puntos (`computeView`) y su inversa (`toWorld`). Si recibe `onAddPoint`, cada click se convierte a coordenadas del blueprint (enteras, como las guarda el backend) y la escala se congela mientras se edita para que el dibujo no salte. El primer punto se pinta en verde.

`BlueprintEditor` (pantalla principal y `/blueprints/:author/:name`, que antes usaba un `svg`) ofrece Editar → click para agregar puntos → Deshacer / Limpiar / **Guardar** / Cancelar, y Eliminar con confirmación en línea. `BlueprintForm` permite crear un plano dibujando en su propio canvas; el JSON de puntos se mantiene sincronizado y se valida sin `alert`.

---

## Pruebas

34 pruebas (Vitest + Testing Library), todas pasan:

| Archivo | Qué valida |
|---|---|
| `BlueprintCanvas.test.jsx` | render con id y 520×360, `getContext`, segmentos y puntos, click interactivo, `toWorld` inversa de `toCanvas` |
| `BlueprintForm.test.jsx` | envío con JSON parseado, clicks en el lienzo agregan puntos, validaciones |
| `BlueprintsPage.test.jsx` | `Get blueprints` despacha `fetchByAuthor` y pinta la tabla, `Open` actualiza el plano actual, banner + Reintentar, usuario de solo lectura |
| `blueprintsSlice.test.jsx` | reducers puros: carga/error, create, update y delete optimistas con rollback, selector top-5 memoizado |
| `services.test.js` | misma interfaz en ambos servicios, rutas `/api/v1`, `unwrap`, CRUD del mock |
| `auth.test.jsx` | decodificación del JWT, scopes, expiración, `PrivateRoute` |

Además se probó la app completa en un navegador (Playwright) contra un servidor que imita el contrato del Lab P2: login inválido/válido, tabla, Open, usuario de solo lectura, crear dibujando, PUT/DELETE, rollback ante error y redirección al login con un 401.

---

## Cambios en el backend (Lab P2)

El Lab P2 no tenía `PUT /api/v1/blueprints/{author}/{name}` ni `DELETE /api/v1/blueprints/{author}/{name}` (solo `PUT .../{name}/points`), así que se agregaron:

- `PUT /{author}/{bpname}`: reemplaza todos los puntos y responde `200` con el blueprint actualizado; `400` si falta `points` o si `author`/`name` del cuerpo no coinciden con la URL; `404` si no existe.
- `DELETE /{author}/{bpname}`: `200` si se eliminó, `404` si no existe.
- Ambos exigen `blueprints.write`: regla `DELETE /api/** → WRITE` nueva en `SecurityConfig` más `@PreAuthorize` en el controller. Están implementados en la persistencia en memoria y en la de PostgreSQL, y tienen pruebas unitarias y de integración.

Con eso, el CRUD de la UI funciona igual con el mock y con el backend real.

---

## Cómo correr

```bash
npm install
npm run dev          # http://localhost:5173
```

- **Mock** (sin backend): `VITE_USE_MOCK=true` en `.env`. Cualquier usuario entra; `student` es de solo lectura.
- **Backend real**: `VITE_USE_MOCK=false` y levantar el Lab P2 en el puerto 8080. Usuarios: `student / student123` (lectura) y `assistant / assistant123` (lectura y escritura).
- **Docker**: `docker compose up --build` (construye el Lab P2 desde la carpeta vecina y sirve el front con nginx en `http://localhost:5173`).

```bash
npm test       # pruebas
npm run lint   # ESLint
npm run build  # build de producción
```
