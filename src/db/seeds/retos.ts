// Retos de la fase 5 (los crean las migraciones 013 en adelante). Diseño: docs/diseno/fase-5-retos.md

export interface RetoSemilla {
  titulo: string;
  categoria: string;
  nivel: string;
  puntos: number;
  descripcion: string;
  codigoBase: string;
  resultadoEsperado: string;
  solucion: string;
  config: {
    mision: string;
    formato: string;
    escenarios: { nombre?: string; semilla: number; params?: Record<string, any>; oculto?: boolean }[];
  };
}

// ---------------- 💣 Bomba (fase 5.1) ----------------

const MANUAL_CABLES = `📕 MANUAL · MÓDULO DE CABLES
Las posiciones empiezan en 0: «el segundo cable» es la posición 1. Los cables no se mueven al cortarlos.

Paso 1 · Primer corte (aplica la PRIMERA regla que se cumpla):
  1. Si no hay ningún cable rojo → corta el segundo cable.
  2. Si el último cable es blanco → corta el último cable.
  3. Si hay más de un cable azul → corta el último cable azul.
  4. Si la última cifra del número de serie es impar → corta el último cable.
  5. En cualquier otro caso → corta el primero.

Paso 2 · ¿Hay que cortar otro? Mira el color del cable que acabas de cortar:
  • Azul → corta también el de su derecha (si era el último, no cortes nada más).
  • Rojo → no cortes nada más.
  • Otro color → si el número de serie tiene alguna vocal, corta también el último cable que quede sin cortar; si no, nada más.

Ejemplo: cables ["rojo", "azul", "blanco", "azul", "negro"], serie "K7Q2M5".
  Regla 1: hay rojo ✗ · Regla 2: el último es negro ✗ · Regla 3: hay dos azules ✓ → corto el 3.
  Paso 2: el 3 era azul → corto también el 4. Respuesta: [3, 4]`;

const SOLUCION_CABLES = `def primer_corte(cables, serie):
    if "rojo" not in cables:
        return 1
    if cables[-1] == "blanco":
        return len(cables) - 1
    if cables.count("azul") > 1:
        return len(cables) - 1 - cables[::-1].index("azul")
    if int(serie[-1]) % 2 == 1:
        return len(cables) - 1
    return 0


def cortes_cables(cables, serie):
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
`;

const COLUMNAS = `COLUMNAS = [
    ["🪐", "🌍", "🛸", "🌙", "⭐", "🌀", "👾"],
    ["🔭", "🌙", "💎", "🪐", "💫", "🌍", "🌑"],
    ["🌀", "🚀", "👽", "🔭", "⭐", "🌑", "🌠"],
    ["👾", "🌠", "💫", "🛸", "🚀", "💎", "👽"],
]`;

