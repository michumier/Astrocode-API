# Fase 5: 🧪 Retos insólitos (diseño)

> Diseño completo de los 7 formatos nuevos de ejercicio, previo a programar nada.
> Estado: **pendiente de aprobación** (versión 2, revisada el 28-oct-2026). La fase 4 (puente de mando) sigue pendiente y es independiente.
>
> **Cambios de la v2:**
> - 💣 **Bomba:** dos cortes encadenados, con ejemplos resueltos y solución de referencia.
> - 👽 **Lengua:** «Los lagos» explicado desde cero, con plan B.
> - 🔐 **Cámara:** tres niveles (fuerza bruta con hash → búsqueda binaria → deducción), cada uno con su resolución paso a paso.
> - 🔍 **Impostor:** basado en un **log en bruto**. I1 trabaja con diccionarios; I2, con un grafo deducido del log.
> - 🎵 **Radio:** R2 más exigente y un R3 difícil nuevo (descifrar una señal con ruido).
>
> Todos los ejemplos resueltos están **comprobados ejecutando el código**.

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
| **E4** | **Consultas (RPC)**: el harness inyecta un objeto (`caja`) cuyo método `probar()` envía `{"consulta": ...}` al motor y espera la respuesta **sin salir de la función del alumno**. El secreto vive solo en el proceso del motor | El alumno *pregunta* en lugar de *responder* | Cámara acorazada (C2, C3) |
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

> Hay una bomba en la nave, un manual de desactivación y 30 segundos. Tu función lee la bomba y decide qué cables cortar y en qué orden.

### Dónde encaja
| Reto | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|
| **B1 · Bomba de cables** | Fácil | Estructuras Condicionales | 150 | [M] |
| **B2 · Bomba de módulos** | Intermedio | Funciones | 200 | [M] |
| B3 · Bomba con memoria (varias fases que dependen de lo que pasó antes) | Difícil | Estructuras de Datos | 300 | [O] |

### B1: qué recibe y qué devuelve
```python
def desactivar(bomba):
    # bomba = {"cables": ["rojo", "azul", "blanco", "azul", "negro"], "serie": "K7Q2M5"}
    # Devuelve la LISTA de posiciones que cortas, EN ORDEN (0 = el primer cable)
    return [3, 4]
```
- Entre 3 y 6 cables de estos colores: rojo, azul, blanco, amarillo y negro.
- El número de serie tiene 6 caracteres (letras mayúsculas y cifras) y **siempre termina en cifra**.
- **Los cables no se mueven al cortarlos:** las posiciones son siempre las del principio.

### 📕 Manual B1 (lo que ve el alumno)

**Paso 1: el primer corte.** Aplica **la primera regla que se cumpla**, de arriba abajo:
1. Si no hay ningún cable rojo → corta el **segundo** cable.
2. Si el último cable es blanco → corta el **último** cable.
3. Si hay más de un cable azul → corta el **último cable azul**.
4. Si la última cifra del número de serie es impar → corta el **último** cable.
5. En cualquier otro caso → corta el **primero**.

**Paso 2: ¿hay que cortar otro?** Mira el color del cable que acabas de cortar:
- **Azul** → corta también el cable de **su derecha**. Si era el último, no hay más cortes.
- **Rojo** → no cortes nada más.
- **Otro color** → si el número de serie contiene una **vocal**, corta también el **último cable que quede sin cortar**. Si no tiene vocal, no cortes nada más.

### Cómo se resuelve, paso a paso

**Ejemplo 1:** cables `["rojo", "azul", "blanco", "azul", "negro"]`, serie `K7Q2M5`.

| Regla del paso 1 | ¿Se cumple? |
|---|---|
| 1. ¿No hay rojo? | No: hay uno en la posición 0 |
| 2. ¿El último es blanco? | No: es negro |
| 3. ¿Más de un azul? | **Sí**: hay dos (posiciones 1 y 3) → **corto el 3** |

Paso 2: el cable 3 era **azul**, así que corto también el de su derecha, el **4**. **Respuesta: `[3, 4]`**.

**Ejemplo 2:** cables `["amarillo", "negro", "blanco"]`, serie `A41B2C`.
- Paso 1: no hay rojo, así que se aplica la regla 1 → corto el **segundo**, posición **1** (negro).
- Paso 2: era negro (otro color) y la serie tiene una vocal (`A`) → corto el último sin cortar, el **2**.
- **Respuesta: `[1, 2]`**.

**Solución de referencia** (la que usa el motor; el alumno no la ve):
```python
def primer_corte(cables, serie):
    if "rojo" not in cables:
        return 1
    if cables[-1] == "blanco":
        return len(cables) - 1
    if cables.count("azul") > 1:
        return len(cables) - 1 - cables[::-1].index("azul")
    if int(serie[-1]) % 2 == 1:
        return len(cables) - 1
    return 0

def desactivar(bomba):
    cables, serie = bomba["cables"], bomba["serie"]
    primero = primer_corte(cables, serie)
    cortes = [primero]
    color = cables[primero]
    if color == "azul":
        if primero + 1 < len(cables):
            cortes.append(primero + 1)
    elif color != "rojo" and any(v in serie for v in "AEIOU"):
        sin_cortar = [i for i in range(len(cables)) if i != primero]
        cortes.append(sin_cortar[-1])
    return cortes
```
**El pelín de complejidad:**
- hay **dos decisiones encadenadas** (la segunda depende de la primera);
- la salida es una **lista ordenada**;
- hay **casos límite reales**: un azul en la última posición (no tiene derecha) o el primer corte en el último cable, en cuyo caso «el último sin cortar» es el penúltimo.

