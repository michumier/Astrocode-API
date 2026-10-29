# AstroCode — Roadmap de funcionalidades

> Proyecto personal (ya no es el TFG). Punto de partida: `main` de los dos repos tras fusionar `fix/seguridad-y-correccion` (25-oct-2026).
> Se trabaja **fase a fase**: cada fase en su propia rama, probada en Docker y fusionada antes de empezar la siguiente.

## Índice

| Fase | Qué | Tamaño | Depende de |
|---|---|---|---|
| **0** ✅ | Base común: editor de código de verdad, router con URLs, registro de intentos, tipos de tarea, pruebas de extremo a extremo en CI | M | — |
| **1** ✅ | 🕵️ **Sabotaje**: el sistema rompe una solución y el alumno encuentra el fallo | M | 0 |
| **2** ✅ | 🚀 **Misiones de pilotaje**: el código del alumno controla una nave en una simulación | L | 0 |
| **3** ✅ | 🔭 **Caja negra**: ver la ejecución paso a paso con las variables animadas | M | 0 (editor) |
| **4** | 📊 **Puente de mando**: analíticas para profesores | M | 0 (intentos) |
| **5** | 🧪 **Retos insólitos**: 7 formatos nuevos (bomba, lengua alienígena, cámara acorazada, impostor, nebulosa, radio, colonia). Diseño en [`diseno/fase-5-retos.md`](diseno/fase-5-retos.md) | L+ (8 subfases) | 2 (motor de misiones) |

Tamaños: **S** ≈ una tarde · **M** ≈ 2-4 sesiones · **L** ≈ 5 o más sesiones.

**Por qué este orden:** la fase 0 desbloquea todo lo demás y empieza a guardar intentos cuanto antes, para que el puente de mando tenga datos reales cuando llegue. El sabotaje reutiliza casi todo lo que ya existe (es la que más rinde por hora). Las misiones son la pieza estrella. La caja negra y el puente de mando mejoran lo anterior.

**Leyenda de requisitos:** `RF` funcional · `RNF` no funcional · `CA` criterio de aceptación. Prioridad: **[M]** imprescindible · **[D]** deseable · **[O]** opcional (versión 2).

---

## Decisiones que hay que tomar

Cada decisión lleva la opción que recomiendo; si no se dice otra cosa, se aplica esa.

| # | Decisión | Recomendación |
|---|---|---|
| D1 ✅ | Editor de código | **CodeMirror 6** (ligero, con buen resaltado de Python y marcado de líneas). Monaco pesa unos 5 MB. |
| D2 ✅ | Navegación | **Migrar a `react-router-dom`** (ya está instalado) en la fase 0. Se van a añadir 5 vistas más y el router casero no da URLs ni botón «atrás». |
| D3 ✅ | Cómo se generan los sabotajes | **Mutaciones del árbol de sintaxis (AST)** como método principal: gratis, deterministas y sin IA. La **IA es opcional**, para bugs más «humanos». |
| D4 ✅ | Seguridad de las misiones | El código del alumno corre en un **proceso separado** de la simulación y se comunican por JSON. Así no puede tocar el estado de la simulación para hacer trampa. |
| D5 | Roles del puente de mando | **v1: un rol nuevo `profesor`** (el admin también entra), con estadísticas globales. **v2: grupos o clases** con código de invitación. |
| D6 ✅ | Guardar el código de cada intento | **Sí**, con una retención de 180 días y un aviso en el registro. Hace falta para el puente de mando y para la repetición de intentos. |

---

## Fase 0 — Base común

**Objetivo:** dejar listas las piezas que comparten todas las funcionalidades, para no tener que rehacerlas después.

### Requisitos

**Editor (web)**
- RF-0.1 [M] Sustituir el `<textarea>` de `Exercise.tsx` por CodeMirror 6, con resaltado de Python, números de línea, sangría automática a 4 espacios y tema oscuro espacial.
- RF-0.2 [M] El editor permite **marcar líneas** desde fuera: línea activa (la usará la caja negra) y línea con error (cuando Python da `línea N`, se marca en rojo).
- RF-0.3 [D] Atajos: `Ctrl+Enter` ejecuta y `Ctrl+Shift+Enter` envía la solución.

