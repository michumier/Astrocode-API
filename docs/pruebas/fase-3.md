# Plan de pruebas — Fase 3 (caja negra)

Ramas: `feature/fase-3-caja-negra` en Astrocode-API y Astrocode-web. Requisitos en `docs/ROADMAP.md` (RF-3.x).

## Cómo ejecutarlas

```bash
# Trazador con procesos reales (necesita Linux: dentro de la imagen del runner)
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -X dev -m unittest test_trazador

# API
npm test
npm run e2e:docker
```

## 1. Automáticas

| ID | Qué se comprueba | Requisito | Dónde |
|---|---|---|---|
| A1 | Bucle `for`: líneas en orden, `total` cambia 0→1→3→6→10, la salida acumulada aparece tras el `print` | RF-3.1, CA-3.1 | `test_trazador.py` |
| A2 | Recursión: la pila crece hasta 5 niveles y decrece; los `return` devuelven 1, 2, 6 y 24; las funciones no salen como variables | RF-3.1, CA-3.2 | `test_trazador.py` |
| A3 | `while True` se corta en 1000 pasos, sin colgarse | RF-3.3, CA-3.3 | `test_trazador.py` y `07-caja-negra` |
| A4 | Excepción marcada en su paso y en el error; error de sintaxis sin pasos | RF-3.7 | `test_trazador.py` |
| A5 | Serializador: objetos con atributos, ciclos, listas de 500 recortadas a 50, diccionarios, textos de 1000 recortados | RF-3.2 | `test_trazador.py` |
| A6 | Un `__repr__` roto no tumba la traza; un `print` con JSON falso no rompe la respuesta | RF-3.2, RNF-3.2 | `test_trazador.py` |
| A7 | `input()` con stdin; test externo que llama a las funciones del alumno (solo se registran sus líneas) | RF-3.4 | `test_trazador.py` |
| A8 | La traza no supera ~1 MB; sin variables de entorno del servidor | RNF-3.1, RNF-3.2 | `test_trazador.py` |
| A9 | `trazarEjecucion` y `trazarTest` exigen sesión; `trazarTest` solo con tests visibles y no en misiones | RF-3.4 | `07-caja-negra` |
| A10 | `trazarTest` ejecuta el test visible contra el código del alumno y se ve la llamada con sus argumentos | RF-3.4 | `07-caja-negra` |
| A11 | Regresión completa de las fases 0, 1 y 2 | — | `01` a `06` y Python |

## 2. Manuales (navegador, stack completo en Docker)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Escribir un bucle con una lista → «🔭 Ver ejecución» → avanzar con → | Línea activa en verde; `total` destacada al cambiar; salida vacía hasta el `print`; en el último paso, la salida completa |
| M2 | Enviar una solución con un fallo → «Tests visibles que fallan» → «🔭 Ver qué pasó» | La traza del test `es_valido("(]")` muestra la pila con `'('` y `']'` y cómo devuelve `True` |
| M3 | Recursión que divide entre cero → «Ver ejecución» | Se abre directamente en el paso de la excepción (línea 3 en rojo), pila de 4 llamadas más el programa principal, botón «Ir al error» |
| M4 | Diccionario con una lista que se ordena | Diccionario con claves → valores, lista en compartimentos con índices y variable destacada al cambiar |
| M5 | Móvil (375 px) | Una sola columna, sin desbordamiento |

## 3. Resultados (26-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A8 | ✅ 12/12 (44/44 en total en Python) | La suite tarda ~1,3 s, muy lejos de los 3 s del RNF-3.1 |
| A9–A11 | ✅ 66/66 e2e | |
| M1 | ✅ tras mejorar | El último paso mostraba «↩ devuelve None» (el fin del programa principal). Ahora muestra «🏁 fin del programa» y, en las funciones, «↩ f() devuelve …». |
| M2 | ✅ tras mejorar | La salida que imprime el test (después de llamar a la función) no aparecía: ahora el último paso muestra la salida completa. |
| M3 | ✅ | |
| M4 | ✅ | |
| M5 | ✅ | |

## 4. Fuera de alcance
- RF-3.8 (flechas de aliasing entre variables que apuntan al mismo objeto): el serializador ya guarda el `id` de listas, diccionarios y objetos para poder hacerlo más adelante.