Se practican `in`, `count`, índices negativos, buscar el último de algo, `int()`, `%` y el orden de los `if/elif`.

### B2: bomba de módulos
La bomba tiene **tres módulos** y se devuelve un diccionario con la respuesta de cada uno:
```python
def desactivar(bomba):
    # bomba = {"cables": [...], "serie": "...", "baterias": 2,
    #          "boton": {"color": "azul", "texto": "ABORTAR"},
    #          "teclado": ["🌙", "🪐", "☄️", "🛸"]}
    return {"cables": [3, 4], "boton": "mantener", "teclado": ["🪐", "☄️", "🛸", "🌙"]}
```
- **Cables:** el manual B1 entero (se reutiliza la función).
- **Botón** (primera regla que se cumpla):
  1. Si es azul y pone «ABORTAR» → mantener.
  2. Si hay más de una batería y pone «DETONAR» → pulsar.
  3. Si es blanco → mantener.
  4. En otro caso → pulsar.
- **Teclado:** el manual trae 4 columnas de 7 símbolos. **Solo una** columna contiene los 4 símbolos de la bomba, y hay que pulsarlos **en el orden en que aparecen en esa columna**.
  ```
  Columna A: 🪐 ☄️ 🛸 🌙 ⭐ 🌀 👾
  Columna B: 🔭 🌙 🛰️ 🪐 💫 ☄️ 🌑
  ...
  ```
  - Ejemplo: la bomba muestra 🌙 🪐 ☄️ 🛸.
  - La columna B no tiene 🛸, así que la única que tiene los cuatro es la A.
  - En la A el orden es 🪐, ☄️, 🛸, 🌙. **Respuesta: `["🪐", "☄️", "🛸", "🌙"]`**.
  ```python
  def teclado(simbolos):
      for columna in COLUMNAS:          # COLUMNAS viene en el código base
          if all(s in columna for s in simbolos):
              return sorted(simbolos, key=columna.index)
  ```
- El enunciado anima a escribir **una función por módulo** y a reutilizar la de B1: el reto premia descomponer.

> Las reglas y los símbolos son **nuestros**. Se inspira en la mecánica de juegos de desactivación, pero no copia ningún manual existente.

### Cómo se corrige
- **Motor:** una llamada por bomba (un tick).
- **Se aprueba si la lista devuelta es exactamente la que dicta el manual** (en B2, los tres módulos).
- **10 bombas:** 3 visibles y 7 ocultas.
- **El generador elige primero qué combinación de reglas debe darse** (regla del paso 1 × rama del paso 2) y construye una bomba que la cumpla. Así todas las combinaciones salen en los escenarios.
- **Los ocultos incluyen los casos límite:** azul al final, serie con y sin vocal, 3 y 6 cables.
- **Estrellas:** ⭐⭐⭐ si se aprueba.
- **Errores claros:**
  - `Devolviste [7], pero la bomba solo tiene 4 cables (posiciones 0 a 3)`;
  - `Devuelve una lista, no un número: [3] en lugar de 3`;
  - `En B2 falta la clave "teclado"`.
- **Si falla un escenario visible, se explica la solución:** «Paso 1 → regla 3 → cable 3. Paso 2 → era azul → cable 4. Tú cortaste [3]».

### Frontal
```
┌─────────────── VISOR ───────────────┐
│  ┌──────────────────────────────┐   │
│  │  [ 00:27 ]   SERIE K7Q2M5     │   │   ← LCD rojo con cuenta atrás
│  │                              │   │
│  │ 0 ═══════ rojo ═══════════   │   │
│  │ 1 ═══════ azul ═══════════   │   │   ← cables SVG con nombre y número
│  │ 2 ═══════ blanco ═════════   │   │
│  │ 3 ═══════ azul ═══✂ ══════   │   │   ← tijeras: 1.er corte
│  │ 4 ═══════ negro ══✂ ══════   │   │   ← 2.º corte
│  │                     ● LED    │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```
- **Animación** (unos 3 s): la cuenta atrás corre y las tijeras cortan **en el orden de la lista**, cada corte con su chispa. Si todo es correcto, el LED se pone verde y la cuenta se para. Si falla, hay un destello, una sacudida y aparece la explicación del manual.
- **B2:** los tres módulos en rejilla (cables, botón grande, teclado 2×2), resueltos uno tras otro, cada uno con su LED.
- **Pestaña 📕 Manual:** un documento técnico con los pasos y reglas numerados. En B2, las columnas del teclado como tabla.
- **Daltonismo:** cada cable lleva su nombre escrito y una textura.

### IA
Puede señalar **qué paso o qué regla se está evaluando mal** («comprueba el orden de las reglas», «¿qué pasa si el azul es el último?»), pero no dar las posiciones.

### Riesgos propios
- **Ambigüedad** («el segundo cable», «el último sin cortar»): glosario en el enunciado y los dos ejemplos resueltos de arriba en el propio enunciado.

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

### L3 «Los lagos» explicado: dónde está el grafo
No hace falta saber teoría de grafos: **la rejilla ya es un grafo**. Cada celda es un punto y está unida a sus 4 vecinas (arriba, abajo, izquierda y derecha). «Grafos» aquí significa solo **«qué celdas están conectadas entre sí»**.

**La regla, en palabras:** imagina que alrededor de la rejilla hay mar.
- El agua entra por todas las celdas negras (0) del **borde** y se extiende a las negras vecinas, y a las vecinas de esas, y así sucesivamente.
- Las paredes grises (5) la frenan.
- Las celdas negras **a las que el agua no llega** están encerradas: son **lagos**, y se pintan de azul (1).