**Router (web)**
- RF-0.4 [M] Migrar `Router.tsx` a `react-router-dom` con estas rutas: `/login`, `/`, `/ejercicio/:id`, `/guia`, `/perfil`, `/admin`, `/ranking`.
- RF-0.5 [M] Ruta protegida: sin sesión, cualquier ruta lleva a `/login`; las rutas de admin o profesor comprueban el `rol`.
- RF-0.6 [M] `/ejercicio/:id` carga la tarea por id: recargar la página o compartir el enlace funciona.

**Registro de intentos (API)**
- RF-0.7 [M] Tabla `intentos`: cada `enviarSolucion` guarda usuario, tarea, código, si fue correcto, tests superados y totales, tipo de error de Python (`NameError`, `IndentationError`…), tiempo en la tarea y fecha.
- RF-0.8 [M] Una función `clasificarError(stderr)` extrae el tipo de excepción de la última línea del traceback.
- RF-0.9 [D] Las pistas pedidas (`pistas_ia`) se relacionan con el intento más reciente.

**Tipos de tarea (API)**
- RF-0.10 [M] Columna `tareas.tipo` con los valores `codigo` (los actuales), `sabotaje` y `pilotaje`.
- RF-0.11 [M] Columna `tareas.config` (JSON) para los datos propios de cada tipo (escenarios de una misión, id del sabotaje…).

**Calidad**
- RF-0.12 [M] Pasar los scripts de prueba que hemos usado (`e2e.mjs`, `e2e2.mjs`) a `test/e2e/` en la API, con un usuario por ejecución y un servidor falso de IA.
- RF-0.13 [M] El CI levanta el stack con `docker compose` y ejecuta esas pruebas en cada push.
- RF-0.14 [D] Borrar los tests de Jest rotos (usan `topRanking`, que no existe) o reescribirlos.

- RNF-0.1 El bundle de la web no debe crecer más de 300 KB comprimido por CodeMirror.
- RNF-0.2 Las migraciones nuevas (008 en adelante) solo añaden cosas: nunca borran datos.

### Modelo de datos
```sql
-- 008_intentos
CREATE TABLE intentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL, tarea_id BIGINT NOT NULL,
  codigo MEDIUMTEXT NOT NULL,
  correcto TINYINT(1) NOT NULL,
  tests_superados INT NULL, tests_totales INT NULL,
  tipo_error VARCHAR(50) NULL,          -- NameError, Timeout, Salida incorrecta...
  segundos_en_tarea INT NULL,
  creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY (tarea_id, creado_el), KEY (usuario_id, creado_el),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE
);
-- 009_tipo_tarea
ALTER TABLE tareas ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'codigo', ADD COLUMN config JSON NULL;
```

### Criterios de aceptación
- CA-0.1 Abrir `http://localhost:3000/ejercicio/1`, recargar y seguir en el mismo ejercicio.
- CA-0.2 Un error en la línea 3 marca la línea 3 del editor en rojo.
- CA-0.3 Cada envío crea una fila en `intentos` con el `tipo_error` correcto.
- CA-0.4 El CI ejecuta las pruebas de extremo a extremo contra Docker y falla si alguna falla.

### Tareas
- [x] Migraciones 008 y 009, y guardar el intento en `enviarSolucion` (S)
- [x] `clasificarError` con tests unitarios (S)
- [x] Componente `CodeEditor` con CodeMirror y API para marcar líneas (M)
- [x] Migración a react-router y carga de ejercicio por id (M)
- [x] Mover las pruebas de extremo a extremo al repo y a CI con docker compose (M)
- [x] Extra: query `misIntentos`, carga diferida del editor, modelo de IA actualizado

> Hecho en `feature/fase-0-base` (25-oct-2026). Resultados en `docs/pruebas/fase-0.md`.

---

## Fase 1 — 🕵️ Sabotaje

**Objetivo:** un nuevo tipo de misión en la que el alumno recibe código **casi correcto** con un bug sutil y tiene que encontrarlo y arreglarlo. Entrena leer y depurar código ajeno.

