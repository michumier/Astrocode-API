# Plan de pruebas — Fase 12 (📘 Lecciones)

Ramas `feature/fase-12-lecciones` en Astrocode-API y Astrocode-web. **La API se fusiona antes que la web.**

## Qué cambia

### Contenido

**16 lecciones** en `src/db/seeds/lecciones.ts`, con el formato aprobado en `docs/TEMARIO.md`:
- explicación;
- un ejemplo ejecutable con su «Pruébalo»;
- el error típico;
- una pregunta «¿qué imprime?» con 3 opciones, cada una con la explicación de por qué es o no es.

| Planeta | Lecciones |
|---|---|
| Mercurio | print y comentarios · variables · tipos y f-strings · operadores · convertir tipos |
| Venus | comparar y booleanos · if/else · elif · and/or/not · rellenar una función |
| Tierra | listas · for y range · contadores · while y break · append y tuplas · listas de listas y rebanadas |

Cada lección ocupa su número de paso del temario, entre los ejercicios.

### API

- **Migración `023_lecciones`**:
  - tablas `lecciones` y `lecciones_usuarios` (fallos, fecha de completada y puntos), con RLS;
  - clave foránea y unicidad en `ruta_pasos.leccion_id`;
  - inserta las 16 lecciones en la ruta;
  - las lecciones anteriores a un ejercicio que el alumno ya hizo cuentan como vistas, sin puntos.
- **Ruta**: las lecciones son pasos como los demás.
  - `calcularRuta` recibe las lecciones leídas.
  - `bloqueoDePaso` sirve para tareas y lecciones.
  - `conquistarSiCompleto` exige también las lecciones.
- **GraphQL**:
  - `leccion(id)` devuelve el contenido, la pregunta **sin la respuesta**, si está completada y el paso siguiente;
  - `responderLeccion(leccionId, opcion)` corrige en el servidor;
  - `PasoRuta.leccion`.
- **Puntos**:
  - +10 al acertar y +5 más si es a la primera;
  - una sola vez, aunque lleguen dos aciertos a la vez (`completada_el IS NULL` en el `UPDATE`);
  - fallar apunta el fallo y no completa la lección.

### Web

- **Pantalla `/leccion/:id`** (`views/leccion/VistaLeccion.tsx`):
  - el texto, con el mismo formato que los enunciados;
  - ejemplos editables con «Ejecutar» (`executeCode`) y «Volver al original»;
  - la pista «Pruébalo»;
  - el error típico, con el código resaltado;
  - la pregunta con opciones A/B/C, explicación al responder y opción fallada desactivada;
  - «Siguiente: …» al paso que viene, sea lección o ejercicio;
  - la conquista del planeta, si toca;
  - los puntos de la barra se refrescan al responder.
- **Ruta**: el panel del planeta muestra las lecciones con su icono, «hasta 15 pts» y el filtro «Lecciones». La constelación las incluye como estrellas.
- **«Siguiente estrella»** del mapa lleva a la lección si es lo que toca.

## Pruebas automáticas

| Prueba | Resultado |
|---|---|
| API: `npx tsc --noEmit` | ✅ |
| API: `npm test` | ✅ **34/34** |
| API: `npm run e2e:docker`, con 5 nuevas en `17-lecciones` y la ruta adaptada | ✅ **129/129** |
| Web: `npx tsc --noEmit` | ✅ |
| Web: pruebas, con 4 de `VistaLeccion` y lecciones en la ruta | ✅ **50/50** |
| Web: `CI=true react-scripts build` | ✅ sin avisos |

Las 34 unitarias incluyen:
- 18 que **ejecutan el contenido**: cada ejemplo corre sin errores; la opción correcta es exactamente lo que imprime el código de la pregunta y las otras no; cada opción tiene su explicación; ninguna lección choca con un ejercicio en la ruta;
- una nueva de `calcularRuta` con lecciones.

Las e2e comprueban:
- **Ruta**: Mercurio pasa a tener 9 pasos (lección, lección, ejercicio…), Venus 11 y la Tierra 14. Conquistar Mercurio exige las 5 lecciones y los 4 ejercicios, y el bonus llega con el último paso.
- **Lecciones**:
  - la consulta no delata la respuesta;
  - a la primera dan 15 puntos y repetir da 0;
  - tras un fallo, la explicación y luego 10 puntos;
  - la segunda lección está cerrada hasta completar la primera;
  - una opción inexistente se rechaza y sin sesión no se puede responder.

## Pruebas manuales (pila aislada con candados, web en :3100)

| Paso | Resultado |
|---|---|
| Cuenta nueva → «Siguiente estrella» | ✅ abre `/leccion/1`, «Tu primer programa: print y comentarios» |
| «Ejecutar» en el ejemplo | ✅ `Iniciando sistemas...`, `Motores listos`, `7` |
| Responder B (mal) | ✅ «No es esa» con la explicación del comentario; B queda desactivada |
| Responder A | ✅ «¡Correcto! +10 pts» y «Siguiente: Variables: cajas con nombre» |
| Barra de puntos | ❌ seguía en 0 → **arreglado**: se refresca al responder (10 pts al pasar a la lección 2) |
| Lección 2, A a la primera | ✅ «¡Correcto! +15 pts», barra en 25 pts, «Siguiente: Variables espaciales básicas» (el ejercicio) |
| Panel de Mercurio | ✅ «2 de 9 hechos», filtros «Lecciones · 5 / Ejercicios · 4», las dos lecciones hechas, el ejercicio 3 con «Empezar» y el resto con candado |

## Despliegue

- La migración 023 se aplica sola en el primer arranque de la API en Vercel.
- Orden: fusionar la API, comprobar que responde a `{ ruta { pasos { leccion { id } } } }` y fusionar la web.
- Las cuentas con ejercicios hechos verán como vistas las lecciones anteriores a ellos, sin puntos.
