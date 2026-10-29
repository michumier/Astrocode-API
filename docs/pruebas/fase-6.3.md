# Plan de pruebas — Fase 6.3 (🎨 Rediseño: retos y misiones)

Ramas: `feature/fase-6.3-retos` en Astrocode-web (el código) y en Astrocode-API (ROADMAP y este plan). Sale de la 6.2.

## Qué cambia
- **Vista de retos y misiones** (`views/reto/VistaReto.tsx`, `VistaReto.css`), con el mismo marco que el ejercicio:
  - **barra:** volver al mapa, el tipo («Misión de pilotaje», «Reto · Bomba»…), puntos, número de escenarios y «Pista N de 3»;
  - **enunciado:** con formato (como el del ejercicio) y el objetivo aparte. En los retos, pestañas accesibles «Reto» / material (manual, expediente, mapas…);
  - **editor:** la función que hay que escribir, reiniciar, el escenario, el botón de probar de cada formato (secundario) y **«Enviar» como única acción principal en oro**;
  - **simulación:** el visor de cada formato; mientras no hay nada, una espera con el icono del formato;
  - **resultados:** «N de M superados», estrellas con iconos, escenarios con ✓/✗ y candado en los ocultos, métricas y el registro de los `print`;
  - **mensajes:** avisos del kit («¡Bomba desactivada!», «Todavía no», «No se pudo completar»).
- **Enhorabuena compartida** (`components/ui/Enhorabuena.tsx`): la ventana del ejercicio pasa al kit y la usan el ejercicio y los retos. Foco en «Volver al mapa», Escape y el fondo la cierran. Nueva **`Calificacion`** (0–3 estrellas con nombre accesible).
- **Sin emojis en el marco:**
  - los botones y pestañas de cada formato llevan iconos de lucide;
  - las etiquetas de formato, sin emoji;
  - los títulos de las tareas se limpian (`limpiarTitulo`: «🚀 Aterrizaje…» → «Aterrizaje…»), también en el mapa y en el reto diario.
- **Visores con la paleta:**
  - el añil y el verde neón del tema viejo pasan a los tokens (fondo de código, turquesa para lo superado, rojo de error, oro para resaltar);
  - el lienzo del pilotaje, con los colores y fuentes nuevos;
  - los controles ⏮ ▶ ⏭ del pilotaje y la colonia son iconos, y el reproducir va en oro.

  Los colores propios de cada juego (cables, píxeles, luces de la bomba) no cambian.
- **Pantalla de carga y de sabotaje bloqueado** (`Router.tsx`), con el fondo y el botón nuevos.

## Cómo ejecutarlas

```bash
cd client && npx tsc --noEmit && npm run test:ci && npm run build
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | Reto con material: título, tipo, nº de escenarios, enunciado con formato, pestañas que cambian `aria-selected` y su panel | `VistaReto.test.tsx` |
| A2 | Una sola acción principal («Enviar»); «Probar» es secundario; el selector de escenario tiene nombre | `VistaReto.test.tsx` |
| A3 | Misión de pilotaje: sin pestañas, «Lanzar», `piloto(sensores)` y sin emojis en la barra | `VistaReto.test.tsx` |
| A4 | Si no carga: «No se pudo cargar la misión» y «Volver al mapa» | `VistaReto.test.tsx` |
| A5 | Enhorabuena: foco en «Volver al mapa», Escape y el botón secundario la cierran, calificación «2 de 3 estrellas» | `ui.test.tsx` |
| A6 | `limpiarTitulo` quita solo los emojis del principio | `planetas.test.ts` |
| A7 | Regresión del ejercicio (que ahora usa la enhorabuena del kit), del mapa y del reparto | 27/27 en total |
| A8 | Tipos, build sin avisos nuevos y detector de Impeccable: 0 hallazgos | `tsc`, `npm run build`, `impeccable detect` |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Abrir «Aterrizaje de emergencia» (55) | Barra «Misión de pilotaje · 150 pts · 5 escenarios»; título sin 🚀; espera con el cohete |
| M2 | Enviar una solución que aterriza | 5 de 5 superados, estrellas, registro; enhorabuena con puntos y estrellas y foco en «Volver al mapa» |
| M3 | Escape en la enhorabuena | Se cierra y el foco vuelve a «Enviar» |
| M4 | Controles del vuelo | Iconos con nombre (principio, reproducir/pausa, avanzar); reproducir en oro |
| M5 | Abrir un reto de cada formato (bomba, lengua, cámara, impostor, nebulosa, radio, colonia, calibración) | Tipo, título sin emoji, pestañas con su material y botón de probar propio |
| M6 | Probar el código base en cada formato | El visor de cada formato se pinta con la paleta, sin errores en la consola |
| M7 | axe-core en la vista y en la enhorabuena | Sin infracciones reales |
| M8 | Móvil (375 px) | Sin scroll horizontal; una columna; «Enviar» ocupa el ancho que queda |
| M9 | Mapa y reto diario | Títulos sin emoji |

## 3. Resultados (29-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A8 | ✅ 27/27, tipos, build y detector | El build solo avisa en login, registro y perfil, que se rehacen en 6.4–6.5 |
| M1–M4 | ✅ | Aterrizaje: 5 de 5 y 2 estrellas; Asteroides: 3 estrellas. «Todavía no» también probado |
| M5–M6 | ✅ | Los 8 formatos (bomba, lengua, cámara, impostor, nebulosa, radio, colonia, calibración) abren su material y pintan su visor; sin errores de la app en la consola |
| M7 | ✅ | Arreglado durante la prueba: material y visores usaban `h4` justo después del `h1` → `h3` y un `h2` oculto por columna. Queda el falso positivo conocido de `.cm-scroller` |
| M8 | ✅ | Sin scroll horizontal (solo el editor desplaza su código); «Enviar» en su propia fila a todo lo ancho |
| M9 | ✅ | |

## 4. Notas
- El HUD del aterrizaje enseña el empuje con ▮/▯: con el motor apagado salen todas vacías; es así a propósito.
- Siguen apareciendo emojis dentro de los textos de la API (el enunciado de la bomba o «💥 ¡BOOM!» en un motivo). Son contenido, no marco: se dejan.
- Con la columna estrecha (pantallas de ~1280 px) los botones del editor bajan a una segunda fila, alineados a la derecha.