**Historias de usuario**
- *Como alumno*, al terminar un ejercicio se desbloquea «🕵️ Sabotaje en la sala de máquinas»: los sensores de la nave fallan y tengo que encontrar por qué.
- *Como alumno*, si arreglo el fallo cambiando muy poco código, gano la insignia «Cirujano».
- *Como admin*, genero sabotajes de un ejercicio con un clic, veo qué cambió cada uno y decido cuáles publicar.

### Cómo se genera un sabotaje
1. Se parte de una tarea con `solucion` y tests (todas las nuevas y los retos diarios los tienen).
2. **Mutador AST** (en el runner, Python `ast`) aplica **una** mutación de este catálogo:

   | Operador | Ejemplo | Enseña a ver… |
   |---|---|---|
   | Comparación | `<` → `<=`, `==` → `!=` | errores de límite |
   | Desplazamiento de uno | `range(n)` → `range(n-1)`, `i+1` → `i` | índices |
   | Aritmética | `+` → `-`, `//` → `/` | operadores |
   | Booleano | `and` → `or`, quitar un `not` | lógica |
   | Valor inicial | `total = 0` → `total = 1` | acumuladores |
   | Return | `return x` → `return y` (otra variable del ámbito) | flujo |
   | Sangría | sacar la última línea de un bucle fuera de él | bloques |
   | Mutable | `pila.pop()` → `pila.pop(0)` | estructuras |

3. **Verificación** (igual que el generador de ejercicios):
   - el código saboteado **se ejecuta** (ningún `SyntaxError`);
   - falla **al menos un test** (si no falla ninguno, el cambio es equivalente). *Cambio respecto al plan inicial: también se aceptan los que fallan todos los tests, como sabotajes «fáciles»; exigir que pasaran alguno descartaba casi todos los bugs aritméticos.*
   - la diferencia con la solución es de 1 a 3 líneas;
   - la firma de la función no cambia.
4. **Con IA (opcional):** se le pide un bug «que cometería un principiante» y una frase de contexto («El sistema de navegación calcula mal la distancia al último planeta…»). Pasa por la misma verificación.
5. **Dificultad** automática: más tests fallando significa más fácil de detectar. Un bug que solo falla en tests ocultos es «difícil».

### Requisitos
- RF-1.1 [M] Endpoint del runner `POST /mutate`: recibe código y número de variantes y devuelve mutaciones con su diff y su operador. Corre con el mismo aislamiento que `/run`.
- RF-1.2 [M] Tabla `sabotajes` y mutation de admin `generarSabotajes(tareaId, cantidad, usarIa)`. Devuelve candidatos **ya verificados**; el admin publica los que quiera con `publicarSabotaje`.
- RF-1.3 [M] Al publicar se crea una tarea `tipo='sabotaje'` cuyo `codigo_base` es el código saboteado. Reutiliza los tests, la solución y los puntos de la original, así que encaja con lo que ya existe: `enviarSolucion`, ranking, pistas e intentos.
- RF-1.4 [M] Se desbloquea al completar la tarea original. Si no está completada, la API devuelve `FORBIDDEN`.
- RF-1.5 [M] Interfaz: cartel de «alerta de sabotaje» con el contexto, el editor con el código roto, botón «Restaurar código saboteado» y un **diff opcional** al terminar («Este era el sabotaje: línea 4, `<` en vez de `<=`»).
- RF-1.6 [D] Insignia «Cirujano» si la corrección cambia tantas líneas como el sabotaje o menos (se compara con la solución usando `difflib`).
- RF-1.7 [D] Las pistas de nivel 3 en un sabotaje conocen la línea saboteada: «Mira la condición del bucle».
- RF-1.8 [O] Sabotaje diario: un sabotaje aleatorio de los ejercicios que el alumno ya ha completado.

- RNF-1.1 Generar 5 sabotajes verificados tarda menos de 10 s sin IA.
- RNF-1.2 El alumno nunca recibe la solución ni el diff antes de resolverlo.