export const retosBomba: RetoSemilla[] = [
  {
    titulo: '💣 Bomba de cables',
    categoria: 'Estructuras Condicionales',
    nivel: 'Fácil',
    puntos: 150,
    descripcion: `¡Hay una bomba en la bodega! Tienes el manual de desactivación y 30 segundos.
Escribe desactivar(bomba): lee la bomba y devuelve la LISTA de cables que cortas, en orden.

Recibes un diccionario:
- cables: lista de colores, de 3 a 6 (rojo, azul, blanco, amarillo, negro)
- serie: el número de serie (6 caracteres; el último siempre es una cifra)

${MANUAL_CABLES}

Tienes el manual también en la pestaña 📕 Manual, con las bombas de los escenarios visibles.`,
    codigoBase: `def desactivar(bomba):
    cables = bomba["cables"]
    serie = bomba["serie"]

    # Paso 1: ¿qué regla del manual se cumple primero?

    # Paso 2: ¿hay que cortar otro cable?

    return [0]
`,
    resultadoEsperado: 'Desactivar las 10 bombas (3 visibles y 7 ocultas) siguiendo el manual al pie de la letra.',
    solucion: `${SOLUCION_CABLES}

def desactivar(bomba):
    return cortes_cables(bomba["cables"], bomba["serie"])
`,
    config: {
      mision: 'bomba',
      formato: 'bomba',
      escenarios: [
        { nombre: 'Bomba de la bodega', semilla: 101, params: { variante: 'cables', objetivo: [3, 'azul'] } },
        { nombre: 'Bomba de la cocina', semilla: 102, params: { variante: 'cables', objetivo: [1, 'vocal'] } },
        { nombre: 'Bomba del reactor', semilla: 103, params: { variante: 'cables', objetivo: [5, 'rojo'] } },
        { semilla: 9101, params: { variante: 'cables', objetivo: [2, 'sin_vocal'] }, oculto: true },
        { semilla: 9102, params: { variante: 'cables', objetivo: [4, 'azul_final'] }, oculto: true },
        { semilla: 9103, params: { variante: 'cables', objetivo: [3, 'azul_final'] }, oculto: true },
        { semilla: 9104, params: { variante: 'cables', objetivo: [1, 'azul'] }, oculto: true },
        { semilla: 9105, params: { variante: 'cables', objetivo: [4, 'vocal'] }, oculto: true },
        { semilla: 9106, params: { variante: 'cables', objetivo: [5, 'sin_vocal'] }, oculto: true },
        { semilla: 9107, params: { variante: 'cables', objetivo: [2, 'vocal'] }, oculto: true },
      ],
    },
  },
  {
    titulo: '💣 Bomba de módulos',
    categoria: 'Funciones',
    nivel: 'Intermedio',
    puntos: 200,
    descripcion: `Esta bomba tiene TRES módulos y hay que desactivarlos todos.
Escribe desactivar(bomba), que devuelva un diccionario con la respuesta de cada módulo:
  {"cables": [3, 4], "boton": "mantener", "teclado": ["🪐", "🛸", "🌙", "👾"]}

Recibes un diccionario:
- cables y serie: como en la Bomba de cables
- baterias: número de baterías (0 a 4)
- boton: {"color": ..., "texto": ...}
- teclado: los 4 símbolos que muestra el teclado

Consejo: escribe una función por módulo y luego júntalas en desactivar.

${MANUAL_CABLES}

📕 MANUAL · MÓDULO DEL BOTÓN (aplica la PRIMERA regla que se cumpla)
  1. Si el botón es azul y pone «ABORTAR» → "mantener".
  2. Si hay más de una batería y pone «DETONAR» → "pulsar".
  3. Si el botón es blanco → "mantener".
  4. En cualquier otro caso → "pulsar".

📕 MANUAL · MÓDULO DEL TECLADO
Mira las 4 columnas de COLUMNAS (vienen en el código). Solo UNA contiene los 4 símbolos del teclado:
pulsa los símbolos en el orden en que aparecen en esa columna.`,
    codigoBase: `${COLUMNAS}


def modulo_cables(cables, serie):
    return [0]


def modulo_boton(boton, baterias):
    return "pulsar"


def modulo_teclado(simbolos):
    return simbolos


def desactivar(bomba):
    return {
        "cables": modulo_cables(bomba["cables"], bomba["serie"]),
        "boton": modulo_boton(bomba["boton"], bomba["baterias"]),
        "teclado": modulo_teclado(bomba["teclado"]),
    }
`,
    resultadoEsperado: 'Desactivar los tres módulos de las 10 bombas (3 visibles y 7 ocultas).',
    solucion: `${COLUMNAS}

${SOLUCION_CABLES}

def modulo_boton(boton, baterias):
    if boton["color"] == "azul" and boton["texto"] == "ABORTAR":
        return "mantener"
    if baterias > 1 and boton["texto"] == "DETONAR":
        return "pulsar"
    if boton["color"] == "blanco":
        return "mantener"
    return "pulsar"


def modulo_teclado(simbolos):
    for columna in COLUMNAS:
        if all(s in columna for s in simbolos):
            return sorted(simbolos, key=columna.index)


def desactivar(bomba):
    return {
        "cables": cortes_cables(bomba["cables"], bomba["serie"]),
        "boton": modulo_boton(bomba["boton"], bomba["baterias"]),
        "teclado": modulo_teclado(bomba["teclado"]),
    }
`,
    config: {
      mision: 'bomba',
      formato: 'bomba',
      escenarios: [
        { nombre: 'Bomba del puente', semilla: 201, params: { variante: 'modulos', objetivo: [3, 'azul'], boton: 1 } },
        { nombre: 'Bomba del hangar', semilla: 202, params: { variante: 'modulos', objetivo: [1, 'vocal'], boton: 2 } },
        { nombre: 'Bomba de la enfermería', semilla: 203, params: { variante: 'modulos', objetivo: [5, 'rojo'], boton: 4 } },
        { semilla: 9201, params: { variante: 'modulos', objetivo: [2, 'sin_vocal'], boton: 3 }, oculto: true },
        { semilla: 9202, params: { variante: 'modulos', objetivo: [4, 'azul_final'], boton: 1 }, oculto: true },
        { semilla: 9203, params: { variante: 'modulos', objetivo: [3, 'azul_final'], boton: 2 }, oculto: true },
        { semilla: 9204, params: { variante: 'modulos', objetivo: [1, 'azul'], boton: 3 }, oculto: true },
        { semilla: 9205, params: { variante: 'modulos', objetivo: [4, 'rojo'], boton: 4 }, oculto: true },
        { semilla: 9206, params: { variante: 'modulos', objetivo: [5, 'vocal'], boton: 2 }, oculto: true },
        { semilla: 9207, params: { variante: 'modulos', objetivo: [2, 'vocal'], boton: 3 }, oculto: true },
      ],
    },
  },
];


