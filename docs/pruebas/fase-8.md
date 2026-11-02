# Plan de pruebas — Fase 8 (🐘 De MySQL a Postgres)

Rama: `feature/fase-8-postgres` en Astrocode-API. El frontal no cambia.

## Antes de empezar: ¿hay límite de altas de usuarios?

En otro proyecto con Supabase hubo un límite diario de altas. Ese límite es de **Supabase Auth**: su servidor de correo de serie solo envía unos pocos correos por hora (confirmaciones de alta, recuperación de contraseña) y, con uno propio, el límite por defecto es de 30 altas por hora.

**A AstroCode no le afecta**: tiene su propio sistema de cuentas (contraseñas con bcrypt y sesiones JWT en la tabla `usuarios`) y no envía correos. Supabase solo pone la base de datos Postgres, que no limita las altas. Lo que sí limita la API es el número de peticiones por minuto e IP (`RATE_LIMIT_PER_MIN`), como antes.

## Qué cambia

- **Driver**: `mysql2` → `pg`. `src/config/db.ts` ofrece:
  - `query()`, que devuelve las filas;
  - `ejecutar()`, que devuelve las filas afectadas;
  - `transaction()`;
  - `esDuplicado()`;
  - `HOY_UTC` e `INICIO_DIA_UTC`.

  Con `DATABASE_URL` se conecta a la nube por SSL; sin ella, usa las `DB_*` de siempre.
- **Esquema** (`src/db/esquema.sql`): el estado final del volcado de MySQL más sus migraciones de estructura.
  - Los ids pasan a `IDENTITY`; `TINYINT(1)` a `BOOLEAN`; `JSON` a `JSONB`.
  - `tiempo_completado` es `INTERVAL`, porque `TIME` de Postgres no pasa de 24 h.
  - Las fechas son `TIMESTAMPTZ`.
  - RLS está activado sin políticas: en Supabase cierra la API REST pública. La API GraphQL no se ve afectada.
- **Datos base** (`src/db/datos-base.sql`): categorías, niveles, tiempos, insignias y los 28 ejercicios originales, convertidos del volcado.
  - **No** se traen los usuarios antiguos ni su progreso, que eran cuentas de prueba del TFG con su hash de contraseña.
  - `BD Astrocode.sql` sale del repositorio (sigue en el historial).
- **Migraciones**:
  - `001_esquema` crea todo. Las semillas conservan su número (005, 011–021).
  - Cada una va en su transacción, de modo que si falla no deja nada a medias.
  - Llevan un candado (`pg_advisory_xact_lock`) para que dos arranques a la vez no la repitan.
- **Consultas** (unas 140):
  - `?` → `$1, $2…`, también en los filtros y UPDATE que se montan por partes;
  - `insertId` → `RETURNING id`;
  - `affectedRows` → `ejecutar()`;
  - `INSERT IGNORE` → `ON CONFLICT DO NOTHING`;
  - `UPDATE IGNORE` → `NOT EXISTS`;
  - `UTC_DATE()` → `HOY_UTC` / `INICIO_DIA_UTC`;
  - `FIELD()` → `array_position`;
  - `IN (?, ?…)` → `= ANY($1)`;
  - `HAVING` sin `GROUP BY` → subconsulta;
  - `ER_DUP_ENTRY` → código `23505`.
- **Mayúsculas**: MySQL comparaba el usuario y el correo sin distinguir mayúsculas (collation `_ci`). Ahora:
  - índices únicos sobre `lower()`;
  - búsquedas con `lower()` (login, alta, edición, `usuarioPorEmail`);
  - nombres de categorías y niveles con `lower()`;
  - `LIKE` → `ILIKE`;
  - `ADMIN_EMAILS` sin distinguir mayúsculas.
- **Arreglo de paso**: `eliminarNivel` comprobaba `usuarios.nivel_id`, una columna que no existe, así que siempre fallaba. Se quita esa comprobación.
- **Docker**:
  - `mysql-db` → `postgres-db` (Postgres 17, como Supabase), en `localhost:5433`;
  - volumen nuevo `postgres_data`. **El volumen de MySQL (`astrocode-api_mysql_data`) no se toca ni se borra.**
  - `npm run build` copia los `.sql` a `dist`.

## Pruebas automáticas

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ sin errores |
| `npm test` (unitarias) | ✅ 8/8 |
| `npm run e2e:docker` (pila aislada sobre Postgres) | ✅ **118/118**; la del sandbox comprueba que el código del alumno no llega a `postgres-db:5432` |

## Regresión: MySQL contra Postgres

Se levantaron dos pilas aisladas desde cero y se compararon tabla a tabla:
- `main`, con MySQL, en una copia aparte del repositorio;
- esta rama, con Postgres.

| Tabla | Filas | Diferencias |
|---|---|---|
| tareas (todas las columnas, `config` incluida) | 46 | 0 |
| tests_tarea | 68 | 0 |
| categorias / niveles / insignias / tiempos_finalizacion | 16 / 4 / 8 / 5 | 0 |
| migraciones de semillas aplicadas | 12 | 0 |

La primera comparación encontró que 4 tests tenían otro `id`, con el mismo contenido. La migración 005 recorría las copias de los retos diarios sin `ORDER BY`, y Postgres las devuelve en otro orden que MySQL. Se añadió `ORDER BY id` y la segunda comparación salió idéntica.

Más comprobaciones sobre la pila Postgres limpia:

| Prueba | Resultado |
|---|---|
| Enviar la solución de referencia de cada tarea | ✅ 46 de 46 superadas (igual que en la fase 7) |
| Enviar el código base de cada tarea | ✅ 0 de 46 superadas |
| Tres `aplicarMigraciones()` a la vez sobre una BD vacía | ✅ las tres terminan, 13 migraciones apuntadas una vez; 43 tareas y 68 tests |
| Transacción que crea una tabla y luego falla | ✅ la tabla no queda creada |
| Alta con `Usuario@Example.TEST` y login con el correo en minúsculas | ✅ entra |
| Alta con el mismo usuario en mayúsculas | ✅ «El usuario o email ya existe» |

## Pruebas manuales (pila aislada, web en :3100)

| Paso | Resultado |
|---|---|
| Crear cuenta | ✅ entra y muestra la bienvenida |
| Mapa | ✅ planetas, reto diario «Validar Paréntesis» (+1000 pts) y constelación de Mercurio |
| Ejercicio 1: escribir `edad = 25` y ejecutar | ✅ «¡Ejercicio superado!», +100 pts, tiempo 00:00:07; los acentos se ven bien |
| Perfil | ✅ 100 puntos, 1 ejercicio resuelto, «desde el 30 de octubre de 2026», estrella encendida |

## A tener en cuenta

- Al arrancar la pila real con esta rama, la base de datos local empieza **de cero** en Postgres: tus cuentas y tu progreso siguen en el volumen de MySQL, pero la API ya no lo lee. Si se quieren traer, hace falta un script de copia aparte.
- El despliegue (Supabase + Vercel) es el paso siguiente. Esta fase solo deja la API lista para Postgres.