### API (borrador)
```graphql
type Sabotaje { id: ID! tareaOriginalId: ID! operador: String! dificultad: String!
                diff: String!  # solo admin
                contexto: String publicada: Boolean! }
extend type Mutation {
  generarSabotajes(tareaId: ID!, cantidad: Int = 5, usarIa: Boolean = false): [Sabotaje!]!  # admin
  publicarSabotaje(id: ID!): Tarea!                                                         # admin
}
extend type Query { sabotajesDisponibles: [Tarea!]! }  # los desbloqueados por el alumno
```

### Criterios de aceptación
- CA-1.1 Con la tarea «Validar Paréntesis», `generarSabotajes(cantidad: 5)` devuelve entre 3 y 5 sabotajes. Cada uno se ejecuta y falla 1 test o más.
- CA-1.2 Un alumno que no ha completado la original no puede abrir el sabotaje.
- CA-1.3 Arreglar el bug suma puntos; volver a enviar no los suma otra vez.
- CA-1.4 Al terminar se ve el diff del sabotaje.

### Tareas
- [x] Mutador AST en el runner, con su catálogo y tests unitarios en Python (M)
- [x] Verificación y tabla `sabotajes` (migración 010) (S)
- [x] Mutations de admin y vista en el panel de admin (M)
- [x] Vista del alumno: cartel, desbloqueo y diff final (M)
- [x] Variante con IA reutilizando `services/ia.ts` (S)
- [x] Insignia «Cirujano» (S, aprovecha la tabla `insignias`, que ya existe)
- [x] Extra: tarjeta «Sala de máquinas» en el dashboard, pistas de sabotaje sin filtraciones, arreglo de maquetación del dashboard

> Hecho en `feature/fase-1-sabotaje` (25-oct-2026). Resultados y cambios respecto al plan en `docs/pruebas/fase-1.md`.

**Riesgos:** algunas mutaciones dan programas equivalentes (no cambian el comportamiento). La verificación las descarta, porque no fallan ningún test.

---

## Fase 2 — 🚀 Misiones de pilotaje

**Objetivo:** el alumno escribe una función que pilota una nave en una simulación física. Ve en un canvas cómo su código la hace aterrizar, esquivar o estrellarse.

**Historias de usuario**
- *Como alumno*, en Marte encuentro «Aterrizaje de emergencia»: escribo `piloto(sensores)`, pulso «Lanzar» y veo la nave descender. Si toco el suelo a más de 2 m/s, explota.
- *Como alumno*, mi solución tiene que funcionar en varios escenarios (gravedad, altura y combustible distintos), algunos ocultos. No vale con memorizar una secuencia de acciones.
- *Como alumno*, consigo de 1 a 3 estrellas según el combustible que me sobra.

### Arquitectura (D4)
```
API ──POST /mision──► runner
                        ├─ proceso MOTOR (código nuestro): física, sensores, fotogramas
                        │      ▲ JSON: sensores        │ JSON: acción
                        └─ proceso ALUMNO (sandbox): solo ejecuta piloto(sensores)
```
- El motor y el alumno se comunican con **una línea JSON por tick** a través de stdin/stdout.
- El proceso del alumno tiene los mismos límites que `/run`, más un **límite por tick** de 50 ms.
- Si el alumno no responde a tiempo, lanza una excepción o devuelve una acción no válida, la misión termina con un mensaje claro: «En el tick 37 tu función devolvió `None`».

### Misiones v1

| # | Misión | Planeta | Sensores | Acción | Éxito | Enseña |
|---|---|---|---|---|---|---|
| M1 | **Aterrizaje de emergencia** (1D) | Marte | `altura`, `velocidad`, `combustible`, `gravedad` | `empuje` entre 0 y 1 | tocar el suelo con \|v\| < 2 m/s | if/else; luego control proporcional |
| M2 | **Cinturón de asteroides** (carriles) | Júpiter | `carril`, `distancias` (lista por carril) | `"izquierda"`, `"derecha"` o `"mantener"` | sobrevivir N ticks | listas, `min`, `index` |
| M3 | **Recolector de cristales** (rejilla) | Saturno | `mapa` (matriz), `posicion`, `cristales` | `"N"`, `"S"`, `"E"` u `"O"` | recoger todos en T movimientos o menos | bucles, BFS |