```
Ejemplo A: lago cerrado              Ejemplo B: la pared tiene un hueco
Entrada        Salida                Entrada        Salida
5 5 5 5 0      5 5 5 5 0             5 5 5 5 0      5 5 5 5 0
5 0 0 5 0      5 1 1 5 0             5 0 0 0 0      5 0 0 0 0   ← el agua entra
5 0 0 5 0  ──▶ 5 1 1 5 0             5 0 0 5 0  ──▶ 5 0 0 5 0     por el hueco:
5 5 5 5 0      5 5 5 5 0             5 5 5 5 0      5 5 5 5 0     no hay lago
0 0 0 0 0      0 0 0 0 0             0 0 0 0 0      0 0 0 0 0
```
(Los dos ejemplos están verificados con la solución de referencia.) Un tercer ejemplo visible tiene un hueco **solo en diagonal**, para dejar claro que **en diagonal el agua no pasa**.

**Cómo se programa:** una lista de «celdas pendientes de mojar» que empieza con las negras del borde. Se saca una, se marca como mojada y se añaden sus vecinas negras. Al vaciarse la lista, las negras no mojadas se vuelven azules. Es la técnica de rellenar zonas (*flood fill*), la misma del cubo de pintura de cualquier programa de dibujo.
```python
def transformar(rejilla):
    filas, cols = len(rejilla), len(rejilla[0])
    mojadas = set()
    pendientes = [(f, c) for f in range(filas) for c in range(cols)
                  if (f in (0, filas - 1) or c in (0, cols - 1)) and rejilla[f][c] == 0]
    while pendientes:
        f, c = pendientes.pop()
        if (f, c) in mojadas:
            continue
        mojadas.add((f, c))
        for df, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nf, nc = f + df, c + dc
            if 0 <= nf < filas and 0 <= nc < cols and rejilla[nf][nc] == 0:
                pendientes.append((nf, nc))
    return [[1 if v == 0 and (f, c) not in mojadas else v for c, v in enumerate(fila)]
            for f, fila in enumerate(rejilla)]
```
**Visor extra de L3** *[D]*: tras aprobar, el botón «🌊 Ver entrar el agua» anima el relleno desde el borde. Es la explicación visual del algoritmo y no destripa nada porque ya se ha resuelto.

**Plan B si los lagos no convencen al probarlos.** L3 se cambia por **«El mensaje cifrado»**:
- los alienígenas envían texto con una sustitución de letras desconocida;
- con una «piedra Rosetta» (frases conocidas y su versión cifrada), el alumno construye el diccionario de sustitución y descifra los mensajes ocultos.

Tu idea del mensaje con **hash** encaja mejor en la cámara acorazada fácil (§4.3), porque un hash no se descifra: solo se encuentra **probando**, y eso es justo la fuerza bruta que pedías.

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

> El banco de Ceres tiene tres cámaras, cada una mejor protegida que la anterior. Con cada cámara cambia la estrategia: primero probarlo todo, luego partir por la mitad y al final deducir.

### Dónde encaja
| Reto | Qué protege la cámara | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|---|
| **C1 · La huella del PIN** | Guarda la **huella (hash)** del PIN y **no tiene alarma** → fuerza bruta | Fácil | Bucles | 150 | [M] |
| **C2 · La cámara de Ceres** | Dice «mayor» o «menor», pero **salta la alarma a los 20 intentos** → búsqueda binaria | Intermedio | Algoritmos de Búsqueda | 200 | [M] |
| **C3 · La cerradura de combinación** | Solo dice cuántas cifras aciertas, y **10 intentos** → deducción | Difícil | Optimización | 300 | [M] |

**La historia une a las tres:** la fuerza bruta de C1 **dispara la alarma en C2** (el enunciado de C2 lo dice: «aquí probar uno a uno no te da tiempo»). Ese choque es el que enseña por qué existen los algoritmos.

---

### C1 · La huella del PIN (fuerza bruta)

**La idea:** la cámara no guarda el PIN, sino su **huella** (un hash SHA-256): un texto de 64 caracteres que sale de pasar el PIN por una función.
- El mismo PIN da siempre la misma huella.
- No se puede ir de la huella al PIN.
- **La única forma de encontrarlo es probar PINs hasta dar con uno cuya huella coincida.** Eso es la fuerza bruta.

```python
import hashlib

def huella(texto):                       # viene en el código base
    return hashlib.sha256(texto.encode()).hexdigest()

def abrir(caja):
    # caja = {"huella": "f15cea39f11dc0371cfb9a4b7b1c38d5c636feb72d70e2759b0e505905ee9d01",
    #         "candidatos": ["4821", "0007", "1999", ...]}   ← o None
    # Devuelve el PIN (texto) cuya huella coincide
    ...
```

**Cómo se resuelve, paso a paso:**
- **Escenario 1** (el espía consiguió una lista de 500 PINs sospechosos): se recorre la lista y se devuelve el primero cuya `huella(pin)` sea igual a `caja["huella"]`.
  ```python
  for pin in caja["candidatos"]:
      if huella(pin) == caja["huella"]:
          return pin
  ```
- **Escenario 2** (`"candidatos": None`, el espía no consiguió nada): hay que **generar los 10.000 PINs** de `0000` a `9999` y probarlos todos.
  - La trampa está en que el PIN 7 es `"0007"`, no `"7"`: hay que formatear con `f"{n:04d}"` o con `str(n).zfill(4)`.
  ```python
  for n in range(10000):
      pin = f"{n:04d}"
      if huella(pin) == caja["huella"]:
          return pin
  ```

