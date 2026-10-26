# Plan de pruebas — Fase 2 (misiones de pilotaje)

Ramas: `feature/fase-2-pilotaje` en Astrocode-API y Astrocode-web. Requisitos en `docs/ROADMAP.md` (RF-2.x).

## Cómo ejecutarlas

```bash
# Simulaciones y mutador (cualquier sistema)
cd python-runner && python -m unittest test_misiones test_mutador

# Motor con procesos aislados (necesita Linux: dentro de la imagen del runner)
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -X dev -m unittest test_motor

# API
npm test
npm run e2e:docker
```

## 1. Automáticas

| ID | Qué se comprueba | Requisito | Dónde |
|---|---|---|---|
| A1 | Aterrizaje: sin motor se estrella; dos condiciones aterriza en 30 semillas × 3 gravedades; el proporcional consigue de media ≥2 estrellas; determinista; acciones válidas e inválidas; sin combustible no hay empuje | RF-2.1, RF-2.2 | `test_misiones.py` |
| A2 | Asteroides: la estrategia sencilla sobrevive en 30 semillas; quedarse quieto se estrella; generador con solución; determinista | RF-2.1, RF-2.2 | `test_misiones.py` |
| A3 | Cristales: BFS al más cercano lo recoge todo en 30 semillas; moverse al azar fracasa; mapa válido; chocar gasta movimiento | RF-2.1, RF-2.2 | `test_misiones.py` |
| A4 | Motor: detalle solo en escenarios visibles; estado entre ticks; `print` en el registro, acotado | RF-2.3 | `test_motor.py` |
| A5 | Errores legibles: sintaxis, sin `piloto`, `KeyError`, `None`, tipo erróneo, valor no serializable | RF-2.3 | `test_motor.py` |
| A6 | Bucle infinito en el piloto (<3 s) y al cargar el código | RNF-2.1, CA-2.4 | `test_motor.py` |
| A7 | **Seguridad:** importar el motor, escribir mensajes falsos en la salida o leer el canal del protocolo no altera la simulación | RNF-2.4, CA-2.5 | `test_motor.py` |
| A8 | Memorizar los empujes de un escenario no sirve en otro | CA-2.3 | `test_motor.py` y `06-misiones` |
| A9 | Las 3 misiones existen en su nivel; `Tarea.mision` sin semillas ni datos ocultos | RF-2.4, RF-2.8 | `06-misiones` |
| A10 | `probarMision`: exige sesión, solo vale para misiones, devuelve fotogramas, escena, métricas y registro | RF-2.5 | `06-misiones` |
| A11 | Enviar: los escenarios ocultos no dan fotogramas, escena, métricas ni motivo exacto | RF-2.4, RF-2.7 | `06-misiones` |
| A12 | Resuelta: correcta, estrellas = las del peor escenario, puntos con bonus por estrella; repetir no suma; intento registrado | RF-2.4 | `06-misiones` |
| A13 | Asteroides y cristales se resuelven con sus estrategias de referencia; acción inválida y `return` olvidado con mensaje claro | RF-2.1 | `06-misiones` |
| A14 | Pistas en misiones: la IA no recibe la solución hasta el nivel 3 | — | `06-misiones` |
| A15 | Regresión completa de las fases 0 y 1 | — | `01` a `05` |

## 2. Manuales (navegador, stack completo en Docker, IA real)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Dashboard → Tierra → «🚀 Aterrizaje de emergencia» → Comenzar | Etiqueta «🚀 Misión» en la lista; se abre la vista de misión con los escenarios Marte y Luna |
| M2 | Lanzar el código inicial | La nave cae, panel de datos y combustible, explosión y «💥 La nave se ha estrellado» |
| M3 | Lanzar una solución de dos condiciones en Luna | Llama del motor, gráfica de altura y velocidad, ⭐⭐⭐ |
| M4 | Registro de vuelo y línea de tiempo | Los `print` del alumno por tick; se resaltan los ya pasados; avanzar, pausar y velocidad |
| M5 | Enviar | 5/5, estrellas, puntos con bonus y ventana «¡Misión cumplida!»; los ocultos no se pueden abrir |
| M6 | Asteroides con la estrategia de carril libre | Rocas acercándose, maniobras y mínimo posible |
| M7 | Cristales con BFS | Mapa con rocas, cristales, estela y movimientos frente al óptimo |
| M8 | Móvil (375 px) | La vista se apila, sin scroll horizontal |
| M9 | Pista con la IA real en una misión | Orienta sin dar la estrategia |
| M10 | Migraciones 001-012 sobre una copia del volumen real | Aplicadas; 3 misiones creadas; datos intactos |

## 3. Resultados (26-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A8 | ✅ 32/32 Python (dentro del contenedor, sin avisos de recursos) | Se arregló una fuga de descriptores: el motor no cerraba las tuberías del proceso del piloto. |
| A9–A15 | ✅ 58/58 e2e | |
| M1 | ✅ | |
| M2 | ✅ tras corregir | El visor fallaba al arrancar: la marca de tiempo del primer fotograma de `requestAnimationFrame` puede ser anterior al arranque, el intervalo salía negativo y el índice -1. |
| M3 | ✅ tras corregir | Aviso «ResizeObserver loop»: al cambiar la altura del canvas cambiaba el contenedor y se volvía a disparar. Ahora solo reacciona al ancho. |
| M4 | ✅ | |
| M5 | ✅ | 188 puntos (150 + 25 % por la segunda estrella). Se cambió un texto que prometía que las estrellas salían en el ranking (no es así). |
| M6 | ✅ | 10 maniobras frente a un mínimo de 9 |
| M7 | ✅ | 21 movimientos = óptimo |
| M8 | ✅ tras corregir | En pantallas bajas la nave quedaba tapada por el panel de datos al principio del vuelo. |
| M9 | ✅ tras corregir | En nivel 1 la IA daba casi la estrategia completa (`max(..., key=...)`), porque recibía la solución. Ahora no la recibe hasta el nivel 3 y sabe que es una misión de pilotaje. |
| M10 | ✅ | 10 usuarios, 28 tareas de código, 7 completadas y 12.219 puntos antes y después; 3 misiones nuevas |

## 4. Decisiones y cambios respecto al plan
- **Física del aterrizaje ajustada por simulación** (consumo 5/s): sin motor se estrella siempre, un umbral simple casi nunca funciona y dos condiciones aterrizan el 100 % de las veces. Estrellas por combustible restante: ≥40 % ⭐⭐ y ≥60 % ⭐⭐⭐.
- **Asteroides y cristales:** el generador exige que el escenario tenga solución y que la estrategia sencilla esperada (carril vecino con más espacio, o BFS al cristal más cercano) funcione **solo con lo que ven los sensores**.
- **El aterrizaje está en el nivel 1** (Mercurio, Venus y Tierra) para que cualquiera pueda probarlo; asteroides en el nivel 2 y cristales en el 3. Como los planetas de un mismo nivel comparten la lista, el aterrizaje sale en los tres primeros y los asteroides en Marte y Júpiter.
- **Estrellas de la misión = las del peor escenario.** Cada estrella por encima de la primera suma un 25 % de bonus la primera vez.
- RF-2.11 y RF-2.12 (récords y vuelos fantasma) quedan para más adelante.

## 5. Limitaciones conocidas
- El motor necesita Linux (`select` sobre tuberías y límites de recursos): funciona en Docker, que es como se ejecuta siempre.
- La variante con `prefers-reduced-motion` (sin parpadeos ni partículas) está implementada, pero no se ha probado visualmente.
