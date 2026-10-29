# Plan de pruebas — Fase 6.2 (🎨 Rediseño: el ejercicio)

Ramas: `feature/fase-6.2-ejercicio` en Astrocode-web (el código) y en Astrocode-API (ROADMAP y este plan). Sale de la 6.1.

## Qué cambia
- **Vista del ejercicio** (`views/exercises/Exercise.tsx`, `Ejercicio.css`):
  - **barra:** volver al mapa, categoría, dificultad, puntos, reloj y «Pista N de 3»;
  - **enunciado:** a la izquierda (fijo al hacer scroll) con su formato, el resultado esperado y la pista de AstroTutor;
  - **editor:** a la derecha, con **una sola acción principal en oro, «Ejecutar»** (que ya corrige y suma puntos), «Paso a paso» y reiniciar;
  - **salida estructurada:** la salida del programa, los errores en rojo, cada prueba con ✓/✗, esperado/obtenido y «Ver qué pasó», y el veredicto en un aviso. Antes era un texto montado a mano con emojis;
  - **enhorabuena:** estrella, puntos y tiempo, «Volver al mapa» o «Quedarme aquí». Se cierra con Escape y el foco va a su botón;
  - **sabotaje:** la alerta va en un aviso de error, con la etiqueta «Sabotaje» y reiniciar «al código saboteado original».
- **Enunciados con formato** (`components/enunciado/Enunciado.tsx`): párrafos, etiquetas («Objetivos:», «Contexto de la misión:») como títulos, listas con guiones, **negrita** y `código`. Antes se veían los `**` y los guiones tal cual. Todo se pinta como texto, sin `innerHTML`.
- **Editor con la paleta** (`components/code-editor/tema.ts`): sustituye a «One Dark». También lo usan los retos y la caja negra.
- **Caja negra** con el sistema nuevo:
  - iconos reales en lugar de ⏮ ◀ ▶ ⏸ ⏭;
  - el reproducir en oro;
  - sin emojis.
- **Diff del sabotaje** con la paleta: rojo de error para lo que se quita y turquesa para lo que se añade.
- **Limpieza:**
  - fuera `Exercise.css` (915 líneas) y las 200 estrellas que se generaban con `innerHTML`;
  - fuera el ejercicio de ejemplo inventado que salía si no había datos;
  - fuera `@codemirror/theme-one-dark`;
  - de paso, el aviso del build que quedaba en el mapa.

## Cómo ejecutarlas

```bash
cd client && npx tsc --noEmit && npm run test:ci && npm run build
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | El enunciado se separa en párrafos, etiquetas y listas | `Enunciado.test.tsx` |
| A2 | Las etiquetas son títulos, las listas, listas y el código, `code`; no quedan asteriscos | `Enunciado.test.tsx` |
| A3 | Lista pegada a un párrafo y texto sin formato | `Enunciado.test.tsx` |
| A4 | El HTML del enunciado no se interpreta (no aparece ningún `<img>`) | `Enunciado.test.tsx` |
| A5 | Ejercicio normal: título, enunciado con formato, un único botón principal («Ejecutar») y la salida vacía | `Exercise.test.tsx` |
| A6 | Sabotaje: alerta, etiqueta «Sabotaje» y reiniciar «al código saboteado original» | `Exercise.test.tsx` |
| A7 | Sin ejercicio: «Volver al mapa» | `Exercise.test.tsx` |
| A8 | Regresión del kit, del mapa y del reparto | 22/22 en total |
| A9 | Tipos, build sin avisos en lo tocado y detector de Impeccable: 0 hallazgos (antes, 3 solo en `Exercise.css`) | `tsc`, `npm run build`, `impeccable detect` |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Abrir el ejercicio 1 a 1440×900 | Enunciado con «Contexto de la misión» y «Objetivos» como títulos, 3 viñetas y sin `**`; editor con la paleta; «Ejecutar» en oro |
| M2 | Ejecutar el código base (falla) | Mientras corre, `aria-busy`; luego el error de Python en rojo, la línea 6 marcada y el aviso «Todavía no» |
| M3 | «Pista 1 de 3» | La pista de AstroTutor aparece bajo el enunciado y el botón pasa a «Pista 2 de 3» |
| M4 | «Paso a paso» | Caja negra con el estilo nuevo, controles con iconos y reproducir en oro; se cierra con su botón |
| M5 | Escribir la solución y ejecutar | Aviso «¡Correcto!» y la enhorabuena con +100 puntos y el tiempo; el foco en «Volver al mapa»; Escape la cierra |
| M6 | Volver al mapa | La constelación ya cuenta la estrella: «1 de 7» |
| M7 | Un reto (Terraformación) | El editor de los retos usa el tema nuevo |
| M8 | Móvil (375 px) | Sin scroll horizontal; enunciado arriba y editor debajo; «Ejecutar» a todo lo ancho |

## 3. Resultados (29-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A9 | ✅ 22/22, tipos, build y detector | Para probar la vista hubo que sustituir CodeMirror por un editor falso: el Jest de CRA no transforma sus módulos ES |
| M1–M8 | ✅ | |

## 4. Notas
- **No probado en el navegador:** el sabotaje, porque no hay sabotajes publicados en la base de datos de pruebas (la sala de máquinas no aparece). Lo cubre A6.
- Los puntos de la cabecera son los base del ejercicio; la enhorabuena enseña los ganados, que pueden incluir la bonificación por tiempo.
