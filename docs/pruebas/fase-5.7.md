# Plan de pruebas — Fase 5.7 (🧬 La colonia)

Ramas: `feature/fase-5.7-colonia` en Astrocode-API y Astrocode-web (salen de la 5.6). Diseño en `docs/diseno/fase-5-retos.md` §4.7.

Reto nuevo (migración `019_retos_colonia`): **🧬 Terraformación** · Intermedio · Funciones · 200 puntos · 2 mapas visibles y 4 ocultos.

El alumno escribe `regla(viva, vecinas)` → True/False. El motor la llama con las 18 entradas posibles (dos veces cada una, para comprobar que es pura), construye la tabla y simula él solo 40 generaciones en un mapa de 24×24. La colonia tiene que cubrir **entera** la zona verde sin tocar **nunca** la base.

**Cómo se hizo resoluble pero no trivial (riesgo R7):** el diseño dejaba los mapas para esta subfase. Cada mapa tiene dos pasos estrechos que tiran en sentido contrario:
- **una puerta de 2 celdas** en el muro que separa la colonia de la zona verde: al otro lado, una celda ve 2 vecinas vivas, así que hay que poder nacer con 2;
- **una grieta de 1 celda** en el muro de la base: al otro lado solo se ve 1 vecina, así que no se puede nacer con 1 (ni con 0, que hace aparecer vida dentro de la base).

El generador de mapas comprueba en cada uno que la referencia (`viva or vecinas >= 2`) cubre la zona entre las generaciones 12 y 25 (⭐⭐⭐), que nacer con 1 vecina infecta la base y que nacer solo con 3 no cruza la puerta.

## Cómo ejecutarlas

```bash
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -m unittest test_colonia test_radio test_nebulosa test_impostor test_camara test_lengua test_bomba test_retos_motor test_motor test_misiones test_mutador test_trazador
npm test
npm run e2e:docker
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | Vecinos en bordes (3) y centro (8); 18 entradas | `test_colonia.py` |
| A2 | Mapas deterministas | `test_colonia.py` |
| A3 | La grieta es de 1 celda (al otro lado solo se ve esa celda) y la puerta, de 2 | `test_colonia.py` |
| A4 | **Validador 1:** la referencia cubre los 6 mapas entre las generaciones 12 y 25, sin tocar la base | `test_colonia.py` |
| A5 | **Validador 2:** fallan las reglas «tontas»: siempre viva, nunca, quedarse igual, invadirlo todo, el Juego de la Vida de Conway y nacer solo con 3 | `test_colonia.py` |
| A6 | **Validador 3:** de 2.000 reglas aleatorias aprueba menos del 3 % (medido con 5.000: 13, un 0,26 %) | `test_colonia.py` |
| A7 | Material: el mapa con rocas, base (16 celdas), zona verde (16) y colonia inicial | `test_colonia.py` y `15-retos-colonia` |
| A8 | La referencia supera los 6 mapas con ⭐⭐⭐ | `test_colonia.py` (contenedor) |
| A9 | Nacer con 1 vecina infecta la base («generación N»), no es un error de código y el visor recibe las generaciones hasta la infección | `test_colonia.py` y `15-retos-colonia` |
| A10 | La tabla de la regla y las 41 generaciones (cadenas de 576) llegan al visor | `test_colonia.py` (contenedor) |
| A11 | Mensajes: extinción, «no cubrió toda la zona verde», regla impura (con `random`), valores que no son True/False; 0/1 sí valen | `test_colonia.py` (contenedor) |
| A12 | Por GraphQL: formato `colonia`, 6/6 con ⭐⭐⭐ y el código base no crece | `15-retos-colonia` |
| A13 | Regresión de las fases 0–5.6 | `01`–`14`, Python y unitarias |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Pestaña 🗺️ Mapas | Los dos mapas con la base rayada en rojo, el muro con su puerta, la zona verde discontinua y la colonia brillando; leyenda |
| M2 | `viva or vecinas >= 1` | La colonia se extiende en bloque, la base se pone en rojo y el visor se para en la generación de la infección (8), con el aviso ☣️ |
| M3 | `viva or vecinas >= 2` y enviar | La colonia llena el lado izquierdo sin pasar la grieta, cruza la puerta y cubre la zona en la generación 20; 6/6 con ⭐⭐⭐ |
| M4 | Panel | Generación y controles (⏮ ⏯ ⏭, barra, ×1 ×2 ×4), gráfica de población, zona cubierta (%), estado de la base y la tabla de la regla (✓/✗) |
| M5 | Móvil (375 px) | Sin desplazamiento horizontal; mapa de 300 px y el panel debajo |

## 3. Resultados (28-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A11 | ✅ 161/161 en Python (12 nuevas) | |
| A12–A13 | ✅ 117/117 e2e (4 nuevas) | Unitarias 8/8 |
| M1–M5 | ✅ | «La colonia alcanzó la base en la generación 8»; con la referencia, zona verde cubierta en la generación 20 |

## 4. Notas
- Con esta subfase queda completa la fase 5 (siete formatos de reto). Siguen apartados, por decisión del usuario, la edición de retos en el panel de administración y el rediseño del frontal.