**Ocultos:**
- listas de candidatos con el PIN al principio, al final y repetido;
- PIN `"0000"` y `"9999"`;
- un PIN de **5 cifras** (`caja["cifras"] = 5`, 100.000 combinaciones). Así no vale escribir `4` a mano.

**Rendimiento:** 100.000 huellas tardan 0,1 s (medido), así que no hay riesgo.

Se practican: bucles `for`, `range`, formato de textos, funciones, `return` dentro de un bucle y **qué es un hash**, que además es cultura general de seguridad.

**Frontal C1:**
```
  🔒 Huella buscada: f15cea39…9d01
  ┌──────────────────────────────────────────┐
  │ 0005  →  1ed8eb36…  ✗                      │   ← rodillo tipo tragaperras
  │ 0006  →  6b3b9a6d…  ✗                      │
  │ 0007  →  f15cea39…  ✓  ████ COINCIDE ████   │
  └──────────────────────────────────────────┘
  Probados: 8 / 10.000            [puerta abriéndose]
```
- La animación recorre los candidatos hasta el PIN devuelto, a toda velocidad y frenando al final. Es ilustrativa: la calcula el navegador con los datos del escenario visible.
- El contador «Probados: 4.821 / 10.000» deja ver el coste de la fuerza bruta, que será el gancho de C2.

---

### C2 · La cámara de Ceres (búsqueda binaria)

```python
def abrir(caja):
    # caja.minimo = 1, caja.maximo = 1000000, caja.intentos = 20   (datos públicos)
    r = caja.probar(500000)   # "mayor" → el código es MAYOR que 500000
                              # "menor" → es MENOR · "abierta" → ¡acertaste!
```

**Cómo se resuelve, paso a paso.** Por ejemplo, con código secreto 731, rango de 1 a 1.000 y 10 intentos: se prueba siempre **el centro del rango que queda**, y la respuesta descarta la mitad.

| Intento | Rango posible | Pruebo (centro) | Respuesta | Rango que queda |
|---|---|---|---|---|
| 1 | 1–1000 | 500 | mayor | 501–1000 |
| 2 | 501–1000 | 750 | menor | 501–749 |
| 3 | 501–749 | 625 | mayor | 626–749 |
| 4 | 626–749 | 687 | mayor | 688–749 |
| 5 | 688–749 | 718 | mayor | 719–749 |
| 6 | 719–749 | 734 | menor | 719–733 |
| 7 | 719–733 | 726 | mayor | 727–733 |
| 8 | 727–733 | 730 | mayor | 731–733 |
| 9 | 731–733 | 732 | menor | 731 |
| 10 | 731 | 731 | **abierta** 🔓 | |

Con fuerza bruta (1, 2, 3…) habrían hecho falta 731 intentos. Esta tabla está verificada con código.

```python
def abrir(caja):
    bajo, alto = caja.minimo, caja.maximo
    while bajo <= alto:
        medio = (bajo + alto) // 2
        r = caja.probar(medio)
        if r == "abierta":
            return medio
        if r == "mayor":
            bajo = medio + 1
        else:
            alto = medio - 1
```

**Reglas:**
- El número de intentos es siempre `maximo.bit_length()`, justo lo que necesita la búsqueda binaria en el peor caso: 10 para mil, 20 para un millón y 30 para mil millones.
- Un intento de más dispara la **alarma** y la misión falla.
- **Ocultos:** el código es 1, el máximo, el centro exacto, un rango de mil millones y un código **alto**, para que la fuerza bruta falle seguro.

**Frontal C2:**
```
        ╭───────────╮
       ╱  ◜  750    ◝ ╲        ← dial que gira hasta el número probado
      │   ◟    ▼    ◞  │
       ╲      MENOR   ╱        ← luz ▲ / ▼
        ╰───────────╯
  Intentos ● ● ○ ○ ○ ○ ○ ○ ○ ○
  Rango posible:  |░░░░░░░░░░░░░░▓▓▓▓▓▓▓░░░░░░░░░|   ← la barra se parte por la mitad
                  1            501    749     1000
```
**La barra del rango que se parte por la mitad en cada intento es la clave didáctica:** enseña la búsqueda binaria sin palabras.

---

### C3 · La cerradura de combinación (deducción)

La combinación son **4 cifras distintas** (por ejemplo `4271`). Cada intento dice:
- **exactos:** cifras correctas **en su sitio**;
- **descolocados:** cifras que están en la combinación, pero **en otro sitio**.

```python
def abrir(caja):
    r = caja.probar("0123")   # {"exactos": 0, "descolocados": 2}   o  "abierta"
```

**Cómo se resuelve:**
- **Ejemplo de una respuesta:** si el secreto es `4271` y pruebo `0123`, ninguna cifra está en su sitio, y el `1` y el `2` están pero en otro lugar, así que la respuesta es `{"exactos": 0, "descolocados": 2}`.
- **La estrategia, en palabras:**
  1. Hago una **lista con todas las combinaciones posibles**. Con 4 cifras distintas son 5.040.
  2. Pruebo **la primera** de la lista.
  3. Con la respuesta, **tacho de la lista todas las combinaciones que, si fueran el secreto, habrían dado otra respuesta**: ya sé que no pueden ser.
  4. Vuelvo al paso 2 con la primera que quede.

