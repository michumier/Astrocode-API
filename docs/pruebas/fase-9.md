# Plan de pruebas — Fase 9 (🚀 Despliegue en Vercel + Supabase)

Ramas `feature/fase-9-despliegue`:
- en Astrocode-API;
- en Astrocode-web, ya fusionada en `main`.

La guía de despliegue está en [`docs/DESPLIEGUE.md`](../DESPLIEGUE.md).

## Qué cambia

- **API**:
  - la app de Express se monta aparte del `listen` (`configurarApp`), y Vercel la recibe exportada desde `src/index.ts`;
  - Apollo y la base de datos se preparan en la primera petición;
  - las migraciones ya aplicadas cuestan una consulta;
  - `trust proxy` en Vercel;
  - `vercel.json` con la región `dub1` y los `.sql` incluidos;
  - `npm run migrar`.
- **Runner**:
  - `aislador.py`: un *audit hook* que bloquea red, otros procesos, `ctypes`, `/proc` y `/sys`;
  - `RUNNER_TOKEN` entre la API y el runner;
  - `index.py` y `vercel.json` para Vercel.
- **Web**: `vercel.json` con las rutas de la app hacia `index.html` y caché larga para `/static`.

## Pruebas automáticas (local)

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit` y `npm test` | ✅ 8/8 |
| Pruebas del runner en su imagen, con `test_aislador` (8) y `test_token` (4) nuevas | ✅ 147 + 4 |
| `npm run e2e:docker`, con el token entre la API y el runner y 2 pruebas nuevas del aislador | ✅ **120/120** |
| `CI=true npm run build` de la web (como en Vercel) | ✅ sin avisos |

## Pruebas en la nube

| Prueba | Resultado |
|---|---|
| Supabase: proyecto `astrocode` en el plan Free | ✅ coste confirmado de 0 $/mes |
| Primer arranque de la API en Vercel | ✅ crea las tablas y aplica las 13 migraciones: 43 tareas, 68 tests, 16 categorías, 8 insignias |
| Asesor de seguridad de Supabase | ✅ solo avisos informativos «RLS sin políticas» (buscado: la API REST pública no lee nada) |
| API: `{ hello niveles }` | ✅ responde en ~1,6 s en frío |
| Web → API desde el navegador (CORS) | ✅ 200, 16 categorías |
| Ruta `/perfil` al cargar directamente | ✅ sirve la app, que manda a `/login` sin sesión |
| Runner: `/health` | ✅ abierto |
| Runner: `/run` sin token | ✅ 401 |
| Runner en Vercel, antes de poner el token: `print(sum([1,2,3]))` | ✅ `6` |
| Runner en Vercel: socket, `subprocess`, `os.system` y `/proc/1/environ` | ✅ los 4 bloqueados |
| Runner en Vercel: `urllib` a internet | ✅ sin red |
| Runner en Vercel: variables de entorno que ve el alumno | ✅ solo `HOME`, `LC_CTYPE`, `PATH` y `PYTHONIOENCODING` |
| Runner en Vercel: bucle infinito | ✅ cortado (124) |
| Runner en Vercel: `"x" * 1024**3` | ✅ `MemoryError`, con la pista de los 256 MB |
| Runner en Vercel: error del alumno | ✅ traza de `main.py`, sin rastro del aislador |

## Pendiente

- [ ] Alta, entrada, ejercicio, reto y perfil en https://astrocode-steel.vercel.app. Esta prueba la hace el dueño con su cuenta (Claude no crea cuentas en una web pública).
- [ ] Fusionar `feature/fase-9-despliegue` en `main` de la API. Desde entonces, Vercel despliega solo con cada push a `main`.

## Incidencias durante el despliegue

- La variable se llamaba `JWT_TOKEN` en vez de `JWT_SECRET`, y la API no arrancaba.
- La contraseña de la base de datos tenía caracteres que rompen la URL. Salía `getaddrinfo ENOTFOUND base`. Se cambió por una solo de letras y números.
