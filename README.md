# 🛡️ AstroCode API

Backend GraphQL de AstroCode: Node.js + TypeScript + Apollo Server + PostgreSQL, con un contenedor aislado (`python-runner`) que ejecuta el código Python de los alumnos.

## Arrancar con Docker (recomendado)

Las carpetas `Astrocode-API` y `Astrocode-web` tienen que estar una al lado de la otra.

```bash
cp .env.example .env      # y rellena JWT_SECRET, DB_PASSWORD y ADMIN_EMAILS
docker compose up --build # o start-local.bat en Windows
```

| Servicio | URL |
|---|---|
| Web | http://localhost:3000 |
| API GraphQL | http://localhost:4000/graphql |
| Health check | http://localhost:4000/health |
| Postgres (DBeaver, psql…) | localhost:5433 (usuario `postgres`) |

Los cambios en `src/` (API) y en `client/src/` (web) se recargan solos.

## Base de datos

Postgres 17, la misma versión que Supabase (desde la fase 8; antes era MySQL).

- `src/db/migrations.ts` lleva la base de datos al día: la API aplica al arrancar las migraciones que falten, cada una en su transacción.
- La primera (`001_esquema`) crea las tablas (`src/db/esquema.sql`) y carga el catálogo original (`src/db/datos-base.sql`); las siguientes siembran los ejercicios, misiones y retos.
- Los cambios nuevos van en una migración nueva **al final** de la lista (nunca se edita una ya aplicada).
- Las consultas usan parámetros de Postgres (`$1`, `$2`…) con `query()` (filas) y `ejecutar()` (filas afectadas) de `src/config/db.ts`.
- Para conectarse a una base de datos en la nube se usa `DATABASE_URL` en lugar de las variables `DB_*`.
- Para empezar de cero (borra todos los datos): `docker compose down -v`.

## Roles

Los usuarios son `alumno` por defecto. Los emails que pongas en `ADMIN_EMAILS` reciben el rol `admin` al arrancar la API. Solo un admin puede crear, editar o borrar ejercicios, categorías y niveles, o ver la lista de usuarios con emails.

## Corrección de ejercicios

`enviarSolucion(tareaId, codigo, tiempoCompletado)` corrige **en el servidor** y solo entonces suma los puntos (en una transacción):

- Si la tarea tiene **tests** (tabla `tests_tarea`), ejecuta el código del alumno seguido de cada test. Los tests ocultos no muestran sus datos, así que no vale con imprimir el resultado esperado.
- Si no tiene tests, compara la salida del programa con `resultado_esperado`.

`executeCode` sirve para probar código sin corregir. La solución de referencia de cada tarea (`solucion`) nunca se envía al cliente.

## IA (opcional, NVIDIA)

Con `NVIDIA_API_KEY` en el `.env` (clave gratuita en [build.nvidia.com](https://build.nvidia.com)) se activan:

- **Pistas para alumnos** (`pedirPista`): 3 niveles, de conceptual a muy concreta, con un límite diario por alumno (`PISTAS_POR_DIA`). La IA recibe la solución de referencia para entender el ejercicio, pero tiene prohibido revelarla, y además un filtro bloquea cualquier respuesta que copie líneas de la solución.
- **Generador de ejercicios para admins** (`generarEjercicio`, y en la web: Perfil → Panel de admin): la IA propone enunciado, código base, solución y tests. Cada test se **comprueba en el sandbox** con la solución y se descartan los incorrectos. No se guarda nada hasta que el admin lo revisa.

La IA nunca decide los puntos: corregir con tests es determinista y no se puede engañar con instrucciones en el código. El modelo se cambia con `NVIDIA_MODEL`, y sirve cualquier API compatible con OpenAI cambiando `NVIDIA_BASE_URL`. Sin clave, todo lo demás funciona igual.

## Python runner

Sin acceso a internet ni a la base de datos, sistema de archivos de solo lectura, usuario sin privilegios y límites de CPU (5 s), memoria (256 MB), procesos y tamaño de salida. Solo la API puede llamarlo (no se publica ningún puerto).

## Tests

```bash
npm test             # compila y ejecuta las pruebas unitarias
npm run e2e:docker   # levanta un stack aislado (proyecto astrocode-e2e, con IA falsa) y ejecuta las pruebas e2e
```

`e2e:docker` no toca tu base de datos de desarrollo: usa su propio volumen y lo borra al terminar (`MANTENER=1` para dejarlo levantado). Los planes de prueba de cada fase están en `docs/pruebas/`.