### Requisitos
- RF-2.1 [M] Paquete `misiones/` en la imagen del runner con una clase base `Mision` (`reset(semilla, params)`, `sensores()`, `aplicar(accion)`, `terminado()`, `resultado()`) y M1 implementada.
- RF-2.2 [M] Simulación **determinista**: misma semilla y mismo código, mismo resultado (hace falta para corregir y para repetir).
- RF-2.3 [M] Endpoint `POST /mision`: recibe código, id de misión y escenarios. Devuelve por escenario `exito`, `motivo`, `ticks`, `metricas` y, solo en los escenarios visibles, `fotogramas` (estado reducido por tick).
- RF-2.4 [M] Tarea `tipo='pilotaje'` con `config = { mision: 'aterrizaje', escenarios: [{semilla, params, oculto}], estrellas: {...} }`. `enviarSolucion` delega en el corrector de misiones cuando el tipo es `pilotaje`.
- RF-2.5 [M] Mutation `probarMision(tareaId, codigo, escenario)` para lanzar sin enviar la solución (como «Ejecutar»).
- RF-2.6 [M] **Visor en canvas**: nave con llama proporcional al empuje, terreno, panel con altura, velocidad y combustible, controles (reproducir, pausa, ×0,5/×1/×2/×4, avanzar tick), explosión al estrellarse (reutilizando `PlanetParticles`) y celebración al aterrizar.
- RF-2.7 [M] Panel de resultados: escenarios superados (✅/❌, los ocultos sin datos), estrellas y motivo del fallo.
- RF-2.8 [M] Las misiones aparecen en su planeta del sistema solar, con candado según puntos, igual que ahora.
- RF-2.9 [D] Mostrar `print()` del alumno por tick en una consola lateral («registro de vuelo») para depurar.
- RF-2.10 [D] Gráfica de altura y velocidad en el tiempo bajo el canvas.
- RF-2.11 [O] Récord por misión: menos combustible gastado, con un mini-ranking.
- RF-2.12 [O] Ver el vuelo de otro alumno («fantasma») sin ver su código.

- RNF-2.1 Una misión de 500 ticks se simula en menos de 2 s, incluida la comunicación entre procesos.
- RNF-2.2 Los fotogramas por escenario visible no superan 200 KB.
- RNF-2.3 El visor va a 60 fps en un portátil normal y se adapta a móvil.
- RNF-2.4 El alumno no puede alterar el resultado: una prueba de seguridad intenta modificar el motor desde su código y debe fallar.

### Física de M1 (referencia)
```
cada tick (dt = 0,1 s):
  empuje = clamp(accion.empuje, 0, 1) si combustible > 0, si no 0
  aceleracion = empuje * EMPUJE_MAX - gravedad
  velocidad  += aceleracion * dt
  altura     += velocidad * dt
  combustible -= empuje * CONSUMO * dt
fin: altura <= 0  →  éxito si |velocidad| < 2, si no estrellado
estrellas: 1 = aterriza · 2 = sobra ≥ 30 % combustible · 3 = sobra ≥ 50 %
```

### Criterios de aceptación
- CA-2.1 `def piloto(s): return {"empuje": 1 if s["velocidad"] < -1.5 else 0}` aterriza en los escenarios de ejemplo y se ve en el canvas.
- CA-2.2 `return {"empuje": 0}` se estrella con el motivo «Impacto a 18,3 m/s».
- CA-2.3 Una solución que memoriza los ticks del escenario visible falla en los ocultos.
- CA-2.4 Un bucle infinito dentro de `piloto` termina la misión con «Tu piloto no respondió a tiempo (tick 1)».
- CA-2.5 Un intento de leer o modificar el estado del motor desde el código del alumno no tiene efecto.

