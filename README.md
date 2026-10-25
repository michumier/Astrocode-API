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

`enviarSolucion(tareaId, codigo, tiempoCompletado)` ejecuta el código en el `python-runner`, compara la salida con el resultado esperado **en el servidor** y solo entonces suma los puntos (en una transacción). `executeCode` sirve para probar código sin corregir.

## Python runner

Sin acceso a internet ni a MySQL, sistema de archivos de solo lectura, usuario sin privilegios y límites de CPU (5 s), memoria (256 MB), procesos y tamaño de salida. Solo la API puede llamarlo (no se publica ningún puerto).

## Tests

```bash
npm test   # tests de integración contra la API en marcha (localhost:4000)
```
