# Plan de pruebas — Fase 7 (🧹 Repaso de los ejercicios)

Rama: `feature/fase-7-ejercicios` en Astrocode-API. El frontal no cambia.

## Qué se ha revisado

Se revisaron las 50 tareas de una base de datos limpia (`BD Astrocode.sql` más todas las migraciones). La base de datos real tiene las mismas 47 tareas con el mismo contenido; las otras 3 son los retos internos de calibración, que solo existen con `RETOS_DE_PRUEBA=1`.

| Tipo | Cuántas | Estado antes |
|---|---|---|
| Ejercicios de código de los planetas | 19 | **Sin tests ni solución**: se corregían comparando toda la salida con `resultado_esperado` |
| Retos diarios | 9 (3 retos × 3 copias) | Con solución y tests; la del árbol binario no definía `Nodo` |
| Misiones de pilotaje | 3 | Bien |
| Retos insólitos | 18 | Bien |

### Diagnóstico de los 19 ejercicios

Para medirlo, se escribió una solución correcta de cada uno siguiendo al pie de la letra su enunciado y su código base, y se mandó a corregir. **Solo pasaron 9 de 19.**

| # | Problema |
|---|---|
| 5, 8, 10, 19, 25 | El código base imprime `…\n` (una línea en blanco) y la salida esperada no la tiene → imposible de superar |
| 9 | Falta «Código especial detectado!» tras el 465, que es múltiplo de 5 → imposible |
| 17 | La salida esperada solo tiene 3 de los 6 astronautas → imposible |
| 18 | No dice qué misión añadir, y con esos límites caben 2 misiones, no 1 → imposible |
| 16, 28 | Usan `input()` y la corrección no da entrada → `EOFError`. El 28 traía la solución ya hecha en el código base |
| 2, 4 | El código base era **otro ejercicio**, con cadenas rotas que no compilaban |
| 20 | Había que adivinar los valores 17.0 y 18.0 |
| 21 | No decía el formato de la media |
| 1, 2, 4 | Emojis perdidos por la codificación: `print("? === …")` |
| varios | Categoría o título que no cuadran con el ejercicio: «Recursión» sin recursión, «Pila de comandos» que en realidad es una contraseña… |
| los 19 | Sin tests: bastaba con copiar la salida esperada con `print` para superarlos, y AstroTutor no tenía solución en la que basarse para dar pistas |

## Qué cambia
- **Migración `020_repaso_ejercicios`** con los datos en `src/db/seeds/ejercicios.ts`:
  - los 19 ejercicios conservan su id, su tema, sus datos y sus puntos;
  - cambian el título, el enunciado (dice exactamente qué escribir y qué debe salir), el código base, el resultado esperado, la categoría y la solución, y se añaden tests;
  - cada ejercicio lleva un test visible con la salida completa y, en 17 de 19, tests ocultos que llaman a las funciones o miran las variables con otros datos;
  - solo toca un ejercicio si conserva su título original (sin tener en cuenta los espacios del final). Si alguien lo cambió a mano, lo respeta y avisa en el registro;
  - los tests solo se añaden si la tarea no tenía ninguno;
  - la solución de «Invertir un Árbol Binario» incluye ahora la clase `Nodo`.
- `#16` y `#28` pasan de `input()` a funciones (`comprobar_traje`, `verificar_acceso`).
- `#2` y `#4` se rehacen con el enunciado que tenían: conversiones de tipos y calculadora de combustible.
- **Efecto secundario bueno:** al tener solución y tests, los 19 ejercicios ya se pueden usar para generar sabotajes desde el panel.
- **e2e:** el ayudante `solucionTarea1` usa el nuevo código base. Las pruebas que necesitaban una tarea «sin tests» la crean con `tareaSinTests()`, porque ya no queda ninguna en la BD.

## Cómo ejecutarlas

```bash
npm test
npm run e2e:docker
docker compose -p astrocode-prueba -f docker-compose.yml -f test/e2e/compose.e2e.yml -f test/e2e/compose.prueba-manual.yml up -d --build
```

## 1. Automáticas