### Tareas
- [x] Motor base, protocolo JSON y proceso separado del alumno (L)
- [x] M1 con tests unitarios del motor (M)
- [x] Endpoint `/mision`, corrector en la API y `probarMision` (M)
- [x] Visor en canvas y panel de resultados (L)
- [x] Integración en el sistema solar y desbloqueo (S)
- [x] M2 (M) · M3 (M)
- [x] Pruebas de seguridad del motor (S)
- [x] Extra: gráfica de altura y velocidad (RF-2.10), registro de vuelo (RF-2.9), borrador guardado en el navegador

> Hecho en `feature/fase-2-pilotaje` (26-oct-2026). Resultados y decisiones en `docs/pruebas/fase-2.md`. Pendiente: RF-2.11 (récords) y RF-2.12 (vuelos fantasma).

**Riesgos:** el ajuste de la física (que M1 no sea ni trivial ni imposible) se resuelve con una solución de referencia y probando varias semillas. La comunicación por tick puede ser lenta; si hiciera falta, el alumno podría responder por lotes de ticks.

---

## Fase 3 — 🔭 Caja negra (visualizador paso a paso)

**Objetivo:** ver cómo se ejecuta el programa línea a línea, con las variables dibujadas como carga de la nave. Pensado para entender bucles, listas y recursión.

**Historias de usuario**
- *Como alumno*, pulso «🔭 Ver ejecución», arrastro una línea temporal y veo qué línea se ejecuta y cómo cambian las variables.
- *Como alumno*, cuando falla un test visible, pulso «Ver qué pasó en este test» y salto directamente al paso donde algo se tuerce.

### Requisitos
- RF-3.1 [M] Endpoint del runner `POST /trace`: ejecuta el código con `sys.settrace` y registra eventos `line`, `call`, `return` y `exception` **solo del archivo del alumno**, con una instantánea de las variables locales en cada paso.
- RF-3.2 [M] Las variables se serializan de forma segura: `repr` recortado a 200 caracteres, profundidad máxima 3, listas y diccionarios hasta 50 elementos, objetos como `{clase, atributos}` y detección de ciclos.
- RF-3.3 [M] Límites: 1.000 pasos como máximo (configurable). Si se superan, se corta con el aviso «Se muestran los primeros 1.000 pasos».
- RF-3.4 [M] Mutation `trazarEjecucion(codigo, stdin)` (requiere sesión, con límite de uso) y variante `trazarTest(tareaId, codigo, indiceTest)` solo para tests visibles.
- RF-3.5 [M] Interfaz:
  - línea temporal con reproducir, pausa, paso adelante y paso atrás;
  - línea actual resaltada en el editor (RF-0.2);
  - panel de variables donde los números, textos y booleanos son fichas, las listas compartimentos con índice y los objetos cajas con sus atributos;
  - pila de llamadas como naves apiladas;
  - salida acumulada hasta ese paso.
- RF-3.6 [M] La variable que cambió en el paso actual destaca con una animación breve.
- RF-3.7 [D] El paso de la excepción se marca en rojo y la línea temporal salta ahí automáticamente.
- RF-3.8 [O] Flechas de referencia cuando dos variables apuntan al mismo objeto (aliasing).

- RNF-3.1 Una traza de 1.000 pasos ocupa menos de 1 MB y se genera en menos de 3 s.
- RNF-3.2 Mismo aislamiento que `/run`.

### Criterios de aceptación
- CA-3.1 Con un bucle `for` de 5 vueltas, la línea temporal tiene los pasos esperados y `total` va cambiando.
- CA-3.2 Con `invertir_arbol` recursivo, la pila de llamadas crece y decrece correctamente.
- CA-3.3 Con `while True:` se corta en 1.000 pasos con aviso, sin colgarse.

### Tareas
- [x] Trazador en el runner con serializador seguro y tests (M)
- [x] Mutations en la API (S)
- [x] Componente `CajaNegra`: línea temporal, variables y pila (L)
- [x] «Ver qué pasó en este test» desde el resultado de los tests (S)

> Hecho en `feature/fase-3-caja-negra` (26-oct-2026). Resultados en `docs/pruebas/fase-3.md`. Pendiente: RF-3.8 (flechas de aliasing).

---

## Fase 4 — 📊 Puente de mando (profesores)

