# Plan de pruebas — Fase 5.0 (motor de retos)

Ramas: `feature/fase-5.0-motor-retos` en Astrocode-API y Astrocode-web. Diseño en `docs/diseno/fase-5-retos.md` (§2 y §3).

La 5.0 no trae retos para alumnos: deja listo el motor y la pantalla común. Para probarlo de punta a punta hay un reto interno, **`diagnostico`** («🧪 Calibración»), que solo se siembra con `RETOS_DE_PRUEBA=1`. Ese valor está activo en e2e y en la pila de prueba manual, y **nunca** en la base de datos de desarrollo.

## Cómo ejecutarlas

```bash
# Motor con procesos reales (necesita Linux: dentro de la imagen del runner)
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -m unittest test_retos_motor test_motor test_misiones test_mutador test_trazador

# API
npm test
npm run e2e:docker

# Navegador sin tocar la BD de desarrollo: web en :3100, API en :4100
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Diseño | Dónde |
|---|---|---|---|
| A1 | **E1 + E2:** la función se llama `calibrar` y recibe argumentos posicionales. Un tick por pareja y fotogramas por tick | §2.1 | `test_retos_motor.py` |
| A2 | Los errores nombran la función del reto («No has definido la función `calibrar`», «¿Hay un bucle infinito en calibrar()?»). Las misiones conservan sus mensajes | §2.1 | `test_retos_motor.py`, `test_motor.py` |
| A3 | **E3, lotes:** 48×48 = 2.304 llamadas, correctas y en menos de 1 s | §2.1, R1 | `test_retos_motor.py` |
| A4 | Un error dentro de un lote dice con qué argumentos (`calibrar(3, 2)` + `ZeroDivisionError`). Las respuestas con forma errónea dan un motivo claro | §2.1 | `test_retos_motor.py` |
| A5 | **E4, consultas:** la búsqueda binaria abre un rango de un millón en ≤ 20 intentos y los `print` hechos entre consultas llegan al registro | §2.1 | `test_retos_motor.py` |
| A6 | La fuerza bruta hace saltar la alarma, y eso es un fallo del reto, no un error del código. Capturar `Alarma` no sirve para aprobar | §4.3 | `test_retos_motor.py` |
| A7 | Consultas: una excepción dentro de la función, ninguna consulta, un método inexistente y argumentos de más dan cada uno un mensaje legible | §4.3 | `test_retos_motor.py` |
| A8 | **El secreto no está en el proceso del alumno:** `vars()` y `dir()` de la sonda no lo muestran, y tampoco está en la escena ni en los fotogramas | §2.3, R4 | `test_retos_motor.py` |
| A9 | **E5, material público:** solo trae datos públicos, es determinista (misma semilla ⇒ mismo material) y una misión desconocida da error | §2.1, R8 | `test_retos_motor.py` |
| A10 | Los escenarios ocultos no devuelven fotogramas ni registro. Los fotogramas de más de 2 MB se recortan y conservan el primero y el último | §2.1, R6 | `test_retos_motor.py` |
| A11 | `tipo='reto'` y `formato` en la lista de tareas. `Tarea.mision` da la función y el material **solo de los visibles**, sin semillas, parámetros ni datos de los ocultos | §2.2, §2.3 | `08-retos-motor` |
| A12 | Las misiones de pilotaje siguen igual: formato `pilotaje`, función `piloto` y sin material | R2 | `08-retos-motor` |
| A13 | `probarMision` y `enviarSolucion` con un reto: puntos con estrellas. De los ocultos no sale ni detalle ni el motivo del fallo | §2.2 | `08-retos-motor` |
| A14 | Lotes y consultas por GraphQL: la rejilla de 48×48 aprueba, la binaria aprueba y la fuerza bruta salta la alarma | §2.1 | `08-retos-motor` |
| A15 | La caja negra rechaza los retos; `probarMision` rechaza las tareas normales | §2.4 | `08-retos-motor` |
| A16 | Regresión completa de las fases 0–3 | R2 | `01`–`07`, Python y unitarias |

## 2. Manuales (navegador, pila aislada en :3100)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Planeta Tierra | Los retos de calibración llevan la etiqueta «🧪 Calibración» y el aterrizaje sigue con «🚀 Misión» |
| M2 | Abrir «🧪 Calibración: consultas» | Pestañas «📜 Reto» y «🧪 Datos de calibración». El material solo muestra los 2 escenarios visibles (mil y un millón). La etiqueta del formato aparece en la cabecera |
| M3 | Escribir una búsqueda binaria → «▶ Probar» | Visor genérico con el historial de consultas, métricas «Intentos 9 · Límite 10» y registro con cada `print` |
| M4 | «📡 Enviar» | 4/4 escenarios, modal «🎉 ¡Reto superado!» con ⭐⭐⭐ y 15 puntos; los ocultos aparecen con 🔒 |
| M5 | Abrir «🚀 Aterrizaje de emergencia» y lanzar | Igual que antes: briefing, «🚀 Lanzar», visor con la nave y métricas |
| M6 | Móvil (375 px) en un reto | Una columna, sin desplazamiento horizontal |

## 3. Resultados (28-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A10 | ✅ 62/62 en Python (18 nuevas) | **Rendimiento: el lote de 48×48 tarda 0,14 s** (el objetivo era < 1 s). La nebulosa puede usar 48×48 sin reducirlo |
| A2 | ✅ tras corregir | El mensaje de las misiones había cambiado a «función `piloto`»; se recuperó «`piloto(sensores)`» |
| A11 | ✅ tras corregir | La lista de tareas no leía la columna `config`, así que `formato` llegaba vacío al mapa |
| A13 | ✅ tras corregir | La calibración daba 1 estrella; los retos dan ⭐⭐⭐ al aprobar (diseño §4.x) |
| A11–A16 | ✅ 74/74 e2e (8 nuevas) | Unitarias 5/5. El build de la web compila sin avisos nuevos |
| M1–M6 | ✅ | |

## 4. Fuera de alcance de la 5.0
- Visores y materiales propios de cada formato: llegan con cada subfase (5.1 bomba…). Hasta entonces se usan el visor y el material genéricos.
- Caja negra en los retos ([D] en el diseño): de momento la API la rechaza con un mensaje claro.