```python
from itertools import permutations

def comparar(intento, secreto):           # esta función la escribe el alumno: es la clave
    exactos = sum(a == b for a, b in zip(intento, secreto))
    comunes = len(set(intento) & set(secreto))
    return {"exactos": exactos, "descolocados": comunes - exactos}

def abrir(caja):
    posibles = ["".join(p) for p in permutations("0123456789", 4)]
    while posibles:
        intento = posibles[0]
        r = caja.probar(intento)
        if r == "abierta":
            return intento
        posibles = [p for p in posibles if comparar(intento, p) == r]
```

**Verificado con las 5.040 combinaciones:** esta estrategia abre siempre en **9 intentos como máximo** (5,56 de media). Por eso el límite es 10: probar a ciegas no llega, pero razonando siempre se puede.

**Estrellas** (peor escenario): ⭐ si abre en ≤ 10 intentos, ⭐⭐ en ≤ 8 y ⭐⭐⭐ en ≤ 7.

Se practican: generar combinaciones (`itertools` o bucles anidados), **filtrar listas**, `set`, `zip` y escribir una función auxiliar que se reutiliza dentro de un bucle.

**Frontal C3:** cuatro dígitos como tubos de neón, un historial de intentos con fichas (● exacto, ○ descolocado) y un contador **«combinaciones aún posibles: 5.040 → 1.260 → 288 → 128 → 21 → 2 → 1»** calculado por el motor (esa es la secuencia real con el secreto `4271`). Ese contador es el que hace que se entienda la estrategia.

---

### Motor y protección (C2 y C3)
- **C2 y C3 usan la ampliación E4 (consultas):** cada `caja.probar()` viaja al motor, que guarda el secreto y cuenta los intentos. **El secreto nunca sale de ese proceso.**
- **C1 no la necesita:** es una llamada normal con la huella y la lista.
- Un `probar()` mal formado (`probar("12")`, cifras repetidas, fuera de rango) **cuenta como intento** y avisa en el registro.
- Tras la alarma, `probar()` lanza una excepción `Alarma`.

### IA
- **C1:** puede explicar qué es un hash y cómo rellenar con ceros.
- **C2:** «¿y si cada intento descartara la mitad?» (nivel 2).
- **C3:** puede hablar de «quedarte solo con las combinaciones compatibles» y ayudar con `comparar`, pero no dar el algoritmo entero.

### Riesgos propios
- **E4 es la ampliación más nueva del motor:** pueden darse bloqueos o `print` en mitad de una consulta. Tests específicos: consulta tras la alarma, excepción dentro de `abrir` y cero consultas.
- **C3 tiene el margen justo** (9 de 10): es intencionado, pero conviene confirmarlo en las pruebas con varias estrategias razonables.

---

## 4.4 🔍 Hay un impostor a bordo

> Han saboteado la estación Hiperión. Solo tienes **el registro del sistema**: miles de líneas donde pasa de todo. Primero hay que leerlo y entenderlo; luego, con estructuras de datos (y en el difícil, con un grafo), señalar al culpable.

### Dónde encaja
| Reto | Nivel | Categoría | Puntos | Prioridad |
|---|---|---|---|---|
| **I1 · Sabotaje en el reactor**: leer el log y saber quién estaba en la sala | Intermedio | Estructuras de Datos | 200 | [M] |
| **I2 · El apagón**: el log de puertas se cae justo durante el crimen y hay que deducir quién **pudo llegar** a tiempo | Difícil | Grafos y Árboles | 300 | [M] |

### El log: lo mismo en I1 e I2
La función recibe **un único texto**: el log en bruto, de 800 a 3.000 líneas. No hay nada masticado. Todo, hasta la tripulación y el crimen, está dentro del log:
```
=== ESTACIÓN HIPERIÓN · REGISTRO DEL SISTEMA · CICLO 4471 ===
[00:00] TRIPULACION K-117 Vega
[00:00] TRIPULACION K-204 Okafor
[00:00] TRIPULACION K-311 Lindqvist
[00:03] PUERTA K-117 comedor -> laboratorio
[00:04] ENERGIA reactor 98%
[00:05] COMMS K-204 "voy al hangar -> luego al reactor"
[00:07] PUERTA K-311 comedor -> reactor DENEGADO
[00:09] PUERTA dron-3 comedor -> reactor
[00:09] MANTENIMIENTO dron-3 limpieza en reactor
[00:12] PUERTA K-204 comedor -> hangar
[00:15] PUERTA K-117 laboratorio -> reactor
[00:16] ALERTA SABOTAJE reactor
...
```
**Tipos de línea:**

| Tipo | Significado |
|---|---|
| `TRIPULACION` | Tarjeta y nombre de cada tripulante. Todos empiezan en el comedor |
| `PUERTA` | Alguien pasa de una sala a otra |
| `ENERGIA` | Nivel de energía de una sala (ruido) |
| `COMMS` | Mensajes de radio (ruido) |
| `MANTENIMIENTO` | Lo que hacen los drones (ruido) |
| `ALERTA` | El crimen: sala y momento |

**Trampas a propósito**, que es lo que obliga a leer el log con cuidado:
- **`DENEGADO`:** la puerta no se abrió, así que esa persona **no se movió**.
- **Drones** (`dron-3`) que usan puertas: no son tripulantes.
- **Mensajes `COMMS` que contienen `->` o el nombre de una sala**: quien busque con `"->" in linea` sin mirar el tipo, cae.
- **Varias líneas en el mismo minuto que la alerta:** cuenta **el orden de las líneas**, no solo el minuto.
- **Horas en formato `hh:mm`**, que en I2 hay que pasar a minutos.

---