| ID | Qué se comprueba | Resultado |
|---|---|---|
| A1 | Pruebas unitarias de la API | ✅ 8/8 |
| A2 | e2e completo (con el ejercicio 1 corregido por tests y la tarea sin tests creada al vuelo) | ✅ 117/117 |
| A3 | La migración 020 se aplica en una BD limpia sin avisos | ✅ |

## 2. Prueba de todos los ejercicios (pila aislada)

Se mandan a corregir, como un alumno, tres versiones de cada tarea:

| ID | Versión enviada | Debe | Antes | Después |
|---|---|---|---|---|
| E1 | Solución correcta (la de referencia) | Superarse | 9/19 de código; 28/31 con solución guardada | ✅ **50/50** |
| E2 | Código base sin tocar | Fallar | 0/50 superadas | ✅ **0/50** superadas |
| E3 | «Trampa»: imprimir la salida esperada con `print` | Fallar | 19/19 superadas | ✅ **2/19** superadas (#10 y #11, que solo imprimen y no tienen otra forma de comprobarse) |

## 3. Paso de planeta (recorrido real)

Un alumno nuevo resuelve los ejercicios de cada planeta, con el reparto del mapa sobre la BD real:

| Tras completar | Puntos | Desbloquea |
|---|---|---|
| Mercurio (#1, #4, #10, #58, #60, #55) | 988 | Marte (500) ✅ |
| Venus (#16, #19, #63, #68) | 1738 | Júpiter (1000) ✅ |
| Tierra (#25, #28, #70) | 2263 | Saturno (1500) ✅ |

Los retos y la misión suman estrellas: el mínimo sin bonificación es 650, 1150 y 1500.

## 4. Manual
- El enunciado de un ejercicio reescrito (#28) se ve bien en la vista del ejercicio:
  - categoría «Bucles»;
  - objetivos con `código`;
  - resultado esperado completo. ✅

## 5. Notas
- **Solucionario:** está en `Desktop\claude\Astrocode\SOLUCIONARIO.md`, ordenado por planeta, con los puntos acumulados. **No se sube al repositorio**, porque tiene todas las soluciones.
- **Retos diarios repetidos:** resuelto en 7.4 (sección 6).
- **Puntos de Saturno:** sus ejercicios de código valen 500–700 puntos, frente a los 300 de sus retos. Se mantienen como estaban.

## 6. Retos diarios (7.4)

Miguel decidió quitar las copias y dejar preparados un par de retos más.

- **Migración `021_retos_diarios`:**
  - de cada reto diario repetido (mismo título, categoría «Reto Diario») se queda la copia más antigua;
  - antes de borrar las demás, su progreso pasa a la que se queda: completadas (si el alumno tenía dos, cuenta una), intentos, pistas y sabotajes;
  - los puntos ya ganados no cambian;
  - en la BD real las copias 49–54 no tenían nada asociado.
- **Dos retos nuevos** (`src/db/seeds/retosDiariosNuevos.ts`), con el mismo formato que los demás (una función, un ejemplo y 5 tests, 3 ocultos):
  - **Comprimir una señal:** `"aaabcc"` → `"a3b1c2"`;
  - **Dos señales que suman el objetivo:** las posiciones de la pareja que suma el objetivo.
- El reto del día rota ahora entre **5 retos distintos**: cada uno vuelve cada 5 días y solo puntúa la primera vez.
- **e2e:**
  - las pruebas de sabotaje crean sus propias copias de «Validar Paréntesis» (`copiaParentesis()`);
  - una prueba nueva comprueba que no hay títulos repetidos, que hay 5 retos y que los dos nuevos se superan con una solución y no con el código base.

| ID | Prueba | Resultado |
|---|---|---|
| R1 | e2e completo | ✅ 118/118 |
| R2 | Copia repetida **con** una completada, un intento y una pista → al aplicar 021, todo pasa al reto que se queda y la copia desaparece | ✅ |
| R3 | Todas las tareas: con su solución / con el código base | ✅ 46/46 superadas / 0/46 |
| R4 | `dailyChallenge` devuelve un reto | ✅ «Validar Paréntesis» |

