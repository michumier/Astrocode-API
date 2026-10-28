# Plan de pruebas — Fase 5.4 (🔍 Hay un impostor a bordo)

Ramas: `feature/fase-5.4-impostor` en Astrocode-API y Astrocode-web (salen de la 5.3). Diseño en `docs/diseno/fase-5-retos.md` §4.4.

Retos nuevos (migración `016_retos_impostor`), cada uno con 2 escenarios visibles y 6 ocultos:

| Reto | Nivel | Categoría | Puntos | Mecánica |
|---|---|---|---|---|
| **🔍 Sabotaje en el reactor** | Intermedio | Estructuras de Datos | 200 | Leer el registro en bruto con diccionarios (tarjeta → nombre, tarjeta → sala) |
| **🔍 El apagón** | Difícil | Grafos y Árboles | 300 | Deducir el grafo de la estación de las PUERTA y usar BFS para ver quién pudo ir y volver a tiempo |

## Cómo ejecutarlas

```bash
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -m unittest test_impostor test_camara test_lengua test_bomba test_retos_motor test_motor test_misiones test_mutador test_trazador
npm test
npm run e2e:docker
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | BFS con el ejemplo del diseño (comedor–hangar–laboratorio–reactor/puente) | `test_impostor.py` |
| A2 | Todas las líneas generadas cumplen la gramática documentada en el enunciado | `test_impostor.py` |
| A3 | Los 16 escenarios sembrados son deterministas, tienen entre 800 y 3.000 líneas y un único culpable | `test_impostor.py` |
| A4 | Culpable único en las semillas 0–299 de las dos variantes, resuelto con la solución de referencia sobre el propio log | `test_impostor.py` |
| A5 | Las trampas del reactor muerden: ignorar el DENEGADO o mirar el minuto en vez del orden da otra respuesta; un dron pasa por la sala antes de la alerta | `test_impostor.py` |
| A6 | Las trampas del apagón muerden: con `<` en vez de `<=` o sin las DENEGADO no sale el culpable; el pasillo trampa solo aparece con DENEGADO | `test_impostor.py` |
| A7 | El mapa deducido del log es exactamente la estación, y los movimientos respetan los 2 minutos por pasillo | `test_impostor.py` |
| A8 | Material: en I1 log + plano; en I2 solo el log (el mapa hay que deducirlo). Nunca el culpable | `test_impostor.py` y `12-retos-impostor` |
| A9 | Las soluciones resuelven los 16 escenarios con ⭐⭐⭐; los errores típicos fallan en los ocultos (`<` falla los 6 apagones ocultos) | `test_impostor.py` (contenedor) |
| A10 | Acusar a un inocente explica dónde estaba y en qué línea; tarjeta en vez de nombre, mayúsculas/espacios y tipos raros | `test_impostor.py` (contenedor) |
| A11 | El visor de I2 recibe las rutas de ida y vuelta de cada tripulante y solo el culpable «pudo» | `test_impostor.py` y `12-retos-impostor` |
| A12 | Por GraphQL: formato `impostor`, 8/8 con las soluciones, el código base no acusa a nadie | `12-retos-impostor` |
| A13 | Regresión de las fases 0–5.3 | `01`–`11`, Python y unitarias |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | «Sabotaje en el reactor», pestaña 📁 Expediente | Plano de la estación, log virtualizado con números de línea y colores por tipo; filtros por tipo, tarjeta y búsqueda; el ruido oculto al principio |
| M2 | Acusar a un inocente en «Turno de noche» | Plano oscurecido con foco en la sala del acusado, sello ACUSADO, «❌ X estaba en el … (línea N)»; el enlace abre el expediente en esa línea resaltada |
| M3 | Solución del reactor | «✅ Confesión obtenida», 8/8 al enviar |
| M4 | «El apagón» con la solución | Línea de tiempo apagón → crimen → recuento, grafo deducido con el pasillo «solo en DENEGADO» discontinuo, rutas animadas de cada tripulante terminando en el culpable, tabla con ✓/✗ |
| M5 | Expediente del apagón | Solo el log, sin plano, con la nota de que la estación se deduce |
| M6 | Móvil (375 px) | Sin desplazamiento horizontal de la página; el log se desplaza dentro de su caja |

## 3. Resultados (28-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A11 | ✅ 123/123 en Python (14 nuevas) | |
| A12–A13 | ✅ 101/101 e2e (7 nuevas) tras corregir | El código base devolvía «Vega», que justo era la culpable de un escenario visible: ahora devuelve «nadie» |
| M1, M5 | ✅ tras mejorar | Los filtros solo muestran los tipos que aparecen en el registro (en el reactor no hay ERROR, INFO ni RECUENTO) |
| M2 | ✅ | «Haddad estaba en el puente en la alerta (línea 525)»: el enlace abre «Turno de noche» en el expediente con la línea 525 resaltada y a la vista |
| M3 | ✅ | 8/8 con ⭐⭐⭐ |
| M4 | ✅ tras corregir | En estaciones alargadas (un camino de 6 pasillos) las salas del grafo se pisaban: el plano se ensancha según las capas y las capas de una sola sala van en zigzag. 8/8 con ⭐⭐⭐ |
| M6 | ✅ | 375 px sin desplazamiento horizontal; el log se desplaza dentro de su caja |

## 4. Notas
- Los motivos de los escenarios ocultos superados dicen el nombre del culpable, pero no dan ventaja: sus registros nunca se envían al navegador.
