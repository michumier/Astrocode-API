# Plan de pruebas — Fase 5.3 (🔐 Cámara acorazada)

Ramas: `feature/fase-5.3-camara` en Astrocode-API y Astrocode-web (salen de la 5.2). Diseño en `docs/diseno/fase-5-retos.md` §4.3.

Retos nuevos (migración `015_retos_camara`), cada uno con 2 escenarios visibles y 6 ocultos:

| Reto | Nivel | Categoría | Puntos | Mecánica |
|---|---|---|---|---|
| **🔐 La huella del PIN** | Fácil | Bucles | 150 | Fuerza bruta con hash SHA-256, con y sin lista de candidatos |
| **🔐 La cámara de Ceres** | Intermedio | Algoritmos de Búsqueda | 200 | Búsqueda binaria, con alarma a los `maximo.bit_length()` intentos |
| **🔐 La cerradura de combinación** | Difícil | Optimización | 300 | Deducción («exactos/descolocados»), 10 intentos |

## Cómo ejecutarlas

```bash
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -m unittest test_camara test_lengua test_bomba test_retos_motor test_motor test_misiones test_mutador test_trazador
npm test
npm run e2e:docker
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | `comparar` con el ejemplo del enunciado (`0123` contra `4271` → 0 exactos y 2 descolocados) y las 5.040 combinaciones | `test_camara.py` |
| A2 | Los 24 escenarios sembrados se generan de forma determinista. La lista del espía cumple: 300 + 1 candidatos con el PIN repetido, el PIN al principio cuando se pide, y 5 cifras | `test_camara.py` |
| A3 | Intentos de C2 = `maximo.bit_length()` (2, 1.000, un millón y mil millones) | `test_camara.py` |
| A4 | El material solo trae datos públicos (huella, candidatos, rango, intentos): nunca el PIN ni el secreto | `test_camara.py` y `11-retos-camara` |
| A5 | **Las tres soluciones abren los 24 escenarios sembrados**, incluidos los peores casos (PIN `0000`/`9999`, secreto 1, el máximo, mil millones y la combinación `9431`, que necesita 9 intentos) | `test_camara.py` (contenedor) |
| A6 | Sin `zfill`, la fuerza bruta falla con el PIN `0042`. Devolver el PIN como número explica el formato (`"0042"`) | `test_camara.py` (contenedor) |
| A7 | La fuerza bruta hace saltar la alarma en C2 (fallo del reto, no error de código) **y el visor recibe igualmente el historial completo** | `test_camara.py` (contenedor) |
| A8 | Historial de C2 con el rango posible tras cada intento: 500, 750, 625… 731, igual que el diseño | `test_camara.py` (contenedor) |
| A9 | Los valores no válidos (texto, fuera de rango, cifras repetidas, número en vez de texto) cuentan como intento | `test_camara.py` (contenedor) |
| A10 | Estrellas en C3: 9 intentos dan ⭐ y `0123` da ⭐⭐⭐. Las combinaciones posibles bajan 1.260 → 288 → 128 → 21 → 2 → 1. Probar al azar no abre | `test_camara.py` (contenedor) |
| A11 | El secreto de C3 no está en el proceso del alumno (`vars`/`dir` del objeto remoto) | `test_camara.py` (contenedor) |
| A12 | Por GraphQL: las tres cámaras con formato `camara`; las soluciones aprueban 8/8; la fuerza bruta salta la alarma en la cámara grande con 20 intentos de historial; C3 da ⭐ por el peor caso oculto (300 puntos sin bonus) | `11-retos-camara` |
| A13 | Regresión de las fases 0–5.2 | `01`–`10`, Python y unitarias |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | «La cámara de Ceres» con búsqueda binaria | El dial gira por 500 → 750 → … → 731, el indicador marca ▲ MAYOR / ▼ MENOR, las bombillas se apagan, la barra del rango se estrecha hasta «731 – 731 (1 número)» y la puerta se abre con el botín |
| M2 | La misma cámara con fuerza bruta en el escenario grande | 20 intentos (1, 2, 3… 20). La barra apenas se mueve («21 – 1.000.000»), la puerta queda en rojo de alarma y se revela el código |
| M3 | «La cerradura de combinación» con la solución | Tubos de neón con cada intento, fichas ●○ y «quedan N» bajando hasta 1. Abierta en 6/10 con ⭐⭐⭐ |
| M4 | «La huella del PIN» con el código base y luego con la solución | Con el código base: «0000 ✗ tu respuesta» y se revela el PIN. Con la solución, en «Sin pistas»: el rodillo frena en 8022, «Probados: 8023 / 10.000» y la puerta se abre |
| M5 | Pestaña «🏦 Cámaras» | Huella completa, número de candidatos (con los primeros desplegables), rango e intentos. Nunca el secreto |
| M6 | Móvil (375 px) | Sin desplazamiento horizontal; puerta y panel apilados |

## 3. Resultados (28-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A11 | ✅ 109/109 en Python (16 nuevas) | |
| A7 | ✅ tras corregir | Al saltar la alarma, el motor cortaba el escenario sin guardar el último fotograma y el visor no recibía el historial. Ahora el motor siempre añade el estado final si cambió (beneficia también a misiones cortadas por un error) |
| A12–A13 | ✅ 94/94 e2e (7 nuevas) | Unitarias 8/8; la web compila sin avisos nuevos |
| M1–M3, M5, M6 | ✅ tras mejorar | «(1 números)» → «(1 número)»; «1 descolocados» → «1 descolocado»; en la combinación se añade «quedan N» en cada intento para que se vea la deducción |
| M4 | ✅ tras corregir | Con una respuesta equivocada, el rodillo recorría hasta el PIN real y lo marcaba «COINCIDE», como si el código lo hubiera encontrado. Ahora el rodillo solo corre si se acierta; si no, muestra la respuesta del alumno con ✗ |

## 4. Notas
- C3 es exigente a propósito: la estrategia de referencia abre todas en ≤ 9, y para ⭐⭐⭐ hay que bajar a 7 en el peor caso (pide elegir mejor el siguiente intento).
