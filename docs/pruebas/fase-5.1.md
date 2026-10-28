# Plan de pruebas — Fase 5.1 (💣 Bomba)

Ramas: `feature/fase-5.1-bomba` en Astrocode-API y Astrocode-web (salen de la 5.0). Diseño en `docs/diseno/fase-5-retos.md` §4.1.

**Retos nuevos** (migración `013_retos_bomba`):
- **💣 Bomba de cables** (B1): Fácil, Estructuras Condicionales, 150 pts.
- **💣 Bomba de módulos** (B2): Intermedio, Funciones, 200 pts.

Cada uno tiene 3 escenarios visibles y 7 ocultos.

## Cómo ejecutarlas

```bash
docker build -t astrocode-runner-pruebas python-runner
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL -v "$PWD/python-runner:/src:ro" -w /src \
  astrocode-runner-pruebas python -m unittest test_bomba test_retos_motor test_motor test_misiones test_mutador test_trazador
npm test
npm run e2e:docker
# Navegador (web :3100, API :4100, BD aparte)
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Dónde |
|---|---|---|
| A1 | Los ejemplos resueltos del enunciado (`[3, 4]` y `[1, 2]`) y los casos límite: azul al final y primer corte en el último cable | `test_bomba.py` |
| A2 | Botón (las 4 reglas) y teclado (orden según la columna) | `test_bomba.py` |
| A3 | El generador es determinista y puede crear **las 15 combinaciones** de regla del paso 1 × rama del paso 2, y las 4 reglas del botón. Un objetivo imposible da error | `test_bomba.py` |
| A4 | En 500 bombas: de 3 a 6 cables, serie de 6 caracteres que acaba en cifra, y teclado con 4 símbolos distintos y **una sola columna válida** | `test_bomba.py` |
| A5 | El material no lleva la solución. La explicación nombra la regla y la rama | `test_bomba.py` |
| A6 | La referencia B1 aprueba 60 bombas (las 15 combinaciones × 4 semillas) y la referencia B2 aprueba las 15 combinaciones con los 4 botones | `test_bomba.py` (contenedor) |
| A7 | **Los errores típicos fallan:** olvidar el paso 2, cambiar el orden de las reglas, el azul del final sin comprobar el límite y cortar el primer azul en lugar del último | `test_bomba.py` (contenedor) |
| A8 | Un fallo en un escenario visible explota y explica el manual («regla 3…»), con la respuesta y la solución en el último fotograma | `test_bomba.py` (contenedor) |
| A9 | Respuestas mal formadas: un número suelto (pide una LISTA), posición fuera de rango, colores en vez de posiciones, `None`, falta `"teclado"`, botón «girar». Las tuplas valen | `test_bomba.py` (contenedor) |
| A10 | Los dos retos existen como `reto`/`bomba` en su nivel. El material trae solo las 3 bombas visibles, sin soluciones, objetivos ni semillas | `09-retos-bomba` |
| A11 | Las columnas del material de B2 coinciden con las del código base | `09-retos-bomba` |
| A12 | B1 por GraphQL: un corte equivocado explota con explicación; sin el paso 2 aprueba solo algunas y los ocultos no dicen por qué; la solución aprueba 10/10 con 225 puntos (⭐⭐⭐) | `09-retos-bomba` |
| A13 | B2 por GraphQL: la solución por módulos aprueba 10/10; el código base compila pero explota | `09-retos-bomba` |
| A14 | Regresión de las fases 0–5.0 | `01`–`08`, Python y unitarias |

## 2. Manuales (navegador, pila aislada)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Abrir «💣 Bomba de cables» → pestaña «📕 Manual» | Manual con aspecto de documento: pasos 1 y 2, nota sobre las posiciones y las 3 bombas visibles con sus cables (con número y color) y su serie |
| M2 | «✂️ Desactivar» con el código base (`[0]`) | Cuenta atrás, el cable 0 se corta, LED rojo, destello y sacudida. Los cables que había que cortar se marcan («✂ había que cortarlo») y aparece la explicación del manual |
| M3 | Escribir la solución → «✂️ Desactivar» | Dos cortes con tijeras, LED verde, cuenta atrás parada y «💚 Bomba desactivada» |
| M4 | «💣 Bomba de módulos» con el código base | Panel con baterías, tres módulos (cables, botón redondo con su color y texto, teclado 2×2). El botón se pulsa, las teclas se numeran en el orden enviado y la explicación incluye los tres módulos |
| M5 | Móvil (375 px) | Todo en una columna, sin desplazamiento horizontal |

## 3. Resultados (28-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1–A9 | ✅ 77/77 en Python (15 nuevas) | A7 necesitó más semillas: con pocas, el generador puede dar bombas en las que el error no se nota (por ejemplo, el orden de las reglas solo importa si hay blanco al final **y** varios azules) |
| A10–A14 | ✅ 82/82 e2e (8 nuevas) | Unitarias 5/5; la web compila sin avisos nuevos |
| M1 | ✅ | |
| M2 | ✅ tras mejorar | El rótulo «había que cortarlo» tapaba el cable: ahora va encima, alineado a la derecha |
| M3 | ✅ | |
| M4 | ✅ tras mejorar | Si el código falla antes de responder (por ejemplo, sin `desactivar`), el visor decía solo «BOOM»: ahora explica que la función falló antes de cortar y remite al motivo |
| M5 | ✅ | |

## 4. Fuera de alcance
- B3 (bomba con memoria) queda como [O] en el diseño.
