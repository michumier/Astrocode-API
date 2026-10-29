# Plan de pruebas — Fase 6.1 (🎨 Rediseño: el mapa)

Ramas: `feature/fase-6.1-mapa` en Astrocode-web (el código) y en Astrocode-API (ROADMAP y este plan). Sale de la 6.0.

## Qué cambia
- **Sistema solar** (`components/solar-system/SolarSystem.tsx` y su CSS):
  - los planetas siguen girando en órbitas planas, pero cada uno arranca en su punto: antes salían todos en fila con las etiquetas pisándose;
  - las etiquetas se leen siempre derechas;
  - los bloqueados se ven en penumbra con candado y puntos;
  - se respeta «reducir movimiento» (se paran, no desaparecen);
  - en pantallas pequeñas las etiquetas se compensan para seguir leyéndose.
- **Mapa** (`views/dashboard/Dashboard.tsx` y `Mapa.css`), con la barra superior del kit:
  - **constelación del planeta en curso** (el abierto más lejano), con «siguiente estrella» y la barra hacia el próximo planeta;
  - **ranking** con «Tú» resaltado y sin datos inventados si falla;
  - **reto diario** en el bloque de oro, con su título real, puntos y horas restantes (antes solo ponía «Start»);
  - **sala de máquinas** y **guía de Python**.
- **Panel del planeta** (`PanelPlaneta.tsx`): una hoja lateral que deja ver el sistema solar.
  - Lleva la constelación del planeta, filtros por tipo y cada ejercicio con su icono, dificultad, puntos y botón directo. Se quita el paso de «Ver detalle».
  - El primero sin hacer es el botón de oro.
  - Se cierra con Escape y el foco va al título al abrirse.
  - En el móvil ocupa la pantalla entera.
- **Planeta bloqueado:** un aviso dice cuánto falta («Saturno se abre con 1500 pts. Te faltan 950.»).
- **Limpieza:**
  - fuera unas 400 líneas de comprobaciones de token repetidas y trazas en consola (el cliente de Apollo ya pone el token);
  - fuera el ranking de relleno inventado;
  - todo en español;
  - fuera `Dashboard.css` (1.395 líneas).
- **Correcciones:**
  - el fondo de estrellas medía `100vw` y daba scroll horizontal;
  - la constelación con muchas estrellas parecía un sismógrafo.

## Cómo ejecutarlas

```bash
cd client && npx tsc --noEmit && npm run test:ci && npm run build
# Navegador: pila aislada (desde astrocode-api) y un alumno con progreso
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | En el panel, el primero sin hacer es el botón principal; los hechos se pueden repetir | `PanelPlaneta.test.tsx` |
| A2 | La constelación del planeta sale en la cabecera del panel, con su descripción accesible | `PanelPlaneta.test.tsx` |
| A3 | Los filtros enseñan solo los tipos que hay, con su número, y filtran la lista | `PanelPlaneta.test.tsx` |
| A4 | El panel se cierra con Escape y con su botón | `PanelPlaneta.test.tsx` |
| A5 | Regresión del kit de la 6.0 | `ui.test.tsx` |
| A6 | Tipos y build: el Dashboard deja de dar avisos | `tsc`, `npm run build` |
| A7 | Detector de Impeccable sobre el mapa, el sistema solar y el kit: 0 hallazgos (antes, 4 solo en `Dashboard.css`) | `impeccable detect` |

## 2. Manuales (navegador, pila aislada; alumno con 550 pts y 3 ejercicios hechos)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Abrir el mapa a 1440×900 | Tres columnas como en el prediseño; planetas repartidos con las etiquetas derechas; Júpiter y Saturno con candado y puntos |
| M2 | Constelación de la izquierda | «Constelación de Marte · 0 de 15 estrellas», la siguiente estrella titilando y «Siguiente parada: Júpiter 550 / 1000 pts» |
| M3 | Ranking y reto diario | «Tú · …» resaltado; el reto con su título, puntos y «Quedan N h» |
| M4 | Pulsar Marte | Partículas sobre el planeta, órbita resaltada y panel lateral con la constelación, los filtros (Todo 15, Ejercicios 7, Retos 7, Misiones 1) y el foco en el título |
| M5 | Pulsar Saturno (bloqueado) | Aviso «Saturno se abre con 1500 pts. Te faltan 950.» |
| M6 | Escape | Se cierra el panel y vuelve la columna derecha |
| M7 | Tierra → «Empezar» | «3 de 16 hechos» y abre `/ejercicio/4` |
| M8 | Móvil (375 px) | Sistema solar arriba con etiquetas legibles (12 px), las demás tarjetas debajo y el panel del planeta a pantalla completa; sin scroll horizontal |

## 3. Resultados (29-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A7 | ✅ 12/12 unitarias, tipos, build y detector | |
| M1–M3 | ✅ tras corregir | Con 15 estrellas la constelación parecía un sismógrafo: el salto vertical se acorta cuando hay muchas |
| M4 | ✅ tras corregir | El panel aplastaba la constelación (elemento flexible): ya no se encoge |
| M5–M7 | ✅ | |
| M8 | ✅ tras corregir | Las etiquetas de los planetas se quedaban en 6 px al encoger el sistema: ahora se compensan. Además, el fondo de estrellas (`100vw`) y un desajuste de 2 px de la rejilla daban scroll horizontal |

## 4. Reparto de ejercicios entre planetas (decidido el 29-oct-2026)
Antes, Mercurio, Venus y Tierra enseñaban los mismos ejercicios (comparten el nivel 1), igual que Marte y Júpiter (nivel 2). Ahora se reparten (`client/src/utils/planetas.ts`):
- los ejercicios de un nivel se separan por tipo (ejercicios, retos y misiones) y se ordenan por id;
- cada tipo se trocea en partes seguidas, una por planeta: el primero se queda lo más básico y cada planeta recibe su mezcla de tipos;
- el reparto no depende del orden en que lleguen.

El **planeta en curso** pasa a ser el primer planeta abierto al que le quedan estrellas; si no le queda ninguna a nadie, el más lejano.

| ID | Qué se comprueba | Resultado |
|---|---|---|
| A8 | Los planetas que comparten nivel se reparten todos los ejercicios sin repetir ninguno; mezcla de tipos; el orden de llegada no cambia el reparto; Saturno se queda su nivel entero | ✅ `planetas.test.ts` (3), 15/15 en total |
| M9 | Alumno con 550 pts y 3 ejercicios hechos | ✅ Mercurio 7 («1 de 7»), Venus 5 («2 de 5»), Tierra 4: los 16 del nivel 1. Marte, 9. La constelación de la izquierda es la de Mercurio, el primero con estrellas pendientes |

«Sigue donde lo dejaste» se quitó porque la API no guarda el último ejercicio abierto; su papel lo cumple la «siguiente estrella».
