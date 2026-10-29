# Plan de pruebas — Fase 6.5 (🎨 Rediseño: perfil, ranking y guía)

Ramas: `feature/fase-6.5-perfil` en Astrocode-web (el código) y en Astrocode-API (ROADMAP y este plan). Sale de la 6.4.

## Qué cambia
- **Marco común** (`views/comun/PaginaAlumno.tsx`): perfil, ranking y guía llevan la misma barra que el mapa (Mapa · Guía · Ranking, puntos y menú de cuenta) y un título. Se navega igual desde todas; fuera los botones «← Volver al Dashboard».
- **Perfil** (`views/profile/Perfil.tsx`). Sustituye a `Profile.tsx`:
  - **ficha:** avatar, nombre, @usuario, correo y desde cuándo. Puntos en oro y **rumbo al siguiente planeta** (barra con `role="progressbar"` y «Te faltan N puntos para abrir Marte»);
  - **cifras reales:** ejercicios resueltos, misiones y retos, sabotajes reparados y hitos;
  - **«Tus constelaciones»:** los seis planetas con su constelación (el mismo reparto que el mapa). Los cerrados enseñan cuántos puntos hacen falta;
  - **hitos que salen de lo hecho de verdad** (`calcularHitos`): primer ejercicio, una misión, un sabotaje, un reto, 500 puntos, una constelación completa y 1500 puntos.

    Antes había tres «logros» inventados e iguales para todos («Racha de 7 días»…) y un nivel que saltaba de la Tierra a Marte y a Saturno;
  - el botón del panel de administración solo lo ven los administradores;
  - fuera la consulta cada 30 segundos, la vuelta a `localStorage` y las 100 estrellas aleatorias en cada render.
- **Ranking** (`views/ranking/Ranking.tsx`). Sustituye a `FullRanking.tsx`:
  - podio con medallas para los tres primeros y el resto en lista;
  - **tu fila marcada con «Tú»**;
  - si no estás entre los 100 primeros, te lo dice con tus puntos.
- **Guía de Python** (`views/python-guide/Guia.tsx`). Sustituye a `PythonGuide.tsx`:
  - el contenido pasa a datos (`contenido.ts`, los 12 conceptos sin tocar el texto);
  - pestañas accesibles por nivel, índice que enlaza a cada concepto y **código coloreado con los mismos colores que el editor** (`CodigoResaltado`). Las reglas de color están ahora en un solo sitio (`tema.ts`) para el editor y para este código;
  - botón «Copiar» en cada ejemplo;
  - los recursos son enlaces de verdad (`target="_blank"` con `rel="noopener noreferrer"`). Antes se abrían con `window.open` sin `noopener`.
- **Pruebas:** Jest ya transforma los módulos ES de CodeMirror y Lezer (`transformIgnorePatterns`). Se añade `@lezer/python` como dependencia directa; ya venía instalada por `@codemirror/lang-python`.
- **Build sin ningún aviso:** el último, el del perfil, desaparece.

## Cómo ejecutarlas

```bash
cd client && npx tsc --noEmit && npm run test:ci && npm run build
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | Hitos: ninguno sin progreso; los que tocan según los tipos resueltos y los puntos | `Perfil.test.tsx` |
| A2 | Perfil: nombre, @usuario, progreso a Júpiter con 620 puntos (24 %), «faltan 380 puntos», 6 planetas, los cerrados con sus puntos y el estado de cada hito para lectores de pantalla; sin logros inventados | `Perfil.test.tsx` |
| A3 | Ranking: podio de 3, resto en lista y «Tú» | `Ranking.test.tsx` |
| A4 | Ranking: fuera del top 100 te dice tus puntos | `Ranking.test.tsx` |
| A5 | Guía: 3 niveles con 4 conceptos y código cada uno | `Guia.test.tsx` |
| A6 | Guía: pestañas, índice con enlaces a cada concepto y código coloreado | `Guia.test.tsx` |
| A7 | Guía: los recursos se abren aparte con `noopener noreferrer` | `Guia.test.tsx` |
| A8 | Regresión | 41/41 en total |
| A9 | Tipos, build sin avisos y detector de Impeccable: 0 hallazgos | `tsc`, `npm run build`, `impeccable detect` |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Alumno con el ejercicio 1 y el aterrizaje hechos → `/perfil` | 288 puntos, «Te faltan 212 puntos para abrir Marte»; 2 resueltos, 1 misión; Mercurio «2 de 7» con la siguiente estrella en oro; Marte, Júpiter y Saturno cerrados; hitos «Despegue» y «Piloto» |
| M2 | `/ranking` | Podio, «Tú» en tu fila y «Ranking» activo en la barra |
| M3 | `/guia` | Pestañas, índice y código coloreado como en el editor |
| M4 | axe-core en las tres páginas | Sin infracciones |
| M5 | Móvil (375 px) en las tres | Sin scroll horizontal |
| M6 | Administrador → `/perfil` → «Panel de administración» | Abre `/admin` |

## 3. Resultados (29-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A9 | ✅ 41/41, tipos, build sin avisos y detector | |
| M1–M3 | ✅ | Arreglado en la prueba: el anillo de Saturno tapaba su nombre, y «1.500» estaba escrito a mano mientras el resto sale «1500» |
| M4 | ✅ | Arreglado en la prueba: la etiqueta «Tú» sobre la fila resaltada se quedaba en 4,02:1 → etiqueta maciza |
| M5–M6 | ✅ | |

## 4. Notas
- Los números de 4 cifras salen sin punto («1500»), como manda la RAE y como los da `toLocaleString('es-ES')`.
- No hay consulta de insignias ganadas en la API (solo `insigniasNuevas` al enviar). Por eso los hitos se calculan en el cliente con datos reales y la insignia Cirujano no aparece aún en el perfil.
