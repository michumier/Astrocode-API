# Plan de pruebas — Fase 5.5 (🎨 Pinta la nebulosa)

Ramas: `feature/fase-5.5-nebulosa` en Astrocode-API y Astrocode-web (salen de la 5.4). Diseño en `docs/diseno/fase-5-retos.md` §4.5.

Retos nuevos (migración `017_retos_nebulosa`), cada uno con 2 lienzos visibles (48×48 y 64×32) y 4 ocultos de otros tamaños (25×60, 80×40, 100×64 o 37×37, y uno de 61×1):

| Reto | Nivel | Categoría | Puntos | Imagen | Éxito |
|---|---|---|---|---|---|
| **🎨 La bandera de Kepler** | Fácil | Estructuras Condicionales | 150 | Tres franjas verticales (morado, naranja, morado) con un sol amarillo en el centro | 100 % de los píxeles |
| **🎨 Los anillos de Saturno** | Intermedio | Operadores | 200 | Planeta naranja con anillos elípticos alternos (cian y azul) y una luna arriba a la derecha | ≥ 97 % (⭐⭐⭐ con el 100 %, ⭐⭐ con el 99 %) |

El alumno escribe `color(x, y, ancho, alto)`; el motor la llama una vez por píxel en lotes de 512 (ampliación E3). Las imágenes objetivo usan aritmética entera (coordenadas dobladas o cuadruplicadas para medir desde el centro del píxel), así que una solución con decimales coincide exactamente. La luna rompe la simetría vertical: si el eje Y se interpreta al revés, se nota enseguida.

## Cómo ejecutarlas

```bash
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -m unittest test_nebulosa test_impostor test_camara test_lengua test_bomba test_retos_motor test_motor test_misiones test_mutador test_trazador
npm test
npm run e2e:docker
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | Colores por nombre (sin distinguir mayúsculas ni espacios) o por número 0–9; el resto no vale | `test_nebulosa.py` |
| A2 | Puntos de control de las dos imágenes (franjas, sol, planeta, luna arriba a la derecha) | `test_nebulosa.py` |
| A3 | **Las soluciones con decimales coinciden exactamente** con el objetivo en los 12 lienzos sembrados | `test_nebulosa.py` |
| A4 | El material trae el objetivo de cada lienzo visible | `test_nebulosa.py` y `13-retos-nebulosa` |
| A5 | Las soluciones superan los 12 escenarios con 100 % y ⭐⭐⭐, incluido el lienzo de un píxel de alto | `test_nebulosa.py` (contenedor) |
| A6 | **Rendimiento:** un lienzo de 48×48 (2.304 llamadas) tarda menos de 1 s (riesgo R1) | `test_nebulosa.py` (contenedor) |
| A7 | Errores típicos: x por y, tamaño fijo 48×48 (aprueba el visible y falla en los ocultos), luna abajo | `test_nebulosa.py` y `13-retos-nebulosa` |
| A8 | Sin la luna los anillos aprueban (≥ 97 %) pero no dan ⭐⭐⭐ | `test_nebulosa.py` (contenedor) |
| A9 | Un color no válido dice en qué píxel: `color(3, 2, 48, 48) devolvió 'rosa'` | `test_nebulosa.py` (contenedor) |
| A10 | Los fotogramas van pintando por lotes (0 → 512 → … → 2.304) | `test_nebulosa.py` (contenedor) |
| A11 | Por GraphQL: formato `nebulosa`, 6/6 con las soluciones, el código base explica cuánto coincide | `13-retos-nebulosa` |
| A12 | Regresión de las fases 0–5.4 | `01`–`12`, Python y unitarias |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Pestaña 🎯 Objetivos de la bandera | Las dos imágenes objetivo, coordenadas y color al pasar el ratón, y leyenda de la paleta |
| M2 | Pintar con el código base | Objetivo y «Tu nebulosa» lado a lado; la imagen se imprime fila a fila con una línea de luz; barra de coincidencia (31,3 %) |
| M3 | «Ver diferencias» y pasar el ratón | Los píxeles erróneos en magenta; «(x, y) · tú: … · objetivo: …» |
| M4 | Solución de los anillos y enviar | 6/6 con ⭐⭐⭐ y el aviso «🎨 ¡Nebulosa pintada!» |
| M5 | Móvil (375 px) | Sin desplazamiento horizontal; los dos lienzos caben uno al lado del otro |

## 3. Resultados (28-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A10 | ✅ 135/135 en Python (12 nuevas) | El lienzo de 48×48 se pinta en menos de 1 s |
| A11–A12 | ✅ 107/107 e2e (6 nuevas) | |
| M1 | ✅ tras corregir | El borde del marco hacía que la pestaña desbordara 2 px en horizontal (`box-sizing: border-box`) |
| M2 | ✅ tras mejorar | Las métricas «pixeles» y «porcentaje» salían con el nombre interno: ahora «Píxeles en total» y «Coincidencia (%)». El motivo decía «hace falta todos los píxeles»: ahora «hace falta acertarlos todos» |
| M3 | ✅ | «(x=23, y=23) · tú: negro · objetivo: amarillo»; los píxeles erróneos, en magenta |
| M4 | ✅ | 6/6 con ⭐⭐⭐ |
| M5 | ✅ | 375 px de ancho de página; lienzos de 149 px |
