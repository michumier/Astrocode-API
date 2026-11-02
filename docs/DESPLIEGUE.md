# Despliegue de AstroCode (Vercel + Supabase, 0 €)

Todo va en planes gratuitos y **sin tarjeta**. Sin un método de pago no pueden cobrar nada: si se supera un límite, el servicio se pausa hasta el mes siguiente.

## Piezas

| Pieza | Dónde | Proyecto | Dirección |
|---|---|---|---|
| Web (React) | Vercel Hobby | `astrocode` (repo Astrocode-web, carpeta `client`) | https://astrocode-steel.vercel.app |
| API GraphQL (Express + Apollo) | Vercel Hobby, una función en Dublín (`dub1`) | `astrocode-api` (repo Astrocode-API, raíz) | https://astrocode-api-beta.vercel.app/graphql |
| Ejecutor de Python (Flask) | Vercel Hobby, otra función en Dublín | `astrocode-runner` (repo Astrocode-API, carpeta `python-runner`) | https://astrocode-runner.vercel.app |
| Base de datos (Postgres 17) | Supabase Free, Irlanda (`eu-west-1`) | `astrocode` (`iairtjqhsqxkdfzwnkaw`) | — |
| IA | NVIDIA (clave gratuita) | — | — |

Los tres proyectos de Vercel se despliegan solos al hacer push a `main` de su repositorio.

## Variables de entorno

Las secretas las pone el dueño en el panel de Vercel (Settings → Environment Variables, tipo *Sensitive*, entorno *Production*). Nunca van en el repositorio.

**astrocode-api**

| Variable | Valor | Secreta |
|---|---|---|
| `DATABASE_URL` | Cadena del *Transaction pooler* de Supabase (puerto 6543) | ✅ |
| `JWT_SECRET` | Aleatoria y larga | ✅ |
| `RUNNER_TOKEN` | Aleatoria; **la misma** que en el runner | ✅ |
| `NVIDIA_API_KEY` | Clave de build.nvidia.com | ✅ |
| `ADMIN_EMAILS` | Correos con rol admin | — |
| `CORS_ORIGIN` | `https://astrocode-steel.vercel.app` | — |
| `PYTHON_RUNNER_URL` | `https://astrocode-runner.vercel.app` | — |
| `NODE_ENV` · `DB_POOL_MAX` · `NVIDIA_MODEL` · `NVIDIA_RAZONAMIENTO` · `PISTAS_POR_DIA` | `production` · `3` · el modelo · `false` · `20` | — |

**astrocode-runner**: solo `RUNNER_TOKEN`. Este proyecto no debe tener ningún otro secreto, porque ejecuta código de los alumnos.

**astrocode** (web): `REACT_APP_API_URL=https://astrocode-api-beta.vercel.app/graphql`. Se compila dentro de la web, así que al cambiarla hay que volver a desplegar.

Para generar `JWT_SECRET` y `RUNNER_TOKEN`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Base de datos

- La API aplica las migraciones pendientes en su primer arranque, también en Vercel. Una función en frío con todo al día solo hace una consulta.
- La primera vez crea las tablas y carga los ejercicios (`001_esquema` y las semillas).
- Para aplicarlas a mano: `DATABASE_URL=... npm run migrar`. Si se pone `MIGRAR_AL_ARRANCAR=0` en Vercel, este es el único camino.
- Todas las tablas tienen RLS activado y sin políticas: la API REST pública de Supabase no puede leerlas. La API de AstroCode se conecta como propietaria y no le afecta.
- AstroCode no usa Supabase Auth (tiene sus propias cuentas), así que **no le afecta el límite de correos ni de altas** de Supabase Auth.

## Seguridad del ejecutor en Vercel

En Docker el código de los alumnos corre en un contenedor sin red y de solo lectura. En Vercel no hay contenedor propio, así que hay tres capas:

1. **Proyecto aparte, sin secretos.** Solo tiene `RUNNER_TOKEN` y solo atiende a peticiones con ese token; `/health` está abierto.
2. **`aislador.py`**: un *audit hook* de Python que se pone antes del código del alumno y no se puede quitar. Bloquea:
   - sockets (sin red);
   - otros procesos (`subprocess`, `os.system`, `fork`…);
   - `ctypes`;
   - leer `/proc` y `/sys`;
   - matar procesos.
3. **Límites del proceso** (`sandbox.py`):
   - CPU: 5 s;
   - memoria: 256 MB;
   - procesos y descriptores;
   - archivos de 1 MB;
   - entorno vacío.

No es tan fuerte como el contenedor: un audit hook se puede llegar a saltar con un fallo del propio intérprete. Pero cierra las vías habituales, y en el proyecto no hay nada que robar salvo el token, que solo sirve para ejecutar código, igual que la propia web.

## Límites gratuitos que conviene conocer

- **Supabase Free:**
  - 500 MB de base de datos;
  - **se pausa tras 7 días sin actividad**: se reactiva desde el panel sin perder datos (hasta 90 días);
  - sin copias de seguridad descargables.
- **Vercel Hobby:**
  - solo para uso personal y no comercial;
  - cuota mensual de CPU activa, invocaciones y transferencia: si se agota, las funciones se paran hasta el mes siguiente;
  - cada ejecución de código gasta un poco de CPU del runner.
- **Límite de peticiones:** el de la API (`RATE_LIMIT_PER_MIN`) se cuenta por instancia de la función, así que en la nube es aproximado.
