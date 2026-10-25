# Plan de pruebas — Fase 0 (base común)

Ramas: `feature/fase-0-base` en Astrocode-API y Astrocode-web. Requisitos en `docs/ROADMAP.md` (RF-0.x).

## Cómo ejecutarlas

```bash
# API: pruebas unitarias
npm test

# API: pruebas e2e contra un stack aislado en Docker (proyecto astrocode-e2e, con IA falsa)
npm run e2e:docker

# Web: tipos y build de producción
cd client && npx tsc --noEmit && npm run build
```

El CI de GitHub ejecuta todo esto en cada push.

## 1. Automáticas

| ID | Qué se comprueba | Requisito | Dónde |
|---|---|---|---|
| A1 | `clasificarError` y `tipoExcepcion` (10 tipos de traceback) | RF-0.8 | `test/unit/errores.test.mjs` |
| A2 | Cada envío crea un intento con su tipo de error, tests y segundos | RF-0.7 | `03-correccion-e-intentos` |
| A3 | Errores sin tests: `NameError`, `Timeout`, `SalidaIncorrecta` | RF-0.7, RF-0.8 | `03-correccion-e-intentos` |
| A4 | `misIntentos` solo devuelve los del propio usuario y exige sesión | RF-0.7 | `03-correccion-e-intentos` |
| A5 | Las tareas devuelven `tipo = codigo` | RF-0.10 | `01`, `03`, `04` |
| A6 | Regresión completa de la versión anterior: permisos, sandbox, tests ocultos, retos diarios, IA (31 pruebas) | — | `01` a `04` |
| A7 | El stack levanta con healthchecks y migraciones desde cero | RNF-0.2 | `npm run e2e:docker` |

## 2. Manuales (navegador, stack completo en Docker)

| ID | Pasos | Resultado esperado | Requisito |
|---|---|---|---|
| M1 | Sin sesión, abrir `/ejercicio/47` | Redirige a `/login` | RF-0.5 |
| M2 | Iniciar sesión desde M1 | Vuelve a `/ejercicio/47`, no a `/` | RF-0.5 |
| M3 | Abrir `/ejercicio/47` directamente o recargar la página | Carga «Validar Paréntesis» desde la API | RF-0.6, CA-0.1 |
| M4 | Escribir `x = 1 / print(x) / print(y)` y pulsar `Ctrl+Enter` | Se ejecuta y la línea 3 se marca en rojo | RF-0.2, RF-0.3, CA-0.2 |
| M5 | Escribir `def …:` + Enter + `if …:` + Enter | Sangría automática de 4 y 8 espacios; al editar desaparece la marca roja | RF-0.1 |
| M6 | Abrir el reto diario desde el dashboard; atrás y adelante en el navegador | La URL cambia a `/ejercicio/52`; atrás vuelve al dashboard y adelante al ejercicio | RF-0.4 |
| M7 | Como alumno, abrir `/admin` | Redirige a `/` | RF-0.5 |
| M8 | Abrir `/ranking` | Ranking completo | RF-0.4 |
| M9 | Abrir `/ejercicio/99999` y `/ruta-que-no-existe` | «No se ha encontrado este ejercicio» / redirige a `/` | RF-0.6 |
| M10 | Pedir una pista con la **IA real** de NVIDIA | Pista en español, sin solución, con negrita y código bien mostrados | — |
| M11 | Generar un ejercicio con la **IA real** (admin) | JSON válido y tests verificados en el sandbox | — |
| M12 | Cerrar sesión, entrar como admin y abrir `/admin` | Panel de admin accesible y sin restos en caché del usuario anterior | RF-0.5 |
| M13 | Migraciones sobre una **copia del volumen real** de MySQL | 001-009 aplicadas; usuarios, tareas, completadas y puntos intactos | RNF-0.2 |
| M14 | Reiniciar la API tras migrar | No vuelve a aplicar migraciones | RNF-0.2 |
| M15 | Abrir un ejercicio y mirar los recursos descargados | El editor llega en un chunk aparte, no en el bundle principal | RNF-0.1 |

## 3. Resultados (25-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A7 | ✅ 2/2 unitarias · 33/33 e2e | |
| M1 | ✅ | |
| M2 | ✅ tras corregir | Fallaba: la ruta `/login` redirigía a `/` antes que la redirección propia. Ahora hay un único punto de redirección. |
| M3 | ✅ | |
| M4 | ✅ | |
| M5 | ✅ | |
| M6 | ✅ | |
| M7 | ✅ | |
| M8 | ✅ | 12 filas |
| M9 | ✅ | |
| M10 | ✅ tras ajustar | Modelo `nvidia/nemotron-3-ultra-550b-a55b` (~5 s). El anterior, `llama-3.3-70b`, se retiró el 26-ago-2026 (410). Se desactiva el «razonamiento» para que responda rápido y no devuelva vacío. Se endureció el prompt de la pista de nivel 1 y la web interpreta **negrita** y `código`. |
| M11 | ✅ | 8 s; 5/5 tests válidos (3 ocultos, incluido el caso de la lista vacía) |
| M12 | ✅ | |
| M13 | ✅ | 10 usuarios, 28 tareas, 7 completadas y 12.219 puntos antes y después; 42 tests añadidos a los retos diarios |
| M14 | ✅ | 0 migraciones aplicadas tras reiniciar |
| M15 | ✅ | Carga diferida: el editor y CodeMirror solo se descargan al abrir un ejercicio |

## 4. Fuera de alcance / pendiente
- RF-0.9 (enlazar pistas con intentos) queda para la fase 4, donde se usa.
- **Bundle (RNF-0.1):** principal 146 KB comprimido (+12 KB por el router); editor en un chunk aparte de 157 KB que solo se descarga al abrir un ejercicio.