### I1 · Sabotaje en el reactor
```python
def investigar(log):
    # log: el texto entero. Devuelve el NOMBRE del único tripulante que estaba
    # en la sala del sabotaje en el momento de la alerta.
```
**Cómo se resuelve, paso a paso:**
1. Recorrer el log línea a línea (`log.splitlines()`) y trocear cada una (`split()`).
2. Con las líneas `TRIPULACION`, montar un **diccionario tarjeta → nombre** y otro **tarjeta → sala actual** (todos empiezan en `"comedor"`).
3. Con cada `PUERTA` de un tripulante que **no** esté `DENEGADO`, actualizar su sala.
4. Al llegar a `ALERTA SABOTAJE <sala>`, ver quién está en esa sala en ese momento.

En el ejemplo de arriba, Vega entró en el reactor a las 00:15; Lindqvist lo intentó pero fue denegado; el dron no cuenta. **Respuesta: `"Vega"`** (verificado).
```python
def investigar(log):
    nombres, sala_de = {}, {}
    for linea in log.splitlines():
        if not linea.startswith("["):
            continue
        partes = linea.split()
        tipo = partes[1]
        if tipo == "TRIPULACION":
            nombres[partes[2]] = partes[3]
            sala_de[partes[2]] = "comedor"
        elif tipo == "PUERTA" and partes[2] in nombres and partes[-1] != "DENEGADO":
            sala_de[partes[2]] = partes[5]
        elif tipo == "ALERTA" and partes[2] == "SABOTAJE":
            return [nombres[t] for t, s in sala_de.items() if s == partes[3]][0]
```
Se practican: procesar texto (`splitlines`, `split`, `startswith`), **diccionarios como estado** y filtrar.

---

### I2 · El apagón (grafo)
El impostor ha aprendido. Justo antes del sabotaje **apaga el registro de puertas**:
```
[01:08] ERROR registro de puertas desactivado
[01:16] ALERTA SABOTAJE reactor
[01:20] INFO registro de puertas restaurado
[01:20] RECUENTO K-117 comedor
[01:20] RECUENTO K-204 puente
[01:20] RECUENTO K-311 comedor
```
No se sabe quién entró en el reactor. Pero sí se sabe:
- **dónde estaba cada uno** cuando se apagó el registro (01:08), reconstruyéndolo como en I1;
- **dónde estaba** cuando volvió (01:20), por el `RECUENTO`;
- **cómo es la estación**: no viene dibujada, se **deduce del propio log**. Cada `PUERTA a -> b` (también las `DENEGADO`, porque la puerta existe) significa que **a y b están conectadas por un pasillo**;
- **cruzar un pasillo cuesta 2 minutos** (lo dice el enunciado).

**El culpable es el único que pudo ir a la sala del crimen y llegar a tiempo, y después volver a donde apareció.**

**Qué es el grafo aquí, en palabras:**
- Las salas son puntos y los pasillos, líneas entre ellos.
- La **distancia** entre dos salas es el mínimo número de pasillos.
- Se calcula con un **recorrido en anchura (BFS)**: desde la sala del crimen, primero las salas a 1 pasillo, luego las que están a 2, y así sucesivamente, como una mancha que se extiende.

**Ejemplo resuelto** (verificado). La estación deducida del log es:
```
comedor ── hangar ── laboratorio ── reactor
                          │
                        puente
```
Apagón de 01:08 a 01:20 y crimen a las 01:16 en el reactor. Para ir hay **8 minutos** (01:08 → 01:16) y para volver, **4** (01:16 → 01:20).

| Tripulante | Antes del apagón | Después | Ida al reactor | Vuelta | ¿Pudo? |
|---|---|---|---|---|---|
| Vega | comedor | comedor | 3 pasillos = 6 min ≤ 8 ✓ | 3 pasillos = 6 min > 4 ✗ | No |
| **Okafor** | laboratorio | puente | 1 pasillo = 2 min ✓ | 2 pasillos = 4 min ≤ 4 ✓ | **Sí** |
| Lindqvist | hangar | comedor | 2 pasillos = 4 min ✓ | 3 pasillos = 6 min ✗ | No |

**Respuesta: `"Okafor"`**.
```python
from collections import deque

def distancias(mapa, origen):            # BFS: número mínimo de pasillos
    dist = {origen: 0}
    cola = deque([origen])
    while cola:
        sala = cola.popleft()
        for vecina in mapa[sala]:
            if vecina not in dist:
                dist[vecina] = dist[sala] + 1
                cola.append(vecina)
    return dist
```
Además, el alumno tiene que:
- construir `mapa` (sala → conjunto de salas vecinas) a partir de las líneas `PUERTA`;
- pasar las horas a minutos;
- reconstruir las posiciones hasta el apagón;
- leer el `RECUENTO`;
- aplicar la condición a cada tripulante.

Se practican: todo lo de I1, más **construir un grafo desde datos**, BFS, conjuntos y aritmética de tiempos.

---

### Cómo se corrige (I1 e I2)
- **Motor:** una llamada por caso. El parámetro es el log como texto (unos 100–250 KB, dentro de los límites).
- **El generador simula de verdad a la tripulación:**
  - 6 tripulantes, 2 o 3 drones y 7 salas;
  - 2–3 horas de paseos aleatorios por el grafo de la estación, con ruido intercalado (`ENERGIA`, `COMMS`, `MANTENIMIENTO`) y puertas denegadas;
  - después coloca el crimen de forma que **haya exactamente un culpable posible**: en I1, una sola persona en la sala; en I2, una sola que llega a tiempo de ida y vuelta.