**Objetivo:** que un profesor vea dónde se atasca la gente y por qué, con datos de la tabla `intentos`.

**Historias de usuario**
- *Como profesor*, veo que en «Encontrar el Número Faltante» el 70 % falla el test «Falta el primero» y entiendo qué concepto no se ha explicado bien.
- *Como profesor*, recibo una lista de alumnos atascados para echarles una mano.
- *Como profesor*, abro el historial de un alumno en un ejercicio y veo cómo evolucionó su código intento a intento.

### Requisitos
- RF-4.1 [M] Rol `profesor` (D5): el admin también tiene acceso. Ruta `/puente`.
- RF-4.2 [M] **Resumen**: alumnos activos (7 y 30 días), envíos por día (gráfica), porcentaje de acierto global y pistas usadas.
- RF-4.3 [M] **Por ejercicio**: porcentaje de acierto, intentos medios hasta acertar, tiempo medio y **mapa de calor de tests × porcentaje de fallo**.
- RF-4.4 [M] **Errores más frecuentes** por ejercicio y en global (de `tipo_error`), con una explicación corta de cada uno.
- RF-4.5 [M] **Alumnos atascados**: 5 o más intentos fallidos o 3 o más pistas en la misma tarea en las últimas 48 h sin acertar. Configurable.
- RF-4.6 [M] **Ficha de alumno**: progreso por categoría y, por ejercicio, la lista de intentos con el **diff entre intentos consecutivos** (repetición del intento).
- RF-4.7 [D] Exportar cualquier tabla a CSV.
- RF-4.8 [D] Resumen semanal generado con IA: «Esta semana el mayor problema fue…», a partir de los datos agregados (sin código de alumnos).
- RF-4.9 [O] Grupos o clases con código de invitación; el profesor solo ve sus grupos.
- RF-4.10 [O] Repetición pulsación a pulsación (pide guardar eventos del editor: valorar privacidad y volumen de datos).

- RNF-4.1 Todas las consultas agregadas responden en menos de 500 ms con 100.000 intentos (índices en `intentos`).
- RNF-4.2 **Privacidad**: aviso en el registro de que se guardan los intentos, retención de 180 días con limpieza automática al arrancar, y los alumnos no ven datos de otros.
- RNF-4.3 Gráficas con una librería ligera (Recharts) o SVG propio.

### Criterios de aceptación
- CA-4.1 Con datos de prueba, el mapa de calor coincide con un cálculo a mano.
- CA-4.2 Un alumno con 6 fallos seguidos en una tarea aparece en «atascados».
- CA-4.3 Un usuario `alumno` recibe `FORBIDDEN` en todas las queries del puente.

### Tareas
- [ ] Rol `profesor`, queries agregadas e índices (M)
- [ ] Vistas de resumen y por ejercicio con mapa de calor (M)
- [ ] Alumnos atascados y ficha con diff de intentos (M)
- [ ] Script de datos de prueba (`seed-intentos`) para desarrollar con volumen (S)
- [ ] CSV y resumen con IA (S)

---

## Fase 5 — 🧪 Retos insólitos

Siete formatos de ejercicio nuevos sobre el motor de misiones: 💣 bomba, 👽 lengua alienígena, 🔐 cámara acorazada, 🔍 impostor, 🎨 nebulosa, 🎵 radio y 🧬 colonia.
El diseño completo (requisitos, ejecución, frontales, riesgos y pruebas) está en **[`docs/diseno/fase-5-retos.md`](diseno/fase-5-retos.md)**. Aquí solo se lleva el avance.

