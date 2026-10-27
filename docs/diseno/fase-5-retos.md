# Fase 5: 🧪 Retos insólitos (diseño)

> Diseño completo de los 7 formatos nuevos de ejercicio, previo a programar nada.
> Estado: **pendiente de aprobación**. La fase 4 (puente de mando) sigue pendiente y es independiente.

## Índice
1. [La idea](#1-la-idea)
2. [Arquitectura común](#2-arquitectura-común)
3. [Pantalla común (VistaReto)](#3-pantalla-común-vistareto)
4. Formatos:
   - [4.1 💣 Desactiva la bomba](#41--desactiva-la-bomba)
   - [4.2 👽 La lengua alienígena](#42--la-lengua-alienígena)
   - [4.3 🔐 La cámara acorazada](#43--la-cámara-acorazada)
   - [4.4 🔍 Hay un impostor a bordo](#44--hay-un-impostor-a-bordo)
   - [4.5 🎨 Pinta la nebulosa](#45--pinta-la-nebulosa)
   - [4.6 🎵 La señal de radio](#46--la-señal-de-radio)
   - [4.7 🧬 La colonia](#47--la-colonia)
5. [Mapa de niveles](#5-mapa-de-niveles)
6. [Riesgos](#6-riesgos)
7. [Plan de pruebas común](#7-plan-de-pruebas-común)
8. [Subfases y orden](#8-subfases-y-orden)
9. [Decisiones](#9-decisiones)

---

## 1. La idea

Cada formato es **una mecánica distinta**, no un ejercicio de «escribe una función y compara la salida». Todos comparten tres reglas:

1. **El alumno escribe una función con un papel**: desactivar, investigar, traducir, abrir, pintar, transmitir, legislar.
2. **El resultado se ve, o se oye**, con una animación que cuenta qué ha hecho su código: el cable que se corta, el dial que gira, la colonia que crece.
3. **Se corrige con escenarios ocultos** generados por semilla. Lo que se ve en pantalla no basta para aprobar: hay que resolver el problema de verdad.

---

## 2. Arquitectura común

### 2.1 Se reutiliza el motor de misiones (fase 2)

El motor ya resuelve lo difícil:
- un proceso aislado para el código del alumno;
- la simulación en otro proceso al que el alumno no tiene acceso;
- escenarios con semilla y escenarios ocultos;
- tiempos límite y registro de los `print`.

Cada formato nuevo es **una clase `Mision` más** en `python-runner/misiones/`. Para encajar los 7 formatos hacen falta **cinco ampliaciones** del motor, compatibles con las 3 misiones actuales:

| # | Ampliación | Para qué | Quién la usa |
|---|---|---|---|
| **E1** | **Nombre de función configurable** (`funcion = 'desactivar'`), en lugar de `piloto` fijo | Que cada formato tenga su verbo | Todos |
| **E2** | **Argumentos posicionales**: el motor envía `{"args": [...]}` y el harness llama a `funcion(*args)` | `color(x, y, ancho, alto)`, `regla(viva, vecinas)` | Nebulosa, Colonia |
| **E3** | **Lotes**: `{"lote": [[args], ...]}` → `{"acciones": [...]}`. Hasta 512 llamadas por mensaje. Si una falla, el error dice con qué argumentos (`con x=3, y=7`) | Evitar 4.096 idas y vueltas por la tubería | Nebulosa, Colonia |
| **E4** | **Consultas (RPC)**: el harness inyecta un objeto (`caja`) cuyo método `probar()` envía `{"consulta": ...}` al motor y espera la respuesta **sin salir de la función del alumno**. El secreto vive solo en el proceso del motor | El alumno *pregunta* en lugar de *responder* | Cámara acorazada |
| **E5** | **Material público**: endpoint nuevo `POST /reto/material` que genera **sin ejecutar código del alumno** los datos visibles de cada escenario visible (los ejemplos, el manual con la bomba concreta, el expediente, la imagen objetivo). La API lo cachea en memoria por tarea, porque es determinista | Que el alumno vea el problema **antes** de escribir código | Todos menos la Colonia |

Además:
- **Fotogramas compactos**: cada formato decide qué guarda (un fotograma por acción, por generación o solo el final). Tope de **2 MB** de detalle por escenario; si se pasa, se recorta y se avisa.
- **Errores con contexto**: si la función devuelve algo con la forma equivocada, el mensaje dice qué se esperaba (`devolviste 3 filas, se esperaban 5`). Cada formato valida su salida en `aplicar()` y lanza `AccionInvalida` con un texto pensado para el alumno.

### 2.2 Datos

- **`tareas.tipo = 'reto'`** (valor nuevo, sin migración de esquema: la columna ya es `VARCHAR(20)`).
- **`tareas.config`** usa el mismo formato que las misiones, más dos claves de presentación:
  ```json
  {
    "mision": "bomba",
    "formato": "bomba",
    "variante": "cables",
    "escenarios": [
      { "nombre": "Bomba del hangar", "semilla": 101, "params": { "cables": 4 } },
      { "semilla": 9001, "params": { "cables": 6 }, "oculto": true }
    ]
  }
  ```
- Los retos se siembran con una **migración por subfase** (013, 014…), igual que la 012 sembró las misiones. Son solo aditivas e idempotentes (comprueban el título antes de insertar).
- Corrección, puntos, intentos y estrellas: se reutiliza `services/misiones.ts` tal cual (`corregirMision`, `probarEscenario`, `tipoErrorMision`). La tarea se aprueba si se superan **todos** los escenarios.

### 2.3 Qué viaja al navegador

| Dato | Escenario visible | Escenario oculto |
|---|---|---|
| Nombre | ✅ | «Escenario oculto» |
| Material público (E5) | ✅ antes de ejecutar | ❌ nunca |
| Semilla y parámetros | ❌ | ❌ |
| Resultado de la ejecución | ✅ con fotogramas y registro | Solo ✅/❌ y un motivo genérico |
| Solución, culpable o secreto | ✅ **solo tras fallar un visible** (para aprender) | ❌ nunca |

### 2.4 Integraciones con lo que ya existe

- **💡 Pistas con IA**: funcionan igual. El prompt recibe el enunciado y el material visible, **nunca** los ocultos. Hay reglas por formato (ver cada uno). El detector de fugas de la fase 1 se aplica también aquí.
- **🔭 Caja negra** *[D]*: el botón «Ver ejecución» traza la función del alumno con la entrada del escenario visible seleccionado (el test es `desactivar(<bomba del escenario>)`). Sale casi gratis con E5.
- **Badges en el mapa**: cada formato tiene su etiqueta (`💣 Bomba`, `👽 Lengua`…) en lugar de `🚀 Misión`.
- **Panel de admin**: en v1 los retos se crean por migración. Crear variantes desde el panel queda como *[O]*.

---

## 3. Pantalla común (VistaReto)

`MisionView` se generaliza en **`VistaReto`**: la estructura es la misma, y lo que cambia es el **visor** y las **pestañas de material**, que son componentes por formato registrados en un mapa (`VISORES[formato]`, `MATERIALES[formato]`).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Volver   💣 Bomba del hangar                 Fácil · 150 pts · ⭐⭐⭐       │
├──────────────────────────────────┬───────────────────────────────────────────┤
│ [📜 Misión] [📕 Manual]  ← pestañas│  Escenario: [Bomba del hangar ▾]          │
│ ┌──────────────────────────────┐ │  [▶ Probar]  [📡 Enviar]                  │
│ │ def desactivar(bomba):       │ │ ┌───────────────────────────────────────┐ │
│ │     cables = bomba["cables"] │ │ │                                       │ │
│ │     ...                      │ │ │          VISOR DEL FORMATO            │ │
│ │                              │ │ │      (SVG / canvas / audio)           │ │
│ │                              │ │ │                                       │ │
│ └──────────────────────────────┘ │ └───────────────────────────────────────┘ │
│ [💡 Pista 1/3] [🔭 Ver ejecución] │  📟 Registro (tus print)                  │
│                                  │  Resultado: ✅ Hangar ✅ Cocina 🔒✅ 🔒❌ │
└──────────────────────────────────┴───────────────────────────────────────────┘
```

- **Probar** ejecuta solo el escenario visible elegido, con animación completa y sin puntuar. **Enviar** corrige todo.
- **El material está visible desde el principio**: el manual, los ejemplos, el expediente o la imagen objetivo.
- **Móvil (< 900 px)**: todo en una columna (pestañas, editor, botones, visor, resultado), con el visor a ancho completo.
- **`prefers-reduced-motion`**: sin sacudidas ni explosiones. Las animaciones se cambian por transiciones cortas de color.
- **El código se guarda en `localStorage`** por tarea, como en las misiones.
- **Colores accesibles**: toda información de color va acompañada de texto o patrón (cables etiquetados, números en las celdas opcionales).

---

## 4.1 💣 Desactiva la bomba

> Hay una bomba en la nave, un manual de desactivación y 30 segundos. Tu función lee la bomba y decide qué cortar.

### Dónde encaja
| Reto | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|
| **B1 · Bomba de cables** | Fácil | Estructuras Condicionales | 150 | [M] |
| **B2 · Bomba de módulos** | Intermedio | Funciones | 200 | [M] |
| B3 · Bomba con memoria (varias fases con lo que pasó antes) | Difícil | Estructuras de Datos | 300 | [O] |

### Qué escribe el alumno
**B1:**
```python
def desactivar(bomba):
    # bomba = {"cables": ["rojo", "azul", "blanco", "azul"], "serie": "K7Q2M5"}
    return 0   # posición del cable que cortas (0 = el primero)
```

📕 **Manual B1** (se aplica **la primera regla que se cumpla**):
1. Si no hay ningún cable rojo → corta el **segundo** cable.
2. Si el último cable es blanco → corta el **último** cable.
3. Si hay más de un cable azul → corta el **último cable azul**.
4. Si la última cifra del número de serie es impar → corta el **último** cable.
5. En cualquier otro caso → corta el **primero**.

Se practican: `in`, `count`, índices negativos, búsqueda del último, `int()`, `%` e `if/elif` ordenados. El reto de verdad es **leer la especificación con cuidado**.

**B2:** la bomba tiene tres módulos y se devuelve un diccionario:
```python
def desactivar(bomba):
    # bomba = {"cables": [...], "serie": "...", "baterias": 2,
    #          "boton": {"color": "azul", "texto": "ABORTAR"},
    #          "teclado": ["🛸", "🌙", "☄️", "🪐"]}
    return {"cables": 1, "boton": "mantener", "teclado": ["🌙", "🛸", "🪐", "☄️"]}
```
- **Cables:** el manual B1.
- **Botón:** cuatro reglas en el mismo estilo, que combinan el color, el texto y las baterías.
- **Teclado:** el manual trae **4 columnas de 7 símbolos espaciales**. Exactamente una columna contiene los 4 símbolos de la bomba, y hay que pulsarlos en el orden de esa columna.
- El enunciado anima a escribir **una función por módulo**: el reto premia descomponer.

> Las reglas y los símbolos son **nuestros**. Se inspira en la mecánica de juegos de desactivación, pero no copia ningún manual existente.

### Ejecución
- **Motor:** una llamada por bomba (un tick). El generador elige **primero qué regla debe aplicarse** y construye una bomba en la que esa sea la primera que se cumple. Así se garantiza que todas las reglas salen en los escenarios.
- **Escenarios:** 3 visibles (cada uno con una regla distinta) y 7 ocultos, que cubren todas las reglas al menos una vez y cuentan con casos límite (3 y 6 cables, serie terminada en 0).
- **Éxito:** la acción coincide con la de referencia. **Estrellas:** ⭐⭐⭐ si se aprueba (el formato no tiene métrica de eficiencia que tenga sentido).
- **Errores claros:** `Devolviste 7, pero la bomba solo tiene 4 cables (posiciones 0 a 3)`; `En B2 falta la clave "teclado"`.
- Si se falla un escenario visible, se muestra **qué regla había que aplicar** y qué cable era. Es el momento de aprender.

### Frontal
```
┌─────────────── VISOR ───────────────┐
│  ┌──────────────────────────────┐   │
│  │  [ 00:27 ]   SERIE K7Q2M5 🔋🔋 │   │   ← LCD rojo con cuenta atrás
│  │                              │   │
│  │  ═══════ rojo ════════════   │   │
│  │  ═══════ azul ════════════   │   │   ← cables SVG con etiqueta de color
│  │  ═══════ blanco ═══✂ ═════   │   │   ← animación de las tijeras
│  │  ═══════ azul ════════════   │   │
│  │                     ● LED    │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```
- **Animación** (unos 3 s): la cuenta atrás corre, las tijeras van hasta el cable elegido y lo cortan con una chispa. Si es correcto, el LED se pone verde y la cuenta se para. Si no, hay un destello, una sacudida y aparece el aviso «💥 BOOM — había que cortar el 3.er cable (regla 3)».
- **B2:** los tres módulos en rejilla (cables, botón grande, teclado 2×2) y su animación uno detrás de otro. Cada módulo tiene su propio LED.
- **Pestaña 📕 Manual:** un manual con aspecto de documento técnico, con las reglas numeradas. En B2, las 4 columnas del teclado dibujadas como tabla.

### IA
Las pistas pueden señalar **qué regla se está evaluando mal** («revisa el orden en que compruebas las reglas»), pero no dar la posición del cable.

### Riesgos propios
- **Ambigüedad del manual** («segundo cable»: ¿posición 1 o 2?). Se resuelve con un glosario en el enunciado («las posiciones empiezan en 0; "el segundo" es la posición 1») y con la comprobación del primer escenario visible.
- **Daltonismo:** los cables llevan el nombre escrito y una textura (rayado, punteado…).

---

## 4.2 👽 La lengua alienígena

> Unos alienígenas transforman rejillas de colores siguiendo una regla. Nadie te la dice: la descubres con los ejemplos y la programas.

### Dónde encaja
| Reto | Regla secreta | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|---|
| **L1 · El espejo** | Cada fila se invierte (simetría horizontal) | Fácil | Arrays y Listas | 150 | [M] |
| **L2 · La gravedad** | Las celdas de color caen hasta el fondo de su columna, en orden | Intermedio | Arrays y Listas | 200 | [M] |
| **L3 · Los lagos** | Los huecos negros **encerrados** por paredes grises se llenan de azul; los conectados al borde no | Difícil | Grafos y Árboles | 300 | [M] |
| L4 · El más grande | Solo sobrevive el objeto (grupo conectado) más grande | Difícil | Grafos y Árboles | 300 | [D] |

### Qué escribe el alumno
```python
def transformar(rejilla):
    # rejilla = lista de filas; cada celda es un color del 0 al 9
    # [[0, 2, 2],
    #  [0, 0, 5],
    #  [3, 0, 0]]
    return rejilla
```
**Paleta fija y compartida con la nebulosa (D8):** 0 negro (vacío) · 1 azul · 2 rojo · 3 verde · 4 amarillo · 5 gris · 6 morado · 7 naranja · 8 cian · 9 granate.

### Ejecución
- **Motor:** una llamada por rejilla (un tick). Cada reto es un **generador** (semilla → rejilla de 3×3 a 12×12) más la **regla de referencia**, que vive en el motor.
- **Escenarios:**
  - 3 o 4 **ejemplos visibles**, elegidos para que **la regla no sea ambigua**. Por ejemplo, en L2 hay un ejemplo con huecos intermedios que descarta «ordenar la columna».
  - 6 **ocultos**: tamaños nuevos, rejillas no cuadradas y casos límite (rejilla vacía, columna llena, lago dentro de otro lago en L3).
- **Éxito:** rejilla idéntica. **Estrellas:** ⭐⭐⭐ si se aprueba.
- **Validación de la salida:** que sea una lista de listas, rectangular, con enteros del 0 al 9. Si no, sale un error que dice qué fila o qué celda falla.

### Frontal
**Pestaña 🛸 Ejemplos**, siempre visible:
```
  Ejemplo 1                      Ejemplo 2
  ┌─┬─┬─┐      ┌─┬─┬─┐           ┌─┬─┬─┬─┐      ┌─┬─┬─┬─┐
  │■│ │■│  ──▶ │ │ │ │           │ │■│ │ │  ──▶ │ │ │ │ │
  ├─┼─┼─┤      ├─┼─┼─┤           ...             ...
```
**Visor al probar**, tres rejillas por ejemplo: `Entrada → Tu resultado → Esperado`.
- Tu resultado se **pinta celda a celda** (unos 0,8 s). Las celdas incorrectas parpadean con borde magenta y aparece un contador: «4 celdas distintas».
- Interruptor **«🔢 Ver números»**, que muestra el número de color en cada celda (accesibilidad y depuración).
- Si todo coincide, las tres rejillas hacen un pequeño destello verde y sale «🛸 Los alienígenas te entienden».

### IA
Este es el formato más delicado, porque **la pista puede revelar la regla**, que es el reto entero:
- **Nivel 1:** solo preguntas que ayudan a observar («¿qué cambia y qué se queda igual entre entrada y salida?, ¿cambia el número de celdas de cada color?»).
- **Nivel 2:** puede nombrar el **concepto** (simetría, columnas, conectividad), pero no la regla.
- **Nivel 3:** puede describir la regla en palabras, pero no dar el código.

### Riesgos propios
- **Que la regla admita varias interpretaciones.** Mitigación:
  - para cada reto se escriben **dos o tres reglas alternativas plausibles** como «soluciones trampa» en los tests, y se comprueba que **al menos un ejemplo visible las descarta**;
  - además, el enunciado puede llevar una **frase-pista narrativa** («los alienígenas viven en un planeta con mucha gravedad…»).

---

## 4.3 🔐 La cámara acorazada

> La cámara del banco de Ceres tiene un código entre 1 y un millón. Puedes probar números y la cerradura te dice «mayor» o «menor», pero a los 20 intentos salta la alarma.

### Dónde encaja
| Reto | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|
| **C1 · La cámara de Ceres** (más alto o más bajo) | Intermedio | Algoritmos de Búsqueda | 200 | [M] |
| **C2 · La cerradura de combinación** (4 cifras distintas: «exactos» y «descolocados») | Difícil | Optimización | 300 | [M] |

### Qué escribe el alumno
**C1:**
```python
def abrir(caja):
    # caja.minimo, caja.maximo, caja.intentos   (datos públicos)
    respuesta = caja.probar(500000)   # "mayor", "menor" o "abierta"
    ...
```
**C2:**
```python
def abrir(caja):
    r = caja.probar("0123")   # {"exactos": 1, "descolocados": 2}  o  "abierta"
```
- **C1 se puede abrir siempre**: el número de intentos es `maximo.bit_length()` (20 para un millón), que es justo lo que necesita una búsqueda binaria. Comprobado.
- **C2:** 10 intentos. La estrategia sencilla («pruebo siempre la primera combinación compatible con todo lo que sé») abre **todas** las 5.040 combinaciones en 9 intentos como máximo (media de 5,56). Lo he comprobado con un script, así que 10 es justo pero siempre se puede.

### Ejecución
- **Motor:** ampliación **E4 (consultas)**. Una sola llamada a `abrir(caja)`: cada `probar()` viaja al motor, que guarda el secreto y cuenta los intentos.
- **Éxito:** la cerradura queda abierta antes de agotar los intentos.
  - Un intento de más significa **alarma** y fallo. La siguiente llamada a `probar()` lanza una excepción `Alarma` que se puede ver en el registro.
  - Un `probar()` fuera de rango o mal formado (`probar("12")` en C2) cuenta como intento y avisa en el registro.
- **Estrellas:**
  - C1: ⭐⭐⭐ si se aprueba.
  - C2: ⭐ si se abre en ≤ 10 intentos, ⭐⭐ en ≤ 8 y ⭐⭐⭐ en ≤ 7 en el peor escenario.
- **Escenarios:**
  - C1: 2 visibles (rango de 1.000 y de un millón) y 6 ocultos, con los extremos (el código es 1, el máximo, un número justo en la mitad) y un rango de mil millones (30 intentos).
  - C2: 2 visibles y 6 ocultos, incluido el peor caso conocido de la estrategia sencilla.
- **Protección:** el secreto **nunca** sale del proceso del motor. El objeto `caja` del alumno es un proxy sin estado. Inspeccionarlo, o leer la memoria o los ficheros, no da nada.

### Frontal
**C1:**
```
        ╭───────────╮
       ╱  ◜  250000 ◝ ╲        ← dial que gira hasta el número probado
      │   ◟    ▲    ◞  │
       ╲      MAYOR   ╱        ← indicador ▲ / ▼ con luz
        ╰───────────╯
  Intentos ● ● ● ● ● ● ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
  Rango posible:  |▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░|   ← la barra se reduce a la mitad
                  1        250000         1000000
```
- **La barra del rango posible es la clave didáctica:** se ve cómo cada intento descarta la mitad. Con la fuerza bruta, la barra apenas se mueve y las luces de intentos se agotan.
- Al abrirse, la puerta gira, se ve el oro y sale «🔓 Abierta en 17 intentos».
- **C2:** cuatro dígitos como tubos de neón, un historial de intentos con fichas ●○ (exactos y descolocados) y un contador de «combinaciones aún posibles» calculado por el motor, que baja de 5.040 a 1.

### IA
Puede sugerir «¿y si cada intento descartara la mitad?» en el nivel 2. En C2, puede hablar de «quedarte con las combinaciones compatibles», pero no dar el algoritmo.

### Riesgos propios
- **E4 es la ampliación más nueva del motor.** Riesgos: bloqueos (el motor espera un mensaje y el alumno, otro) y el alumno haciendo `print` en medio de una consulta. Mitigación:
  - las consultas usan el mismo canal JSON y el mismo control de tiempos que hay ahora;
  - el registro se envía en cada mensaje;
  - tests específicos (consulta tras alarma, excepción dentro de `abrir`, 0 consultas).

---

## 4.4 🔍 Hay un impostor a bordo

> Han saboteado el reactor de la estación Hiperión. Tienes los registros de las puertas y te toca encontrar al culpable con código.

### Dónde encaja
| Reto | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|
| **I1 · Sabotaje en el reactor**: ¿quién estaba en la sala en ese minuto? | Intermedio | Estructuras de Datos | 200 | [M] |
| **I2 · La tarjeta clonada**: ¿qué tarjeta hizo un recorrido imposible? | Difícil | Grafos y Árboles | 300 | [M] |

### Qué escribe el alumno
**I1:**
```python
def investigar(caso):
    # caso = {
    #   "crimen": {"sala": "reactor", "minuto": 73},
    #   "tripulacion": {"K-117": "Vega", "K-204": "Okafor", ...},   # tarjeta -> nombre
    #   "registros": [{"minuto": 3, "tarjeta": "K-117", "entra": "laboratorio"}, ...]
    # }
    # Todos empiezan en el comedor en el minuto 0. Entrar en una sala es salir de la anterior.
    return "Vega"
```
**I2:** el caso añade `"mapa"` (qué salas están conectadas). Los registros **llegan desordenados**. Hay que devolver **la tarjeta** que entra en una sala que no está conectada con donde estaba.

Se practican: diccionarios como estado («dónde está cada uno»), recorrer, filtrar, `sorted(key=...)` y la adyacencia de un grafo.

### Ejecución
- **Motor:** una llamada por caso.
- **El generador simula de verdad a la tripulación:** 6 tripulantes, 7 salas y 120 minutos de paseos aleatorios por el grafo de la estación, de 150 a 600 registros. Después coloca el crimen de forma que **exactamente una persona** esté en esa sala en ese minuto (I1), o inserta **exactamente un** salto imposible (I2).
- **Trampas a propósito en los ocultos:**
  - I1: alguien sale de la sala **justo en** el minuto del crimen (el enunciado define que «estar a las 73» incluye entrar a las 73), alguien que nunca se movió del comedor y crímenes en el comedor.
  - I2: una tarjeta que va y vuelve rápido, pero de forma legal.
- **Escenarios:** 2 visibles y 6 ocultos. Adivinar al azar tiene una probabilidad de (1/6)⁶, así que no compensa.
- **Éxito:** nombre o tarjeta exactos (el nombre sin distinguir mayúsculas). **Estrellas:** ⭐⭐⭐ si se aprueba.

### Frontal
**Pestaña 📁 Expediente**, antes de ejecutar:
```
┌──────── Plano de Hiperión ────────┐  👥 Tripulación
│ [Puente]──[Laboratorio]──[Reactor] │  🟦 Vega     K-117
│    │           │            │      │  🟩 Okafor   K-204
│ [Comedor]───[Hangar]────[Enfermería]│  🟨 Lindqvist K-311 ...
└────────────────────────────────────┘
⏱ [══════════●═══════════] minuto 73     ← el punto de cada tripulante se mueve por el plano
📜 Registros (filtrar: [tarjeta ▾] [sala ▾])
   003  K-117  → laboratorio
   007  K-204  → hangar
   ...                                   ← tabla virtualizada (cientos de filas)
```
- En los casos visibles, **la línea temporal reproduce los movimientos**: el alumno puede investigar a mano, y esa es justo la gracia.
- **Al ejecutar:** el plano se oscurece, un foco ilumina al acusado y la ficha se sella como «ACUSADO». Si acierta, aparece «✅ Confesión obtenida» y el foco salta al lugar del crimen en el minuto 73. Si falla (y es un caso visible), sale «❌ Vega estaba en el hangar en el minuto 73» y se revela al culpable real.
- **Móvil:** el plano encima, la tabla debajo y el filtro plegable.

### IA
La IA **no conoce al culpable**: solo recibe el enunciado y el código. Puede ayudar a razonar («¿cómo sabrías dónde está cada uno en un minuto concreto?»).

### Riesgos propios
- **Tamaño del caso:** 600 registros son unos 40 KB de JSON por escenario, un tamaño correcto. La tabla del frontal debe ir **virtualizada**.
- **Ambigüedad temporal:** reglas exactas en el enunciado y un test para cada borde.

---

## 4.5 🎨 Pinta la nebulosa

> Tu función decide el color de un píxel. La web la llama miles de veces y la imagen aparece.

### Dónde encaja
| Reto | Imagen | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|---|
| **N1 · La bandera de Kepler** | 3 franjas verticales (morado, naranja, morado) con un círculo amarillo en el centro | Fácil | Estructuras Condicionales | 150 | [M] |
| **N2 · Los anillos de Saturno** | Anillos concéntricos alternos alrededor de un planeta | Intermedio | Operadores | 200 | [M] |
| N3 · La galaxia espiral | Brazos espirales (con `math.atan2`) | Difícil | Optimización | 300 | [D] |

### Qué escribe el alumno
```python
def color(x, y, ancho, alto):
    # x va de 0 a ancho-1 (izquierda → derecha), y de 0 a alto-1 (arriba → abajo)
    if x < ancho // 3:
        return "morado"
    return "negro"
```
- Devuelve un nombre de la **paleta común (D8)** o su número del 0 al 9.
- **Por qué recibe `ancho` y `alto`:** los escenarios ocultos usan **otros tamaños** (25×60, 80×40). Pintar a mano coordenada a coordenada, o depender de un tamaño fijo, no sirve.

### Ejecución
- **Motor:** E2 + E3. El lienzo visible es de 48×48 (2.304 llamadas en 5 lotes de 512). El fotograma es la imagen final, codificada como una cadena con un carácter por píxel, de unos 2 KB.
- **Imagen objetivo:** la genera el motor con la función de referencia y está **definida con aritmética entera** (`x * 3 // ancho`). Así la coincidencia es exacta y no depende de redondeos.
- **Éxito:**
  - N1: el 100 % de los píxeles coincide.
  - N2 y N3: ≥ 97 % (los bordes de un círculo son discutibles).
- **Estrellas:** ⭐⭐⭐ con el 100 %, ⭐⭐ con el 99 % y ⭐ con el mínimo.
- **Escenarios:** 2 visibles (48×48 y 64×32) y 4 ocultos (tamaños raros, uno de 1 píxel de alto).
- **Rendimiento:** el objetivo es menos de 1 s por escenario de 48×48. Se mide en la subfase 5.0 (riesgo R1).

### Frontal
```
   🎯 Objetivo            🖌️ Tu nebulosa          [👁 Ver diferencias]
  ┌────────────┐         ┌────────────┐
  │▓▓▓▓░░░░▓▓▓▓│         │▓▓▓▓░░░░▓▓▓▓│          Coincidencia
  │▓▓▓▓░██░▓▓▓▓│         │▓▓▓▓░░░░▓▓▓▓│          ███████████░  96,1 %
  └────────────┘         └────────────┘
```
- La imagen se **imprime fila a fila** como un escáner (alrededor de 1 s), con una línea de luz que baja.
- **«Ver diferencias»** marca en magenta los píxeles erróneos, con parpadeo suave.
- **Al pasar el ratón** por un píxel: «(x=12, y=30) · tú: negro · objetivo: amarillo». Es depuración pura.
- **Galería** *[O]*: guardar y compartir una nebulosa libre.

### IA
La IA puede explicar coordenadas y la fórmula de la distancia. No da la función completa hasta el nivel 3.

### Riesgos propios
- **Rendimiento de miles de llamadas:** E3 con lotes. Si 48×48 no baja de 1 s, el lienzo se reduce a 32×32.
- **Orientación del eje Y** (hacia abajo, como en pantallas): un dibujo en el enunciado y un escenario visible asimétrico para que se note enseguida.

---

## 4.6 🎵 La señal de radio

> Tu código no dibuja: suena. Programas la transmisión de una baliza y la escuchas.

### Dónde encaja
| Reto | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|
| **R1 · SOS**: baliza de socorro en morse, repetida N veces | Fácil | Bucles | 150 | [M] |
| **R2 · El transmisor morse**: cualquier mensaje, con los tiempos del morse | Intermedio | Estructuras de Datos | 200 | [M] |
| R3 · La melodía del púlsar: secuencia fractal (`púlsar(n) = A + A transportado + A`) | Difícil | Recursión | 300 | [D] |

### Qué escribe el alumno
```python
def transmitir(senal):
    # senal = {"nota": "la", "repeticiones": 3}
    return [("la", 1), ("silencio", 1), ("la", 1), ...]   # (nota, duración en pulsos)
```
- **Notas:** `do re mi fa sol la si` y la octava de arriba `do2 re2…` (una lista `ESCALA` en el código base), más `"silencio"`.
- **R1:** «S = 3 pitidos de 1 pulso; O = 3 pitidos de 3 pulsos; entre pitidos, 1 pulso de silencio; al final de cada SOS, 4 pulsos de silencio».
- **R2:** el código base trae el diccionario `MORSE`, con las reglas estándar de tiempos: punto 1, raya 3, 1 de silencio dentro de una letra, 3 entre letras, 7 entre palabras y **nada al final**. El caso límite del silencio final está pensado a propósito.

### Ejecución
- **Motor:** una llamada por escenario. Se compara la lista con la de referencia.
- **Si falla, se indica la primera diferencia:** «en la posición 14 esperaba `("silencio", 3)` y llegó `("silencio", 1)`».
- **Escenarios:**
  - R1: 2 visibles y 4 ocultos (otras notas y repeticiones, incluida 1 repetición).
  - R2: 2 visibles («SOS», «HOLA TIERRA») y 5 ocultos (una letra sola, espacios dobles, números).
- **Validación:** que sea una lista de tuplas `(str, int)` con notas válidas y duraciones de 1 a 16, con 4.000 elementos como máximo.
- **Estrellas:** ⭐⭐⭐ si se aprueba.

### Frontal
```
  📡 [🔊 Escuchar tu señal]  [🎧 Escuchar la señal objetivo]   🔈──●──

  Objetivo │▮ ▮ ▮ ▮▮▮ ▮▮▮ ▮▮▮ ▮ ▮ ▮    │    ← dos pistas tipo piano roll
  Tu señal │▮ ▮ ▮ ▮▮▮ ▮▮▮ ▮▮▮ ▮ ▮ ▮▮   │    ← la primera diferencia, marcada en rojo
           ▲ cabezal de reproducción
  ∿∿∿∿∿∿∿∿∿∿∿∿  osciloscopio animado mientras suena
```
- **Sonido sintetizado en el navegador con WebAudio:** onda cuadrada, filtro paso bajo y un poco de ruido de estática de radio. Sin ficheros de audio.
- Solo suena **tras un clic** (política de autoplay). El volumen se recuerda.
- **«Escuchar la señal objetivo»**, solo en escenarios visibles: entrenar el oído forma parte del juego.
- **Accesibilidad:** las pistas visuales contienen toda la información, así que se puede resolver sin sonido.

### IA
Puede ayudar con los tiempos del morse. No genera la lista entera.

### Riesgos propios
- **Audio en móviles (iOS):** el `AudioContext` debe crearse dentro del clic. Hay que probarlo en un móvil real o emulado.
- **Spec de tiempos farragosa:** se incluye un **ejemplo resuelto completo** de «E» y de «ET» en el enunciado.

---

## 4.7 🧬 La colonia

> No controlas la colonia alienígena: escribes la **ley de la vida** y la ves evolucionar sola.

### Dónde encaja
| Reto | Objetivo | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|---|
| **Co1 · Terraformación** | La colonia debe cubrir la zona verde antes de la generación 40 **sin tocar nunca** la base humana, que está tras una grieta de una celda de ancho | Intermedio | Funciones | 200 | [M] |
| Co2 · El cristal | Acabar en una configuración **estable** (que no cambia en 10 generaciones) que cubra la diana | Difícil | Optimización | 300 | [D] |

### Qué escribe el alumno
```python
def regla(viva, vecinas):
    # viva: True/False · vecinas: cuántas de las 8 de alrededor están vivas (0-8)
    # Devuelve si la celda estará viva en la siguiente generación
    return viva and vecinas >= 2
```

### Ejecución: la idea técnica clave
- **La regla solo tiene 18 entradas posibles** (2 estados × 9 vecinos). El motor llama a `regla` **exactamente 18 veces** con E2, construye la **tabla** y simula él solo las generaciones.
- Esto da cuatro ventajas:
  - **es rápido** (18 llamadas, no 40 × 24 × 24);
  - **no permite trampas**, porque la simulación no pasa por el proceso del alumno;
  - **es determinista**;
  - el frontal puede enseñar **la tabla que ha salido de tu función**, que es muy didáctico (función → tabla).
- El enunciado exige que `regla` sea **pura**: misma entrada, misma salida. Si se le llama dos veces con lo mismo y responde distinto, el motor lo detecta y avisa.
- **Mapa:** 24×24, con rocas (siempre muertas), una base (rojo rayado) y una zona objetivo (verde discontinuo). La colonia inicial se coloca con la semilla.
- **Escenarios:** 2 visibles y 4 ocultos (otras posiciones iniciales y otras rocas, mismo tipo de objetivo).
- **Fotogramas:** 40 generaciones × 576 celdas como cadenas, unos 25 KB.
- **Estrellas:** ⭐⭐⭐ si se cubre en ≤ 25 generaciones, ⭐⭐ en ≤ 32 y ⭐ en ≤ 40.

### Frontal
```
  Generación 17 / 40   [⏮][⏯][⏭] [════●══════]  ×1 ×2 ×4
  ┌────────────────────────┐   📈 Población  ▁▂▃▅▆▇
  │░░░░▓▓▓░░░░░░░▒▒▒▒▒▒▒▒▒░│   🎯 Zona cubierta: 64 %
  │░░░▓▓▓▓▓░░░░░░▒▒▒▒▒▒▒▒▒░│   🏠 Base: intacta ✅
  │░░░░▓▓▓░░░■░░░▒▒▒▒▒▒▒▒▒░│
  │░░░░░░░░░░■░░░░░░░░░░░░░│   📋 Tu regla
  │▧▧▧▧░░░░░░■░░░░░░░░░░░░░│        vecinas 0 1 2 3 4 5 6 7 8
  └────────────────────────┘   viva    ✗ ✗ ✓ ✓ ✗ ✗ ✗ ✗ ✗
                                muerta  ✗ ✗ ✗ ✓ ✗ ✗ ✗ ✗ ✗
```
- Las células brillan (bioluminiscencia), con un leve fundido entre generaciones y controles como los del visor de misiones.
- Si la base se infecta: la base parpadea en rojo y el visor se para en esa generación con «☣️ La colonia alcanzó la base en la generación 12».

### IA
Puede explicar qué hace una regla («con nacer a partir de 1 vecina, la colonia lo invade todo»), sin dar la tabla ganadora.

### Riesgos propios: el formato más arriesgado
- **Diseñar mapas que sean resolubles pero no triviales.** Mitigación, con un **validador** que forma parte de los tests:
  1. La regla de referencia supera todos los escenarios.
  2. Las reglas «tontas» fallan: siempre viva, nunca, quedarse igual, invadirlo todo y el Juego de la Vida de Conway.
  3. Sobre **5.000 reglas aleatorias** (de las 262.144 posibles), aprueba menos del 3 %.
- Por eso va **la última**, y los mapas concretos se ajustan con el validador durante la subfase, no ahora.

---

## 5. Mapa de niveles

| Planeta / nivel | Retos nuevos (v1, [M]) | Conceptos |
|---|---|---|
| **Fácil** | 💣 B1 · 👽 L1 · 🎨 N1 · 🎵 R1 | `if/elif`, listas, índices, bucles, coordenadas |
| **Intermedio** | 💣 B2 · 👽 L2 · 🔐 C1 · 🔍 I1 · 🎨 N2 · 🎵 R2 · 🧬 Co1 | funciones, diccionarios, búsqueda binaria, operadores, bucles anidados |
| **Difícil** | 👽 L3 · 🔐 C2 · 🔍 I2 | grafos (BFS, adyacencia), optimización, `sorted(key=)` |

**14 retos en la v1.** Los marcados [D] y [O] (B3, L4, N3, R3 y Co2) se dejan para cuando funcionen los primeros. Los puntos siguen la escala de las misiones: 150 / 200 / 300.

---

## 6. Riesgos

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | **Rendimiento:** miles de llamadas (nebulosa) o envíos de 8 escenarios bloquean los workers de gunicorn | Media | Alto | Lotes (E3); medir en 5.0 con objetivos (nebulosa 48×48 < 1 s; envío completo < 10 s); reducir el lienzo si no se cumple; límite de envíos por minuto ya existente |
| R2 | **Romper las 3 misiones actuales** al ampliar el motor | Media | Alto | E1–E5 compatibles hacia atrás; `test_misiones.py` y los e2e de misiones se ejecutan sin cambios en cada subfase |
| R3 | **Enunciados ambiguos** (bomba, lengua, impostor), que frustran más que enseñan | Alta | Alto | Glosario de términos; reglas trampa en los tests de la lengua; el primer escenario visible cubre la duda típica; cuando se falla un visible se explica por qué |
| R4 | **Trampas:** leer los ocultos, adivinar o pintar a mano | Baja | Medio | Los secretos solo viven en el proceso del motor; generadores con semilla; tamaños distintos en ocultos; la probabilidad de acertar al azar es despreciable |
| R5 | **La IA revela la solución** (sobre todo la regla de la lengua) | Media | Medio | Reglas por formato y nivel en el prompt; detector de fugas; la IA nunca ve ocultos, culpables ni secretos |
| R6 | **Respuestas enormes** (fotogramas, casos del impostor) | Baja | Medio | Tope de 2 MB de detalle por escenario; fotogramas compactos; tabla virtualizada |
| R7 | **Puzles imposibles o triviales** (colonia, C2) | Media | Alto | Validadores automáticos en los tests (referencia aprueba, reglas tontas fallan, tasa de reglas aleatorias que aprueban). Para C2 ya está verificado (máximo 9 de 10) |
| R8 | **Determinismo:** la misma semilla debe dar lo mismo siempre | Baja | Alto | `random.Random(semilla)` propio por escenario; la versión de Python está fijada en el Dockerfile (3.12); test «misma semilla ⇒ mismo material» |
| R9 | **Audio y móviles** (autoplay en iOS, rendimiento del canvas) | Media | Bajo | Audio solo tras clic; pistas visuales equivalentes; prueba con el emulador móvil en cada subfase |
| R10 | **Alcance:** 7 formatos son mucho trabajo | Alta | Medio | Subfases independientes con su PR; cada una se puede usar por separado; [D] y [O] fuera de la v1 |

---

## 7. Plan de pruebas común

Cada subfase incluye, como mínimo:

**Python** (`python-runner/test_retos_<formato>.py`, se ejecutan en el contenedor):
- El generador es determinista: la misma semilla da el mismo material.
- **La solución de referencia aprueba con las semillas 0 a 499.**
- 2 o 3 **soluciones incorrectas típicas** fallan (por ejemplo, la bomba sin respetar el orden de las reglas, o la gravedad que ordena la columna).
- Errores de forma: `None`, tipo erróneo, tamaño erróneo, excepción, bucle infinito. Cada uno da un mensaje legible.
- Cobertura del generador: todas las reglas, bordes y casos trampa aparecen.

**E2E** (`test/e2e/08-retos-<formato>.test.mjs`):
- `probar` y `enviar` con la referencia dan correcto y puntos; con una solución incorrecta, falla.
- **Nada secreto sale en la respuesta:** semillas, parámetros, material de los ocultos, culpable o código de un oculto.
- El material público solo se entrega para los escenarios visibles.

**Manual** (`docs/pruebas/fase-5.N.md`): recorrido en el navegador (escritorio y móvil), animaciones, accesibilidad (sin color, movimiento reducido), pistas de IA y caja negra.

**Regresión:** la suite completa (e2e, unitarios y Python) en verde, incluidas las misiones de la fase 2.

---

## 8. Subfases y orden

| Subfase | Contenido | Tamaño | Por qué en este orden |
|---|---|---|---|
| **5.0** | Motor de retos (E1–E5), `tipo='reto'`, `VistaReto` con visores enchufables, badges y medición de rendimiento | M | Es la base de todo y la parte con más riesgo técnico |
| **5.1** | 💣 Bomba (B1, B2) | M | El camino más sencillo (una llamada) y el más vistoso para validar `VistaReto` |
| **5.2** | 👽 Lengua alienígena (L1, L2, L3) | M | Reutiliza el camino de la bomba; estrena las rejillas y la paleta, que usará la nebulosa |
| **5.3** | 🔐 Cámara acorazada (C1, C2) | S–M | Estrena E4 (consultas) de forma aislada |
| **5.4** | 🔍 Impostor (I1, I2) | M | El frontal más grande (plano, línea temporal, tabla) |
| **5.5** | 🎨 Nebulosa (N1, N2) | S | Estrena E3 (lotes) con la paleta ya hecha |
| **5.6** | 🎵 Radio (R1, R2) | S–M | Audio: independiente de todo lo demás |
| **5.7** | 🧬 Colonia (Co1) | M | La de más riesgo de diseño: va la última, con el validador |

Cada subfase sigue las reglas de siempre:
- rama `feature/fase-5.N-<formato>` en cada repo afectado;
- migración de siembra propia;
- plan de pruebas ejecutado en verde;
- PR preparada por Claude y revisada y fusionada por Miguel.

---

## 9. Decisiones

| # | Decisión | Recomendación |
|---|---|---|
| D7 | Cómo se guardan los retos | **`tipo = 'reto'`** compartiendo el motor y los servicios de las misiones, con `formato` en `config` |
| D8 | Colores | **Paleta fija de 10 colores con nombre**, compartida por la lengua y la nebulosa, y siempre con texto o número alternativo |
| D9 | Formato de las notas | **`("sol", 2)`** (nombre en castellano y duración en pulsos) |
| D10 | Colonia | **La regla se convierte en una tabla de 18 entradas** y la simulación la hace el motor |
| D11 | Orden | **5.0 → bomba → lengua → cámara → impostor → nebulosa → radio → colonia** |
| D12 | Ramas | **Una rama y una PR por subfase** (PRs pequeñas y fáciles de revisar) |
