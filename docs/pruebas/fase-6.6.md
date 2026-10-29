# Plan de pruebas — Fase 6.6 (🎨 Rediseño: administración, móvil y auditoría final)

Ramas: `feature/fase-6.6-admin` en Astrocode-web (el código y el documento del sistema de diseño) y en Astrocode-API (ROADMAP y este plan). Sale de la 6.5. Con esta fase termina el rediseño.

## Qué cambia
- **Panel de administración** (`views/admin`):
  - la misma barra que el resto, con el título «Panel de administración»;
  - pestañas accesibles «Ejercicios con IA» / «Sabotajes»;
  - formularios con el kit (`Campo`, `CampoArea` y `CampoSelector`, todos con etiqueta);
  - avisos del kit y botones con iconos, sin emojis;
  - los sabotajes en tarjetas con etiquetas de dificultad y origen.

  Las descripciones de los sabotajes y la revelación del ejercicio pintan el `código` en monoespaciada (antes salían las comillas invertidas).
- **Kit:** `CampoArea` (textarea, con modo `codigo`) y `CampoSelector` (desplegable con flecha propia).
- **Repaso en móvil (375 px) y escritorio (1280 px)** de todas las pantallas, con axe-core y la comprobación de scroll horizontal. Arreglos:
  - **números de línea del editor** con contraste 2,81:1 → `#6b8299` (4,6:1);
  - **etiquetas** (Difícil, turquesa) sobre superficies claras por debajo de AA (hasta 3,6:1) → texto un punto más claro: ≥4,9:1 sobre sarga, relieve y relieve-2;
  - el **código de la guía** se desplaza de lado en móvil y no se podía enfocar → `tabIndex` y un nombre;
  - `SalaDeMaquinas.css` no tenía bloque de «reducir movimiento».
- **Rendimiento:**
  - **el primer paquete pasa de 289 kB a 155 kB gzip (−46 %)**:
    - guía, perfil y ranking se cargan al entrar;
    - las reglas de color del código pasan a `code-editor/colores.ts`, así la guía ya no arrastra CodeMirror. CodeMirror solo se descarga con el editor;
  - **fuera Skulpt:** `index.html` cargaba dos scripts de un intérprete de Python en el navegador, de dos CDN ajenos y de forma bloqueante, en cada página, y nada lo usaba. Fuera también sus tipos (`types/skulpt.d.ts`).
- **`index.html` y manifiesto:**
  - `lang="es"` (antes `en`: los lectores de pantalla pronunciaban el español como inglés);
  - el color de la barra del navegador es el de la noche y se declara `color-scheme: dark`;
  - descripción y aviso `noscript` en español.
- **Documento del sistema de diseño:** `astrocode-web/docs/DISENO.md`, con principios, tokens y contrastes, tipografía, movimiento, componentes, patrones y cómo comprobarlo. El muestrario `/diseno` enseña también las piezas nuevas: campos, código coloreado, calificación y enhorabuena.

## Cómo ejecutarlas

```bash
cd client && npx tsc --noEmit && npm run test:ci && npm run build
../.claude/skills/impeccable/scripts/impeccable detect --json src
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | Admin sin IA: lo explica; con IA: tema, nivel y categoría con etiqueta y «Generar borrador» en oro | `AdminPanel.test.tsx` |
| A2 | Admin: las pestañas cambian entre ejercicios y sabotajes | `AdminPanel.test.tsx` |
| A3 | Regresión de todo el cliente | 43/43 |
| A4 | Tipos y build sin ningún aviso | `tsc`, `npm run build` |
| A5 | Detector de Impeccable sobre **todo** `client/src` | 0 hallazgos |
| A6 | Todos los CSS que animan algo tienen su bloque de «reducir movimiento» | `grep` (A6 en las notas) |

## 2. Manuales (navegador, pila aislada)

axe-core 4.10 y scroll horizontal en cada pantalla, a 375 y a 1280 px:

| ID | Pantalla | 375 px | 1280 px |
|---|---|---|---|
| M1 | Acceso (entrar y crear cuenta) | ✅ | ✅ (6.4) |
| M2 | Mapa y panel de un planeta | ✅ | ✅ |
| M3 | Ejercicio | ✅ tras arreglar los números de línea | ✅ |
| M4 | Misión de pilotaje y reto | ✅ | ✅ |
| M5 | Perfil, ranking y guía | ✅ tras arreglar el código de la guía | ✅ |
| M6 | Administración: formulario y sabotajes generados | ✅ tras arreglar las etiquetas | ✅ |

| ID | Pasos | Resultado esperado |
|---|---|---|
| M7 | Generar 5 sabotajes de «Validar Paréntesis» desde el panel | Tarjetas con dificultad, operador, diff y «Publicar» en oro |
| M8 | Entrar en guía, perfil y ranking tras la carga diferida | Cargan con su título |
| M9 | Ejecutar un ejercicio sin Skulpt | Corrige en el servidor; sin errores en la consola; `window.Sk` no existe; `<html lang="es">` |

## 3. Resultados (29-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A6 | ✅ 43/43, build sin avisos, detector 0 | |
| M1–M9 | ✅ | |

## 4. Notas
- **Falso positivo conocido:** `scrollable-region-focusable` en `.cm-scroller` de CodeMirror. La zona editable sí recibe el foco, y añadir otro `tabIndex` metería una parada de teclado de más.
- A 1280 px el panel del planeta salía 14 px por fuera en la medición: era su animación de entrada aún en marcha. Al terminar acaba justo en el borde.
- Las capturas solo se repintan con el panel del navegador visible; donde no lo estaba, se comprobó por el DOM.
- La API no cambia en esta fase. Las pruebas e2e (todas de la API) siguen en el estado de la 5.7.
- **Rediseño terminado (6.0–6.6).** Quedan ideas fuera del alcance: insignias ganadas en el perfil (falta una consulta en la API) y editar retos desde el panel.