### Tareas
- [x] 5.0 Motor de retos (E1–E5), `tipo='reto'`, `VistaReto` (M) — pruebas en `docs/pruebas/fase-5.0.md`
- [x] 5.1 💣 Bomba: B1, B2 (M) — pruebas en `docs/pruebas/fase-5.1.md`
- [x] 5.2 👽 Lengua alienígena: L1, L2, L3 (M) — pruebas en `docs/pruebas/fase-5.2.md`
- [x] 5.3 🔐 Cámara acorazada: C1, C2, C3 (M) — pruebas en `docs/pruebas/fase-5.3.md`
- [x] 5.4 🔍 Impostor: I1, I2 (M) — pruebas en `docs/pruebas/fase-5.4.md`
- [x] 5.5 🎨 Nebulosa: N1, N2 (S) — pruebas en `docs/pruebas/fase-5.5.md`
- [x] 5.6 🎵 Radio: R1, R2, R3 (M) — pruebas en `docs/pruebas/fase-5.6.md`
- [x] 5.7 🧬 Colonia: Co1 (M) — pruebas en `docs/pruebas/fase-5.7.md`

---

## Fase 6 — 🎨 Rediseño del frontal

Llevar la web «a otro nivel» sin tocar lo que la identifica: **el sistema solar con los planetas girando y el logo se quedan**. Prediseño aprobado el 29-oct-2026 ([lienzo](https://claude.ai/artifact/EhzYLRtiZoSsgY135Ff24G)):
- **Color:** sale del logo. Fondo azul noche y paneles planos, sin cristal ni degradados. Turquesa para el progreso, **oro para la acción principal** y los puntos, y coral solo para lo «Difícil».
- **Progreso:** cada planeta es una **constelación** y cada ejercicio, una estrella que se enciende.
- **Botón principal:** en oro, con una puntada discontinua interior; se hunde un poco al pulsar.
- **Tipografía:** Bricolage Grotesque en los títulos, Onest para leer y JetBrains Mono para el código.
- **Todo en español** e iconos SVG en lugar de emojis en la interfaz.
- **Público:** de 18 a 23 años.
- **Órbitas:** planas, como ahora.
- **Herramientas:** el trabajo se apoya en las skills de diseño Impeccable y de Emil Kowalski (instaladas solo en el proyecto web).

### Tareas
- [x] 6.0 Base: tokens de color y tipografía, fuentes servidas por la propia web, estilos globales (selección, foco, barras de desplazamiento) y kit de componentes (botón, etiqueta, panel, campo, aviso, iconos, barra superior, constelación) (M) — pruebas en `docs/pruebas/fase-6.0.md`
- [x] 6.1 Mapa: el sistema solar con los planetas repartidos y las etiquetas derechas, la constelación del planeta en curso, el reto diario, el ranking sin correos, «Sigue donde lo dejaste» y el panel lateral del planeta (M) — pruebas en `docs/pruebas/fase-6.1.md`
- [x] 6.2 Ejercicio: enunciado con Markdown, una sola acción principal, salida con las pruebas, AstroTutor; caja negra y sabotaje con los nuevos estilos (M) — pruebas en `docs/pruebas/fase-6.2.md`
- [ ] 6.3 Retos y misiones: el marco de `VistaReto` y del visor de misiones con el nuevo sistema; los visores de cada formato se mantienen y se ajustan los colores (M)
- [ ] 6.4 Acceso: bienvenida, entrar y crear cuenta (S)
- [ ] 6.5 Perfil, ranking completo y guía de Python (M)
- [ ] 6.6 Panel de administración, repaso en móvil, auditoría final (accesibilidad, rendimiento, detector de Impeccable) y documento del sistema de diseño (M)

---

## Reglas para todas las fases
- **Rama `feature/` por fase** (`feature/fase-1-sabotaje`…) en cada repo afectado. Claude prepara la PR y Miguel revisa y fusiona.
- **Plan de pruebas obligatorio al terminar cada fase** (`docs/pruebas/fase-N.md` en la API): pruebas automáticas y manuales con su resultado. **No se pasa a la siguiente fase sin ejecutarlo entero en verde.**
- **Docker primero**: todo se prueba con `docker compose up --build`. Si el runner cambia, hay que reconstruir su imagen.
- Migraciones numeradas a continuación de la 007, **solo aditivas**.
- Cada fase añade sus pruebas a `test/e2e` (RF-0.12) antes de darse por terminada.
- La IA es **siempre opcional**: sin `NVIDIA_API_KEY` todo funciona, solo desaparecen los botones de IA.
- La IA nunca decide puntos ni corrige: eso lo hacen los tests y la simulación.
