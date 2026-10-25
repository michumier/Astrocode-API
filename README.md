# AstroCode API

Backend GraphQL de AstroCode: Node.js + TypeScript + Apollo Server + MySQL, con un contenedor aislado (`python-runner`) que ejecuta el código Python de los alumnos.

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
| MySQL (Workbench) | localhost:3307 |

Los cambios en `src/` (API) y en `client/src/` (web) se recargan solos.

## Base de datos

- `src/db/BD Astrocode.sql` crea las tablas y los datos iniciales **solo la primera vez** (cuando el volumen de MySQL está vacío).
- Los cambios de esquema posteriores van en `src/db/migrations.ts`: la API aplica las migraciones pendientes al arrancar.
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

Sin acceso a internet ni a MySQL, sistema de archivos de solo lectura, usuario sin privilegios y límites de CPU (5 s), memoria (256 MB), procesos y tamaño de salida. Solo la API puede llamarlo (no se publica ningún puerto).

## Tests

```bash
npm test   # tests de integración contra la API en marcha (localhost:4000)
```
