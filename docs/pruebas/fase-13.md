# Plan de pruebas — Fase 13 (🧩 Contenido completo)

Ramas `feature/fase-13-contenido` en Astrocode-API y Astrocode-web. **La API se fusiona antes que la web.**

## Qué cambia

### Contenido

- **12 lecciones nuevas** (`src/db/seeds/leccionesFase13.ts`), con el mismo formato que las de la fase 12:

  | Planeta | Lecciones |
  |---|---|
  | Marte | def desde cero · return no es print · diccionarios · texto (split, join, upper, in) |
  | Júpiter | comprensiones · listas de diccionarios · sorted, key y lambda · búsqueda binaria |
  | Saturno | recursión · clases y objetos · rejillas y búsqueda en anchura · descartar posibilidades |

  En total hay **28 lecciones**.

- **6 ejercicios nuevos** (`src/db/seeds/ejerciciosNuevos.ts`): los huecos del temario. Cada uno con solución, un test visible y tests ocultos.

  | Ejercicio | Planeta | Practica |
  |---|---|---|
  | Informe de despegue | Mercurio (final) | variables, conversión, `//`, `%` y f-strings |
  | Semáforo de la plataforma | Venus | `elif` |
  | Repostaje hasta llenar | Tierra | `while` |
  | Inventario de la bodega | Marte | diccionarios en funciones |
  | Cuenta atrás recursiva | Saturno | recursión, con un test oculto «Sin bucles» |
  | Tu propia nave | Saturno | clases, `__init__` y métodos |

- **«Qué practicas» y «por qué»** de los 44 ejercicios de la ruta:
  - los 38 que ya existían, en `src/db/seeds/porques.ts`;
  - los 6 nuevos, en su propia semilla.

### API

- **Migración `024_ruta_completa`**:
  - columnas `tareas.practica` y `tareas.porque`;
  - las 12 lecciones y los 6 ejercicios, con sus tests, en sus pasos de la ruta;
  - los «por qué»;
  - las lecciones anteriores a ejercicios ya hechos cuentan como vistas, sin puntos.
- **GraphQL**: `Tarea.practica`, `Tarea.porque` y `Tarea.leccionRepaso` (la lección más cercana antes de ese ejercicio en su planeta).

### Web

- **`PorQue`**, encima del enunciado de ejercicios, retos y misiones:
  - «Practicas: …» y «Por qué: …»;
  - el botón «Repasar la lección: …»;
  - no sale en los sabotajes ni en los retos diarios.

## Pruebas automáticas

| Prueba | Resultado |
|---|---|
| API: `npx tsc --noEmit` | ✅ |
| API: `npm test` | ✅ **53/53** |
| API: `npm run e2e:docker`, con 5 nuevas en `18-ruta-completa` y la ruta adaptada | ✅ **134/134** |
| Web: `npx tsc --noEmit` | ✅ |
| Web: pruebas, con 2 de `PorQue` | ✅ **52/52** |
| Web: `CI=true react-scripts build` | ✅ sin avisos |

Las 53 unitarias incluyen:
- **Las 28 lecciones**: se ejecuta cada ejemplo y cada pregunta, y se comprueba que la opción correcta es lo que imprime.
- **Los 6 ejercicios nuevos**, corregidos igual que en la API:
  - la solución imprime el resultado esperado y pasa todos los tests;
  - el código base no supera el ejercicio;
  - cada uno lleva su «por qué».
- Ningún paso choca con otro en la ruta.

En las pruebas de Python hay dos detalles:
- se ejecutan con `-X utf8`, porque con `-I` Python ignora `PYTHONIOENCODING` y en Windows cambiaba los acentos;
- los ejercicios se ejecutan desde un `main.py`, como en el runner, porque «Sin bucles» usa `inspect.getsource`.

Las e2e comprueban:
- **La ruta completa**:
  - 28 lecciones y 44 ejercicios;
  - Mercurio 5 + 5, Venus 7 + 5, Tierra 9 + 6, Marte 6 + 4, Júpiter 10 + 4 y Saturno 7 + 4;
  - conquistar Mercurio exige ahora también el Informe de despegue.
- **Los «por qué»**: los 44 ejercicios tienen «qué practicas» y «por qué».
- **La lección de repaso**:
  - #1 enlaza «Variables»;
  - #21 enlaza «Comprensiones»;
  - los retos diarios no enlazan ninguna.
- **Los 6 ejercicios nuevos** están en su planeta.
- **«Cuenta atrás recursiva» en el runner real** (con el aislador): una versión con `for` falla el test oculto «Sin bucles», y la recursiva supera todos.

## Pruebas manuales

En la pila aislada, web en :3100, con una cuenta admin local para llegar a Marte y Saturno sin candados:

| Paso | Resultado |
|---|---|
| Ruta de Marte | ✅ def · return · #5 · #20 · diccionarios · Inventario de la bodega · texto · #9 · #71 · #58 |
| Inventario de la bodega | ✅ «Practicas / Por qué» encima del enunciado y «Repasar la lección: Diccionarios: datos con nombre» (→ /leccion/19) |
| Bomba de cables (reto) | ✅ su «por qué» y la lección «Texto a fondo» |
| Lección «Clases y objetos» (Saturno) | ✅ un ejemplo y las opciones `7 1` / `8 8` / `4 1` |

## Despliegue

- La migración 024 se aplica sola en el primer arranque de la API en Vercel.
- Orden: fusionar la API, comprobar que la ruta tiene 28 lecciones y fusionar la web.
- Mercurio gana un paso, el Informe de despegue. A quien ya lo había conquistado se le respeta la conquista: el planeta sigue conquistado y Venus abierto.