- **Escenarios:** 2 visibles y 6 ocultos.
  - **I1:** cada oculto lleva al menos una trampa: alguien denegado en la puerta del crimen, `COMMS` engañosos y una entrada en el mismo minuto de la alerta pero **después** de ella.
  - **I2:** un tripulante que llega a la sala justo a tiempo (`==`, no `<`) y un pasillo que **solo** aparece en una línea `DENEGADO`.
- **Éxito:** el nombre exacto, sin distinguir mayúsculas. Adivinar al azar en 8 casos tiene una probabilidad de (1/6)⁸.
- **Estrellas:** ⭐⭐⭐ si se aprueba.

### Frontal
**Pestaña 📁 Expediente: un visor de log de verdad**, antes de ejecutar:
```
┌──────────────────────────── 📜 LOG · Hiperión · 2.418 líneas ───────────────┐
│ 🔎 [buscar…]   Tipo: [✓PUERTA ✓ALERTA ☐ENERGIA ☐COMMS ☐MANT.]  Tarjeta [▾]  │
│ 0412 [01:03] PUERTA   K-117 hangar -> laboratorio                           │
│ 0413 [01:03] ENERGIA  reactor 71%                                           │
│ 0414 [01:04] COMMS    K-204 "¿alguien ha visto mi taza?"                    │
│ 0415 [01:05] PUERTA   K-311 laboratorio -> reactor  DENEGADO                │  ← colores por tipo
│ 0416 [01:08] ERROR    registro de puertas desactivado                       │  ← resaltado
└─────────────────────────────────────────────────────────────────────────────┘
```
- Estética de terminal: monoespaciada, colores por tipo, números de línea, búsqueda y filtros. Va **virtualizado** para miles de líneas.
- El alumno puede **investigar a mano** con los filtros, y es parte de la gracia. Pero el log es demasiado largo para hacerlo entero, y los ocultos no se ven.
- **En I1** se muestra también el plano de la estación. **En I2 no:** deducirlo es parte del reto.

**Visor al ejecutar:**
- **I1:** el plano se oscurece, un foco ilumina al acusado y su ficha se sella como «ACUSADO». Si acierta: «✅ Confesión obtenida». Si falla en un caso visible: «❌ Vega estaba en el hangar en la alerta (línea 1.204)», con salto a esa línea del log.
- **I2:** se dibuja **el grafo deducido** de la estación y se animan las rutas de cada tripulante: ida al reactor y vuelta. Las imposibles se ponen en rojo con su cuenta («6 min > 4») y la del culpable, en verde. Es la explicación visual del razonamiento.
- **Móvil:** el log a ancho completo, los filtros plegables y el plano o grafo debajo.

### IA
La IA **no conoce al culpable**: solo ve el enunciado, el código y unas pocas líneas del log visible. Puede ayudar a:
- **trocear líneas:** «¿qué te da `linea.split()`?»;
- **detectar trampas:** «¿qué pasa con las puertas denegadas?»;
- en I2, **explicar BFS**.

### Riesgos propios
- **Tamaño:** un log de 250 KB por escenario en la entrada, pero no en la respuesta (no se devuelve). En el frontal, la tabla va virtualizada.
- **Formato del log:** una gramática fija y documentada en el enunciado (`[hh:mm] TIPO …`). El generador la usa siempre, y un test comprueba que todas las líneas generadas la cumplen.
- **Unicidad del culpable:** el generador lo garantiza y lo comprueba con la solución de referencia en las semillas 0–499.

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
| **R2 · El transmisor morse**: cualquier mensaje, con los tiempos del morse y **cada palabra en una nota distinta** | Intermedio | Estructuras de Datos | 200 | [M] |
| **R3 · La señal con ruido**: el camino inverso. Llega una transmisión **dañada** y hay que **descifrarla** a texto | Difícil | Algoritmos Avanzados | 300 | [M] |
| R4 · La melodía del púlsar: secuencia fractal (`púlsar(n) = A + A transportado + A`) | Difícil | Recursión | 300 | [D] |

### Qué escribe el alumno
```python
def transmitir(senal):
    # senal = {"nota": "la", "repeticiones": 3}
    return [("la", 1), ("silencio", 1), ("la", 1), ...]   # (nota, duración en pulsos)
```
- **Notas:** `do re mi fa sol la si` y la octava de arriba `do2 re2…` (una lista `ESCALA` en el código base), más `"silencio"`.
- **R1:** «S = 3 pitidos de 1 pulso; O = 3 pitidos de 3 pulsos; entre pitidos, 1 pulso de silencio; al final de cada SOS, 4 pulsos de silencio».
- **R2** (`senal = {"mensaje": "hola  tierra", "nota": "si2"}`). El código base trae el diccionario `MORSE`. Para que no sea un simple traductor, tiene cuatro reglas que hay que cuidar a la vez:
  1. **Tiempos estándar:** punto 1, raya 3, 1 de silencio dentro de una letra, 3 entre letras, 7 entre palabras y **nada al final**.
  2. **Cada palabra se emite en la siguiente nota de la `ESCALA`**, empezando por `senal["nota"]` y **volviendo al principio** tras la última (`%`).
  3. El mensaje puede venir **en minúsculas** y con **varios espacios seguidos**, que cuentan como una sola separación.
  4. Los caracteres que no estén en `MORSE` (`¿`, `!`…) **se ignoran**.

  Ejemplo verificado: `{"mensaje": "et a", "nota": "si2"}` →
  `[("si2", 1), ("silencio", 3), ("si2", 3), ("silencio", 7), ("do", 1), ("silencio", 1), ("do", 3)]`.
  La segunda palabra suena en `do` porque después de `si2` se vuelve al principio.