// ---------------- 👽 Lengua alienígena (fase 5.2) ----------------
// Las reglas NO se cuentan en el enunciado: se descubren con los ejemplos (escenarios visibles)

const PALETA = `Colores (un número por celda): 0 negro (vacío) · 1 azul · 2 rojo · 3 verde · 4 amarillo
5 gris · 6 morado · 7 naranja · 8 cian · 9 granate`;

const CODIGO_LENGUA = `def transformar(rejilla):
    # rejilla: lista de filas; cada fila, una lista de colores (0-9)
    filas = len(rejilla)
    columnas = len(rejilla[0])

    # Tu código aquí: devuelve la rejilla transformada

    return rejilla
`;

const enunciadoLengua = (historia: string) => `${historia}

Nadie te dice la regla: estúdiala en la pestaña 🛸 Ejemplos (cada ejemplo es una rejilla de entrada y lo que responden los alienígenas) y programa transformar(rejilla), que devuelva la rejilla transformada.
Después se comprueba con rejillas que no has visto (de otros tamaños), así que la regla tiene que valer para cualquiera.

${PALETA}`;

export const retosLengua: RetoSemilla[] = [
  {
    titulo: '👽 El espejo',
    categoria: 'Arrays y Listas',
    nivel: 'Fácil',
    puntos: 150,
    descripcion: enunciadoLengua('Los habitantes de Espéculo escriben sus mensajes en rejillas de colores… y lo ven todo un poco al revés.'),
    codigoBase: CODIGO_LENGUA,
    resultadoEsperado: 'Transformar bien las 3 rejillas de ejemplo y las 6 ocultas.',
    solucion: `def transformar(rejilla):
    return [fila[::-1] for fila in rejilla]
`,
    config: {
      mision: 'lengua',
      formato: 'lengua',
      escenarios: [
        { nombre: 'Ejemplo 1', semilla: 301, params: { variante: 'espejo', filas: 3, columnas: 4 } },
        { nombre: 'Ejemplo 2', semilla: 302, params: { variante: 'espejo', filas: 4, columnas: 5 } },
        { nombre: 'Ejemplo 3', semilla: 303, params: { variante: 'espejo', filas: 5, columnas: 3 } },
        { semilla: 9301, params: { variante: 'espejo', filas: 1, columnas: 7 }, oculto: true },
        { semilla: 9302, params: { variante: 'espejo', filas: 6, columnas: 1 }, oculto: true },
        { semilla: 9303, params: { variante: 'espejo', filas: 8, columnas: 8 }, oculto: true },
        { semilla: 9304, params: { variante: 'espejo', filas: 2, columnas: 10 }, oculto: true },
        { semilla: 9305, params: { variante: 'espejo', filas: 10, columnas: 3 }, oculto: true },
        { semilla: 9306, params: { variante: 'espejo' }, oculto: true },
      ],
    },
  },
  {
    titulo: '👽 La gravedad',
    categoria: 'Arrays y Listas',
    nivel: 'Intermedio',
    puntos: 200,
    descripcion: enunciadoLengua('En Pesadia la gravedad es tan fuerte que a los alienígenas les cuesta hasta levantarse por la mañana.'),
    codigoBase: CODIGO_LENGUA,
    resultadoEsperado: 'Transformar bien las 3 rejillas de ejemplo y las 6 ocultas.',
    solucion: `def transformar(rejilla):
    filas, columnas = len(rejilla), len(rejilla[0])
    salida = [[0] * columnas for _ in range(filas)]
    for c in range(columnas):
        colores = [rejilla[f][c] for f in range(filas) if rejilla[f][c] != 0]
        for i, color in enumerate(colores):
            salida[filas - len(colores) + i][c] = color
    return salida
`,
    config: {
      mision: 'lengua',
      formato: 'lengua',
      escenarios: [
        { nombre: 'Ejemplo 1', semilla: 311, params: { variante: 'gravedad', filas: 4, columnas: 4, trampa: true } },
        { nombre: 'Ejemplo 2', semilla: 312, params: { variante: 'gravedad', filas: 5, columnas: 6, trampa: true } },
        { nombre: 'Ejemplo 3', semilla: 313, params: { variante: 'gravedad', filas: 6, columnas: 3, trampa: true } },
        { semilla: 9311, params: { variante: 'gravedad', filas: 1, columnas: 6 }, oculto: true },
        { semilla: 9312, params: { variante: 'gravedad', filas: 8, columnas: 1, trampa: true }, oculto: true },
        { semilla: 9313, params: { variante: 'gravedad', filas: 10, columnas: 10, trampa: true }, oculto: true },
        { semilla: 9314, params: { variante: 'gravedad', filas: 3, columnas: 9 }, oculto: true },
        { semilla: 9315, params: { variante: 'gravedad', filas: 7, columnas: 5, trampa: true }, oculto: true },
        { semilla: 9316, params: { variante: 'gravedad', trampa: true }, oculto: true },
      ],
    },
  },
  {
    titulo: '👽 Los lagos',
    categoria: 'Grafos y Árboles',
    nivel: 'Difícil',
    puntos: 300,
    descripcion: enunciadoLengua(`Talasa es un planeta océano: el mar rodea cualquier rejilla por todos los lados. Los alienígenas levantan muros grises… y les gusta pintar de un color especial el agua que queda dentro.
Pista: el agua del mar solo se mueve arriba, abajo, izquierda y derecha, nunca en diagonal.`),
    codigoBase: CODIGO_LENGUA,
    resultadoEsperado: 'Transformar bien las 3 rejillas de ejemplo y las 6 ocultas.',
    solucion: `def transformar(rejilla):
    filas, columnas = len(rejilla), len(rejilla[0])
    mojadas = set()
    pendientes = [(f, c) for f in range(filas) for c in range(columnas)
                  if (f in (0, filas - 1) or c in (0, columnas - 1)) and rejilla[f][c] == 0]
    while pendientes:
        f, c = pendientes.pop()
        if (f, c) in mojadas:
            continue
        mojadas.add((f, c))
        for df, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nf, nc = f + df, c + dc
            if 0 <= nf < filas and 0 <= nc < columnas and rejilla[nf][nc] == 0:
                pendientes.append((nf, nc))
    return [[1 if v == 0 and (f, c) not in mojadas else v for c, v in enumerate(fila)]
            for f, fila in enumerate(rejilla)]
`,
    config: {
      mision: 'lengua',
      formato: 'lengua',
      escenarios: [
        { nombre: 'Ejemplo 1', semilla: 321, params: { variante: 'lagos', filas: 7, columnas: 7, hueco: false } },
        { nombre: 'Ejemplo 2', semilla: 322, params: { variante: 'lagos', filas: 8, columnas: 9 } },
        { nombre: 'Ejemplo 3', semilla: 323, params: { variante: 'lagos', filas: 8, columnas: 8, diagonal: true } },
        { semilla: 9321, params: { variante: 'lagos', filas: 6, columnas: 12 }, oculto: true },
        { semilla: 9322, params: { variante: 'lagos', filas: 12, columnas: 12, diagonal: true }, oculto: true },
        { semilla: 9323, params: { variante: 'lagos', filas: 10, columnas: 7, hueco: false }, oculto: true },
        { semilla: 9324, params: { variante: 'lagos', filas: 9, columnas: 11 }, oculto: true },
        { semilla: 9325, params: { variante: 'lagos', filas: 12, columnas: 8, diagonal: true }, oculto: true },
        { semilla: 9326, params: { variante: 'lagos' }, oculto: true },
      ],
    },
  },
];
