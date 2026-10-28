# Plan de pruebas — Fase 6.0 (🎨 Rediseño: base del sistema de diseño)

Ramas: `feature/fase-6.0-base` en Astrocode-web (el código) y en Astrocode-API (solo el ROADMAP y este plan). Prediseño aprobado: https://claude.ai/artifact/EhzYLRtiZoSsgY135Ff24G

Esta subfase no cambia ninguna pantalla: deja preparada la base sobre la que se rediseñan las demás.

| Pieza | Dónde |
|---|---|
| Tokens de color, tipografía, formas y movimiento (`--ac-…`) y estilos globales: fondo, fuente, selección, foco, barras de desplazamiento | `client/src/estilos/base.css` |
| Fuentes servidas por la propia web, sin Google: Bricolage Grotesque, Onest y JetBrains Mono, con licencia OFL | `@fontsource-variable/*`, en `client/src/index.css` |
| Iconos SVG de trazo, con licencia ISC | `lucide-react` |
| Kit de componentes: `Boton`, `Etiqueta`, `Panel`, `Campo`, `Aviso`, `BarraSuperior` y `Constelacion` | `client/src/components/ui/` |
| Muestrario, **solo en desarrollo** | ruta `/diseno` |
| Pruebas unitarias: primeras de la web, ahora también en el CI | `client/src/components/ui/ui.test.tsx` y `npm run test:ci` |

## Cómo ejecutarlas

```bash
cd client
npx tsc --noEmit
npm run test:ci
npm run build
# Navegador: pila aislada (desde astrocode-api)
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
# http://localhost:3100/diseno
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | La constelación es determinista: la misma figura para el mismo planeta y otra distinta para otro | `ui.test.tsx` |
| A2 | Las estrellas caben en el cielo y no se pisan (6 planetas × 1, 2, 5, 9 y 12 estrellas) | `ui.test.tsx` |
| A3 | La constelación se describe para lectores de pantalla («2 de 4 ejercicios hechos; el siguiente es…») | `ui.test.tsx` |
| A4 | El botón, mientras carga, se desactiva y lo anuncia (`aria-busy`); por defecto es `type="button"` | `ui.test.tsx` |
| A5 | Con `a`, el botón es un enlace de la web (react-router) con aspecto de botón | `ui.test.tsx` |
| A6 | El botón solo con icono usa el `aria-label` | `ui.test.tsx` |
| A7 | El campo queda ligado a su etiqueta y a su error (`aria-invalid`, descripción accesible) | `ui.test.tsx` |
| A8 | La dificultad da el tono de la etiqueta | `ui.test.tsx` |
| A9 | Tipos (`tsc`) y build de producción: las fuentes se empaquetan (16 ficheros, 468 KB) y no hay avisos nuevos | `tsc`, `npm run build` |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Abrir `/diseno` | Barra superior nueva y paneles de color, tipografía, botones, etiquetas, campos, avisos y constelaciones; sin desplazamiento horizontal |
| M2 | Fuentes | Bricolage Grotesque, Onest y JetBrains Mono cargadas desde la propia web |
| M3 | «Probar la carga» | El botón pasa a «Ejecutando…», se desactiva con `aria-busy` y vuelve solo |
| M4 | Menú del avatar | Se abre con «Mi perfil» y «Cerrar sesión»; se cierra con Escape o al pulsar fuera |
| M5 | Constelaciones | Venus: 4 trazos encendidos, 4 apagados y la siguiente estrella titilando; Mercurio, completa; Marte, todo apagado salvo la siguiente; cada estrella con el título de su ejercicio |
| M6 | Regresión: acceso, mapa y un reto | Se ven igual que antes (la base no pisa los estilos de las pantallas que aún no se han rediseñado) |

## 3. Resultados (29-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A8 | ✅ 8/8 | Hizo falta enseñar a Jest a resolver react-router v7 (`moduleNameMapper`) y añadir `setupTests.ts` |
| A9 | ✅ | Se corrigió de paso un aviso que había dejado la fase 5.4 en el visor del impostor |
| M1–M6 | ✅ | Verificado en el navegador (DOM y estilos calculados) |

## 4. Notas
- La API no cambia en esta subfase, así que no se repiten sus pruebas e2e.
- `PRODUCT.md`, el contrato de dirección y las skills de diseño viven solo en local, fuera de git.