- **R3 · La señal con ruido.** La función es otra: `recibir(senal)` → texto. Llega una lista como las de R2, pero **dañada**:
  - **Duraciones imprecisas:**
    - pitidos de 1–2 pulsos = punto; de 3–5 = raya;
    - silencios de 1–2 = dentro de la letra; de 3–5 = entre letras; de 6 o más = entre palabras.
  - **Estática:** aparecen entradas `("estatica", n)` que hay que quitar, y si dejan **dos silencios juntos, se suman**.
  - Puede empezar o acabar con silencio.

  **Cómo se resuelve:**
  1. Limpiar la estática y fusionar los silencios.
  2. Clasificar cada duración con umbrales.
  3. Ir acumulando puntos y rayas en la letra actual.
  4. Al llegar un silencio largo, traducir la letra con el **diccionario invertido** (`{código: letra}`) y añadir un espacio si es entre palabras.

  Ejemplo verificado: `[("la", 2), ("silencio", 2), ("estatica", 1), ("silencio", 2), ("la", 4)]`:
  - quitada la estática, los dos silencios suman 4, que es separación entre letras;
  - se leen `.` y `-`, así que el resultado es **`"ET"`**.
  ```python
  INVERSO = {codigo: letra for letra, codigo in MORSE.items()}

  def recibir(senal):
      limpia = []
      for tipo, d in senal:
          if tipo == "estatica":
              continue
          if limpia and tipo == "silencio" and limpia[-1][0] == "silencio":
              limpia[-1] = ("silencio", limpia[-1][1] + d)
          else:
              limpia.append((tipo, d))
      texto, letra = "", ""
      for tipo, d in limpia:
          if tipo != "silencio":
              letra += "." if d <= 2 else "-"
          elif d >= 3:
              texto += INVERSO.get(letra, "?") if letra else ""
              letra = ""
              if d >= 6:
                  texto += " "
      texto += INVERSO.get(letra, "") if letra else ""
      return texto.strip()
  ```
  - **Comprobado:** 150 mensajes codificados con R2 y dañados con ruido aleatorio se descifran todos bien.
  - Se practican: limpiar datos, umbrales, acumuladores, invertir un diccionario y casos límite al principio y al final.

### Ejecución
- **Motor:** una llamada por escenario. Se compara la lista con la de referencia.
- **Si falla, se indica la primera diferencia:** «en la posición 14 esperaba `("silencio", 3)` y llegó `("silencio", 1)`».
- **Escenarios:**
  - R1: 2 visibles y 4 ocultos (otras notas y repeticiones, incluida 1 repetición).
  - R2: 2 visibles («SOS», «hola  tierra») y 5 ocultos (una letra sola, espacios dobles, signos que se ignoran, más palabras que notas para forzar la vuelta al principio de la escala).
  - R3: 2 visibles y 6 ocultos (mensajes distintos, estática al principio y al final, todos los extremos de los umbrales: 2, 3, 5 y 6).
- **R3 se corrige comparando el texto** (mayúsculas y espacios simples). Si falla, se muestra la primera letra mal descifrada.
- **Validación (R1, R2):** que sea una lista de tuplas `(str, int)` con notas válidas y duraciones de 1 a 16, con 4.000 elementos como máximo.
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
- **R3:** suena la señal dañada, con chasquidos en la estática. Debajo de la onda, **tu texto descifrado aparece letra a letra como un teletipo** a la vez que avanza el cabezal, y la primera letra errónea se pone en rojo.

### IA
Puede ayudar con los tiempos del morse, con la vuelta de la escala (`%`) y, en R3, con la idea de umbrales y del diccionario invertido. No genera la lista ni el decodificador enteros.

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
| **Fácil** | 💣 B1 · 👽 L1 · 🔐 C1 · 🎨 N1 · 🎵 R1 | `if/elif`, listas, índices, bucles, fuerza bruta, hash, coordenadas |
| **Intermedio** | 💣 B2 · 👽 L2 · 🔐 C2 · 🔍 I1 · 🎨 N2 · 🎵 R2 · 🧬 Co1 | funciones, diccionarios, procesar texto, búsqueda binaria, operadores, `%` |
| **Difícil** | 👽 L3 · 🔐 C3 · 🔍 I2 · 🎵 R3 | grafos (flood fill, BFS), deducción con filtrado, limpiar y descifrar datos |

**16 retos en la v1.** Los marcados [D] y [O] (B3, L4, N3, R4 y Co2) se dejan para cuando funcionen los primeros. Los puntos siguen la escala de las misiones: 150 / 200 / 300.

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
| R7 | **Puzles imposibles o triviales** (colonia, C3) | Media | Alto | Validadores automáticos en los tests (referencia aprueba, reglas tontas fallan, tasa de reglas aleatorias que aprueban). Para C3 ya está verificado (máximo 9 de 10) |
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
| **5.3** | 🔐 Cámara acorazada (C1, C2, C3) | M | C1 es una llamada normal; C2 y C3 estrenan E4 (consultas) de forma aislada |
| **5.4** | 🔍 Impostor (I1, I2) | M | El frontal más grande (visor de log, plano y grafo animado) |
| **5.5** | 🎨 Nebulosa (N1, N2) | S | Estrena E3 (lotes) con la paleta ya hecha |
| **5.6** | 🎵 Radio (R1, R2, R3) | M | Audio: independiente de todo lo demás |
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
