# Plan de pruebas — Fase 5.2 (👽 Lengua alienígena)

Ramas: `feature/fase-5.2-lengua` en Astrocode-API y Astrocode-web (salen de la 5.1). Diseño en `docs/diseno/fase-5-retos.md` §4.2.

Retos nuevos (migración `014_retos_lengua`), cada uno con 3 ejemplos visibles y 6 rejillas ocultas:

| Reto | Nivel | Categoría | Puntos |
|---|---|---|---|
| **👽 El espejo** | Fácil | Arrays y Listas | 150 |
| **👽 La gravedad** | Intermedio | Arrays y Listas | 200 |
| **👽 Los lagos** | Difícil | Grafos y Árboles | 300 |

El enunciado **no dice la regla**: se descubre con los ejemplos.

## Cómo ejecutarlas

```bash
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -m unittest test_lengua test_bomba test_retos_motor test_motor test_misiones test_mutador test_trazador
npm test
npm run e2e:docker
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | Reglas de referencia: espejo; la gravedad conserva el orden; los ejemplos del diseño (lago cerrado y pared con hueco); en diagonal el agua no pasa | `test_lengua.py` |
| A2 | Generadores: deterministas; tamaños de 1 a 12; colores del 0 al 9. Cada rejilla enseña algo (la salida no es igual que la entrada, salvo en los casos límite donde no puede cambiar) | `test_lengua.py` |
| A3 | **Se generan los 27 escenarios sembrados** (visibles y ocultos), incluidos los extremos: 1 fila, 1 columna y 12×12 | `test_lengua.py` |
| A4 | **Ambigüedad (riesgo R3): los ejemplos visibles descartan las reglas trampa.** Espejo: voltear en vertical, girar 180° y no hacer nada. Gravedad: ordenar la columna, caer hacia arriba y caer por filas. Lagos: agua en diagonal y rellenar todo el interior | `test_lengua.py` |
| A5 | El material trae las parejas entrada → respuesta de los visibles | `test_lengua.py` |
| A6 | Las tres soluciones aprueban 40 rejillas cada una (lagos alternando la esquina diagonal) | `test_lengua.py` (contenedor) |
| A7 | Lagos con 8 vecinos falla en el ejemplo con la esquina abierta y marca las diferencias | `test_lengua.py` (contenedor) |
| A8 | Devolver la entrada dice cuántas celdas fallan («de 12»). Modificar la rejilla recibida no afecta a la corrección. Errores claros: no es una lista, filas de distinto largo, color «rojo» o 10, tamaño distinto. Las tuplas valen | `test_lengua.py` (contenedor) |
| A9 | Los tres retos con formato `lengua` en su nivel. El material da las 3 parejas visibles sin parámetros internos, y **el enunciado no menciona la regla** | `10-retos-lengua` |
| A10 | Un fallo en un visible marca las celdas distintas; la escena solo trae entrada y esperado | `10-retos-lengua` |
| A11 | Lagos en diagonal no aprueba (cae en el ejemplo 3). Las tres soluciones aprueban 9/9 con ⭐⭐⭐ y los ocultos no tienen escena | `10-retos-lengua` |
| A12 | Regresión de las fases 0–5.1 | `01`–`09`, Python y unitarias |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | «👽 Los lagos» → pestaña «🛸 Ejemplos» | 3 parejas Entrada ➜ Respuesta con la paleta, «🔢 Ver números» y leyenda de colores |
| M2 | «🛸 Traducir» con el código base | Tres rejillas (1 · Entrada, 2 · Tu resultado, 3 · Esperado). El resultado se pinta celda a celda, las 11 celdas distintas llevan borde magenta parpadeante y aparece «11 celdas distintas» con las métricas «Celdas correctas / Celdas en total» |
| M3 | «👽 El espejo» con la solución → «📡 Enviar» | «🛸 Los alienígenas te entienden», 9/9 y ⭐⭐⭐ |
| M4 | Móvil (375 px) | Sin desplazamiento horizontal y las parejas de ejemplos lado a lado |

## 3. Resultados (28-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A8 | ✅ 93/93 en Python (16 nuevas) | A4 pasó a la primera: los ejemplos elegidos ya descartaban las 8 reglas trampa |
| A3 | ✅ tras corregir | La gravedad de **una sola fila** no puede cambiar, y el generador buscaba un ejemplo que cambiara sin fin («No se pudo generar»). Ahora es un caso límite válido, y la nueva prueba A3 genera todos los escenarios sembrados para que no vuelva a pasar |
| A9–A12 | ✅ 87/87 e2e (5 nuevas) | Unitarias 5/5; la web compila sin avisos nuevos |
| M1 | ✅ tras mejorar | Panel de material más alto (440 px) |
| M2 | ✅ tras corregir | Las celdas erróneas medían 80 px: una regla global `.loading, .error { padding: 40px }` de `FullRanking.css` se aplicaba en toda la web (también afectaba al aviso de error de la caja negra). Se ha limitado a `.full-ranking`, la clase de las celdas pasa a ser `celda-mal` y la de la bomba, `fallo` |
| M3 | ✅ | |
| M4 | ✅ tras mejorar | Rejillas de ejemplo más pequeñas para que quepan lado a lado |

## 4. Fuera de alcance
- L4 (el objeto más grande) queda como [D]. El plan B de L3 («El mensaje cifrado») no hace falta de momento.
- Animación «🌊 Ver entrar el agua» tras aprobar los lagos: [D].
