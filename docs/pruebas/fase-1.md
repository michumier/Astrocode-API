# Plan de pruebas — Fase 1 (sabotaje)

Ramas: `feature/fase-1-sabotaje` en Astrocode-API y Astrocode-web. Requisitos en `docs/ROADMAP.md` (RF-1.x).

## Cómo ejecutarlas

```bash
# Mutador (Python)
cd python-runner && python -m unittest -v test_mutador

# API: unitarias y e2e (stack aislado con IA falsa)
npm test
npm run e2e:docker

# Web
cd client && npx tsc --noEmit && npm run build
```

## 1. Automáticas

| ID | Qué se comprueba | Requisito | Dónde |
|---|---|---|---|
| A1 | El mutador genera variantes que compilan, sin duplicados, de 1-3 líneas, con la misma firma, conservando comentarios y unicode; deterministas y variadas | RF-1.1 | `python-runner/test_mutador.py` (7) |
| A2 | Detector de pistas que revelan el sabotaje (número de línea, fragmento cambiado, tokens cortos como `pop(0)`) sin falsos positivos | RF-1.7 | `test/unit/ia-sabotaje.test.mjs` (3) |
| A3 | `tareasSaboteables`, `generarSabotajes`, `publicarSabotaje` y `descartarSabotaje` solo para admin | RF-1.2 | `05-sabotaje` |
| A4 | Generar: 3-5 sabotajes verificados (se ejecutan y fallan ≥1 test); dificultad coherente | RF-1.2, CA-1.1 | `05-sabotaje` |
| A5 | Comprobación independiente: ningún sabotaje pasa la corrección de la tarea original | RF-1.2 | `05-sabotaje` |
| A6 | Generar otra vez no repite sabotajes (ni en la respuesta ni en la base de datos) | RF-1.2 | `05-sabotaje` |
| A7 | Sabotaje con IA: una sola línea, la línea correcta, sangría conservada y verificado igual que los del mutador | RF-1.2 | `05-sabotaje` |
| A8 | Publicar crea una tarea `sabotaje` con el código roto y la ambientación; no se publica dos veces | RF-1.3 | `05-sabotaje` |
| A9 | Los sabotajes no salen en listados ni en el reto diario | RF-1.3 | `05-sabotaje` |
| A10 | Bloqueado (`tarea`, `enviarSolucion`, `pedirPista`) hasta completar la original | RF-1.4, CA-1.2 | `05-sabotaje` |
| A11 | Flujo completo: desbloquear, fallar sin revelación, arreglar → puntos, revelación e insignia Cirujano; repetir no suma | RF-1.5, RF-1.6, CA-1.3, CA-1.4 | `05-sabotaje` |
| A12 | Arreglar con cambios de más: correcto, pero sin Cirujano | RF-1.6 | `05-sabotaje` |
| A13 | Pistas: en niveles 1-2 la IA no recibe ni la solución ni el bug; en el 3, sí; si en 1-2 se filtra la línea, se devuelve una pista segura | RF-1.7 | `05-sabotaje` |
| A14 | Regresión completa de las fases anteriores | — | `01` a `04` |

## 2. Manuales (navegador, stack completo en Docker, **IA real de NVIDIA**)

| ID | Pasos | Resultado esperado |
|---|---|---|
| M1 | Admin → Panel → Sabotajes → «Validar Paréntesis (#47)» → Generar 5 | 5 tarjetas con dificultad, operador, tests que fallan, línea y diff coloreado |
| M2 | Lo mismo marcando «Incluir uno inventado por la IA» | Aparece un sabotaje 🤖 IA verificado |
| M3 | Descartar un sabotaje sin publicar | Desaparece de la lista |
| M4 | Editar la ambientación y publicar | «Publicado como tarea N»; el alumno ve la ambientación editada |
| M5 | Alumno sin la original completada → dashboard | «🕵️ Sala de máquinas» con «🔒 1 bloqueado(s)» |
| M6 | Alumno abre `/ejercicio/N` del sabotaje por URL | «🔒 Este sabotaje se desbloquea al completar el ejercicio original» |
| M7 | Completar la original escribiendo en el editor | Correcto (6/6); en el dashboard el sabotaje aparece disponible |
| M8 | Abrir el sabotaje desde la sala | Cartel «⚠️ Alerta de sabotaje» con la ambientación, botón «Restaurar» y el código roto en el editor |
| M9 | Ejecutar y pedir las pistas 1, 2 y 3 | Falla 1/6. Pista 1 general, 2 con la zona, 3 con la línea |
| M10 | Arreglar tocando solo la línea rota | Correcto, 1000 puntos, revelación del diff, insignia Cirujano |
| M11 | Volver al dashboard | Sala: «✅ N reparado(s)» |
| M12 | Migraciones 001-011 sobre una copia del volumen real | Aplicadas; datos intactos |

## 3. Resultados (25-oct-2026)

| ID | Resultado | Notas |
|---|---|---|
| A1 | ✅ 7/7 | |
| A2 | ✅ 3/3 (+2 unitarias de fases anteriores) | |
| A3–A14 | ✅ 47/47 e2e | |
| M1 | ✅ | |
| M2 | ✅ tras corregir | La IA reescribía las comillas de otras líneas: el diff marcaba 3 líneas y la línea era incorrecta, y era un duplicado encubierto de otro sabotaje. **Ahora la IA solo indica qué líneas cambia y el cambio lo aplica la API.** Tras el arreglo, la IA real propuso `if char in mapa.values():` (1 línea, línea 5). |
| M3 | ✅ | |
| M4 | ✅ | La ambientación que escribe la IA a veces da pistas; por eso se puede editar antes de publicar. |
| M5 | ✅ | |
| M6 | ✅ | Antes mostraba «No se ha encontrado este ejercicio»; ahora explica que está bloqueado. |
| M7 | ✅ | |
| M8 | ✅ | |
| M9 | ✅ tras corregir | Con la IA real, las pistas 1 y 2 revelaban la línea y el arreglo, porque la IA recibía la solución y el bug. **Ahora en los niveles 1-2 no recibe ninguno de los dos**, la respuesta es más corta y un detector reintenta o da una pista segura si se filtra la línea o el fragmento. La latencia de NVIDIA varía entre 5 y 20 s. |
| M10 | ✅ tras mejorar | La ventana de «¡Enhorabuena!» tapaba la revelación y su botón sacaba de la página: **la revelación y la insignia ahora salen dentro de la ventana**. |
| M11 | ✅ | |
| M12 | ✅ | 10 usuarios, 28 tareas, 7 completadas y 12.219 puntos antes y después |

## 4. Cambios respecto al plan
- **Regla de validez (RF-1.2 / CA-1.1):** también se aceptan sabotajes que fallan todos los tests (como «fáciles»). Exigir que pasaran alguno descartaba casi todos los bugs aritméticos (por ejemplo, en «Número faltante» no salía ninguno).
- **Dashboard:** se arregló un fallo previo de maquetación a ~1280 px (la fila se salía de la pantalla y cortaba las tarjetas de los lados) y el panel lateral de ejercicios, que asomaba unos 35 px.

## 5. Limitaciones conocidas
- En soluciones cortas el mutador da pocas variantes (unas 4 en «Validar Paréntesis»); al agotarse, el panel lo indica.
- Las pistas dependen de la latencia de NVIDIA (5-20 s).
- No hay todavía una vista de insignias en el perfil (la insignia se guarda en `insignias_usuarios`).
