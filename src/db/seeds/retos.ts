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


// ---------------- 🔐 Cámara acorazada (fase 5.3) ----------------
// Tres cámaras del banco de Ceres, cada una mejor protegida: fuerza bruta → búsqueda binaria → deducción

export const retosCamara: RetoSemilla[] = [
  {
    titulo: '🔐 La huella del PIN',
    categoria: 'Bucles',
    nivel: 'Fácil',
    puntos: 150,
    descripcion: `El banco de Ceres no guarda los PIN de sus cámaras: guarda su HUELLA.
Una huella (hash SHA-256) es un texto de 64 caracteres que sale de pasar el PIN por una función: el mismo PIN da siempre la misma huella, pero de la huella NO se puede volver al PIN. La única forma de encontrarlo es probar PINs hasta dar con uno cuya huella coincida: eso es la FUERZA BRUTA.

Esta primera cámara no tiene alarma: puedes probar todo lo que quieras.

Escribe abrir(caja), que devuelva el PIN (como texto). Recibes un diccionario:
- huella: la huella del PIN
- candidatos: una lista de PINs sospechosos que consiguió un espía… o None si no consiguió nada
- cifras: cuántas cifras tiene el PIN

Si no hay candidatos, tendrás que probar TODOS los PIN posibles (0000, 0001, …). Ojo: el PIN 7 de 4 cifras es "0007", no "7".
La función huella(texto) ya está en el código.`,
    codigoBase: `import hashlib


def huella(texto):
    return hashlib.sha256(texto.encode()).hexdigest()


def abrir(caja):
    objetivo = caja["huella"]

    # Tu código aquí: prueba PINs hasta que huella(pin) == objetivo

    return "0000"
`,
    resultadoEsperado: 'Abrir las 8 cámaras (2 visibles y 6 ocultas), con y sin lista de candidatos.',
    solucion: `import hashlib


def huella(texto):
    return hashlib.sha256(texto.encode()).hexdigest()


def abrir(caja):
    candidatos = caja["candidatos"]
    if candidatos is None:
        cifras = caja["cifras"]
        candidatos = [str(n).zfill(cifras) for n in range(10 ** cifras)]
    for pin in candidatos:
        if huella(pin) == caja["huella"]:
            return pin
`,
    config: {
      mision: 'camara',
      formato: 'camara',
      escenarios: [
        { nombre: 'La lista del espía', semilla: 401, params: { variante: 'huella', candidatos: 500 } },
        { nombre: 'Sin pistas', semilla: 402, params: { variante: 'huella' } },
        { semilla: 9401, params: { variante: 'huella', candidatos: 50, posicion: 'inicio' }, oculto: true },
        { semilla: 9402, params: { variante: 'huella', candidatos: 2000, posicion: 'fin' }, oculto: true },
        { semilla: 9403, params: { variante: 'huella', pin: '0000' }, oculto: true },
        { semilla: 9404, params: { variante: 'huella', pin: '9999' }, oculto: true },
        { semilla: 9405, params: { variante: 'huella', cifras: 5 }, oculto: true },
        { semilla: 9406, params: { variante: 'huella', candidatos: 300, repetido: true }, oculto: true },
      ],
    },
  },
  {
    titulo: '🔐 La cámara de Ceres',
    categoria: 'Algoritmos de Búsqueda',
    nivel: 'Intermedio',
    puntos: 200,
    descripcion: `La segunda cámara es más lista: tiene ALARMA. Aquí probar uno a uno no te da tiempo.
Escribe abrir(caja). La caja tiene:
- caja.minimo y caja.maximo: el código secreto está entre ellos (ambos incluidos)
- caja.intentos: cuántos intentos tienes antes de que salte la alarma
- caja.probar(n): prueba el número n y responde
    "mayor"   → el código es MAYOR que n
    "menor"   → el código es MENOR que n
    "abierta" → ¡acertaste!

Con un millón de números solo tienes 20 intentos. Piensa: ¿qué número probarías primero para descartar lo máximo posible?
Si se te acaban los intentos, salta la alarma (la excepción Alarma) y la misión falla.`,
    codigoBase: `def abrir(caja):
    # caja.minimo, caja.maximo, caja.intentos
    respuesta = caja.probar(caja.minimo)

    # Tu código aquí

`,
    resultadoEsperado: 'Abrir las 8 cámaras (2 visibles y 6 ocultas) sin que salte la alarma.',
    solucion: `def abrir(caja):
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
`,
    config: {
      mision: 'camara',
      formato: 'camara',
      escenarios: [
        { nombre: 'Cámara pequeña (1–1.000)', semilla: 411, params: { variante: 'binaria', maximo: 1000, secreto: 731 } },
        { nombre: 'Cámara grande (1–1.000.000)', semilla: 412, params: { variante: 'binaria', maximo: 1000000 } },
        { semilla: 9411, params: { variante: 'binaria', maximo: 1000, secreto: 1 }, oculto: true },
        { semilla: 9412, params: { variante: 'binaria', maximo: 1000000, secreto: 1000000 }, oculto: true },
        { semilla: 9413, params: { variante: 'binaria', maximo: 1000000, secreto: 500000 }, oculto: true },
        { semilla: 9414, params: { variante: 'binaria', maximo: 1000000000 }, oculto: true },
        { semilla: 9415, params: { variante: 'binaria', maximo: 1000000, secreto: 987654 }, oculto: true },
        { semilla: 9416, params: { variante: 'binaria', maximo: 2 }, oculto: true },
      ],
    },
  },
  {
    titulo: '🔐 La cerradura de combinación',
    categoria: 'Optimización',
    nivel: 'Difícil',
    puntos: 300,
    descripcion: `La última cámara solo te da pistas a medias. La combinación son 4 cifras DISTINTAS (por ejemplo "4271") y tienes 10 intentos.
Escribe abrir(caja). caja.probar("0123") responde:
- "abierta" si aciertas, o
- {"exactos": e, "descolocados": d}
    exactos: cifras correctas EN SU SITIO
    descolocados: cifras que están en la combinación pero en OTRO sitio

Ejemplo: si el secreto es "4271" y pruebas "0123" → {"exactos": 0, "descolocados": 2} (el 1 y el 2 están, pero no en ese sitio).

Probar al azar no llega. Pista: cada respuesta te dice mucho de qué combinaciones YA NO pueden ser…
⭐⭐⭐ si la abres en 7 intentos o menos en todas las cámaras, ⭐⭐ en 8 y ⭐ en 9 o 10.`,
    codigoBase: `def abrir(caja):
    # caja.cifras (4), caja.intentos (10)
    respuesta = caja.probar("0123")

    # Tu código aquí

`,
    resultadoEsperado: 'Abrir las 8 cerraduras (2 visibles y 6 ocultas) en 10 intentos como máximo.',
    solucion: `from itertools import permutations


def comparar(intento, secreto):
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
`,
    config: {
      mision: 'camara',
      formato: 'camara',
      escenarios: [
        { nombre: 'Cerradura del vestíbulo', semilla: 421, params: { variante: 'combinacion', secreto: '4271' } },
        { nombre: 'Cerradura del sótano', semilla: 422, params: { variante: 'combinacion' } },
        { semilla: 9421, params: { variante: 'combinacion', secreto: '9431' }, oculto: true },
        { semilla: 9422, params: { variante: 'combinacion', secreto: '0123' }, oculto: true },
        { semilla: 9423, params: { variante: 'combinacion', secreto: '9876' }, oculto: true },
        { semilla: 9424, params: { variante: 'combinacion' }, oculto: true },
        { semilla: 9425, params: { variante: 'combinacion' }, oculto: true },
        { semilla: 9426, params: { variante: 'combinacion', secreto: '5293' }, oculto: true },
      ],
    },
  },
];

// ---------------- 🔍 Impostor (fase 5.4) ----------------

const FORMATO_LOG = `Cada línea del registro es «[hh:mm] TIPO datos…». Los tipos:
  TRIPULACION K-117 Vega            → tarjeta y nombre de un tripulante (todos empiezan en el comedor)
  PUERTA K-117 comedor -> hangar    → alguien pasa de una sala a otra
  PUERTA K-311 hangar -> reactor DENEGADO → la puerta NO se abrió: no se movió
  ENERGIA reactor 98%               → ruido
  COMMS K-204 "voy al hangar -> luego al reactor" → mensajes de radio (ruido)
  MANTENIMIENTO dron-3 limpieza en reactor        → los drones (dron-3) no son tripulantes
  ALERTA SABOTAJE reactor           → el crimen: en esa sala, en ese momento
La primera línea es un título (no empieza por «[»). Si hay varias líneas en el mismo minuto, cuenta su ORDEN.`;

export const retosImpostor: RetoSemilla[] = [
  {
    titulo: '🔍 Sabotaje en el reactor',
    categoria: 'Estructuras de Datos',
    nivel: 'Intermedio',
    puntos: 200,
    descripcion: `Han saboteado la estación Hiperión y solo tienes el registro del sistema: más de mil líneas donde pasa de todo.
Escribe investigar(log). log es el registro ENTERO como un único texto. Devuelve el NOMBRE (por ejemplo "Vega") del único tripulante que estaba en la sala del sabotaje en el momento de la alerta.

${FORMATO_LOG}

Pistas: log.splitlines() te da las líneas y linea.split() los trozos de cada una. Un diccionario tarjeta → sala te dice dónde está cada uno en cada momento.
En la pestaña 📁 Expediente tienes el registro de los escenarios visibles para investigarlo a mano con los filtros.`,
    codigoBase: `def investigar(log):
    for linea in log.splitlines():
        partes = linea.split()

        # Tu código aquí

    return "nadie"  # el NOMBRE del culpable
`,
    resultadoEsperado: 'Señalar al culpable en los 8 casos (2 visibles y 6 ocultos), sin caer en las trampas del registro.',
    solucion: `def investigar(log):
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
`,
    config: {
      mision: 'impostor',
      formato: 'impostor',
      escenarios: [
        { nombre: 'Primer turno', semilla: 431, params: { variante: 'reactor', trampas: ['denegado'] } },
        { nombre: 'Turno de noche', semilla: 432, params: { variante: 'reactor' } },
        { semilla: 9431, params: { variante: 'reactor' }, oculto: true },
        { semilla: 9432, params: { variante: 'reactor' }, oculto: true },
        { semilla: 9433, params: { variante: 'reactor', duracion: 120 }, oculto: true },
        { semilla: 9434, params: { variante: 'reactor', duracion: 180 }, oculto: true },
        { semilla: 9435, params: { variante: 'reactor' }, oculto: true },
        { semilla: 9436, params: { variante: 'reactor', duracion: 200 }, oculto: true },
      ],
    },
  },
  {
    titulo: '🔍 El apagón',
    categoria: 'Grafos y Árboles',
    nivel: 'Difícil',
    puntos: 300,
    descripcion: `El impostor ha aprendido: justo antes del sabotaje APAGA el registro de puertas. Nadie sabe quién entró en la sala.
Escribe investigar(log) y devuelve el NOMBRE del culpable. Además de las líneas de siempre, ahora hay:
  ERROR registro de puertas desactivado → desde aquí no hay líneas PUERTA
  ALERTA SABOTAJE reactor              → el crimen (durante el apagón)
  INFO registro de puertas restaurado  → vuelve el registro
  RECUENTO K-117 comedor               → dónde está cada tripulante al volver

${FORMATO_LOG}

Lo que sabes:
- Dónde estaba cada uno al apagarse el registro (reconstrúyelo como en «Sabotaje en el reactor»).
- Dónde estaba al volver (RECUENTO).
- Cómo es la estación: NO te la damos. Cada PUERTA a -> b (también las DENEGADO: la puerta existe) significa que a y b están unidas por un pasillo.
- Cruzar un pasillo cuesta 2 minutos.

El culpable es el ÚNICO que pudo ir desde donde estaba a la sala del crimen y llegar a tiempo, y después volver a donde apareció en el RECUENTO también a tiempo.
Pista: la distancia entre dos salas es el mínimo número de pasillos; calcúlala con un recorrido en anchura (BFS) desde la sala del crimen. Las horas «hh:mm» pásalas a minutos.`,
    codigoBase: `from collections import deque


def investigar(log):
    mapa = {}  # sala → conjunto de salas vecinas
    for linea in log.splitlines():
        partes = linea.split()

        # Tu código aquí

    return "nadie"  # el NOMBRE del culpable
`,
    resultadoEsperado: 'Señalar al culpable en los 8 apagones (2 visibles y 6 ocultos).',
    solucion: `from collections import deque


def minutos(marca):
    hh, mm = marca.strip("[]").split(":")
    return int(hh) * 60 + int(mm)


def distancias(mapa, origen):
    dist = {origen: 0}
    cola = deque([origen])
    while cola:
        sala = cola.popleft()
        for vecina in mapa[sala]:
            if vecina not in dist:
                dist[vecina] = dist[sala] + 1
                cola.append(vecina)
    return dist


def investigar(log):
    nombres, sala_de, despues, mapa = {}, {}, {}, {}
    for linea in log.splitlines():
        if not linea.startswith("["):
            continue
        partes = linea.split()
        tipo = partes[1]
        if tipo == "TRIPULACION":
            nombres[partes[2]] = partes[3]
            sala_de[partes[2]] = "comedor"
        elif tipo == "PUERTA":
            a, b = partes[3], partes[5]
            mapa.setdefault(a, set()).add(b)
            mapa.setdefault(b, set()).add(a)
            if partes[2] in nombres and partes[-1] != "DENEGADO":
                sala_de[partes[2]] = b
        elif tipo == "ERROR":
            apagado = minutos(partes[0])
            antes = dict(sala_de)
        elif tipo == "ALERTA":
            crimen, sala = minutos(partes[0]), partes[3]
        elif tipo == "INFO":
            restaurado = minutos(partes[0])
        elif tipo == "RECUENTO":
            despues[partes[2]] = partes[3]
    dist = distancias(mapa, sala)
    for tarjeta, nombre in nombres.items():
        if 2 * dist[antes[tarjeta]] <= crimen - apagado and 2 * dist[despues[tarjeta]] <= restaurado - crimen:
            return nombre
`,
    config: {
      mision: 'impostor',
      formato: 'impostor',
      escenarios: [
        { nombre: 'Primer apagón', semilla: 441, params: { variante: 'apagon', trampas: ['justo'] } },
        { nombre: 'Apagón en la guardia', semilla: 442, params: { variante: 'apagon' } },
        { semilla: 9441, params: { variante: 'apagon' }, oculto: true },
        { semilla: 9442, params: { variante: 'apagon' }, oculto: true },
        { semilla: 9443, params: { variante: 'apagon', duracion: 120 }, oculto: true },
        { semilla: 9444, params: { variante: 'apagon', duracion: 180 }, oculto: true },
        { semilla: 9445, params: { variante: 'apagon' }, oculto: true },
        { semilla: 9446, params: { variante: 'apagon', duracion: 200 }, oculto: true },
      ],
    },
  },
];

// ---------------- 🎨 Nebulosa (fase 5.5) ----------------

const LIENZO = `Escribe color(x, y, ancho, alto): devuelve el color de UN píxel. La web la llama una vez por cada píxel del lienzo y la imagen aparece.
- x va de 0 a ancho-1 (de izquierda a derecha) e y de 0 a alto-1 (de ARRIBA a ABAJO, como en las pantallas).
- Devuelve un color de la paleta, por nombre ("morado") o por número: 0 negro · 1 azul · 2 rojo · 3 verde · 4 amarillo · 5 gris · 6 morado · 7 naranja · 8 cian · 9 granate.
- Los escenarios ocultos tienen OTROS tamaños (alguno de un solo píxel de alto): usa siempre ancho y alto, nunca números fijos.
- Las distancias se miden desde el CENTRO de cada píxel, que está en (x + 0.5, y + 0.5).`;

export const retosNebulosa: RetoSemilla[] = [
  {
    titulo: '🎨 La bandera de Kepler',
    categoria: 'Estructuras Condicionales',
    nivel: 'Fácil',
    puntos: 150,
    descripcion: `La colonia de Kepler necesita su bandera y la vas a pintar con código.
${LIENZO}

La bandera:
- Tres franjas verticales iguales: morado, naranja y morado. La franja de un píxel es x * 3 // ancho (0, 1 o 2).
- Un sol amarillo en el centro del lienzo (ancho / 2, alto / 2), con radio min(ancho, alto) // 4. Un píxel es del sol si su distancia al centro es menor o igual que el radio. Pista: compara los cuadrados, (x + 0.5 - ancho / 2) ** 2 + … <= radio ** 2, y te ahorras la raíz.
- El sol va por encima de las franjas.

Tiene que coincidir el 100 % de los píxeles.`,
    codigoBase: `def color(x, y, ancho, alto):
    # x: 0 … ancho-1 (izquierda → derecha) · y: 0 … alto-1 (arriba → abajo)
    if x < ancho // 3:
        return "morado"
    return "negro"
`,
    resultadoEsperado: 'Pintar la bandera exacta en los 6 lienzos (2 visibles y 4 ocultos de otros tamaños).',
    solucion: `def color(x, y, ancho, alto):
    radio = min(ancho, alto) // 4
    if (x + 0.5 - ancho / 2) ** 2 + (y + 0.5 - alto / 2) ** 2 <= radio ** 2:
        return "amarillo"
    if x * 3 // ancho == 1:
        return "naranja"
    return "morado"
`,
    config: {
      mision: 'nebulosa',
      formato: 'nebulosa',
      escenarios: [
        { nombre: 'Lienzo cuadrado (48×48)', semilla: 451, params: { variante: 'bandera', ancho: 48, alto: 48 } },
        { nombre: 'Lienzo apaisado (64×32)', semilla: 452, params: { variante: 'bandera', ancho: 64, alto: 32 } },
        { semilla: 9451, params: { variante: 'bandera', ancho: 25, alto: 60 }, oculto: true },
        { semilla: 9452, params: { variante: 'bandera', ancho: 80, alto: 40 }, oculto: true },
        { semilla: 9453, params: { variante: 'bandera', ancho: 61, alto: 1 }, oculto: true },
        { semilla: 9454, params: { variante: 'bandera', ancho: 37, alto: 37 }, oculto: true },
      ],
    },
  },
  {
    titulo: '🎨 Los anillos de Saturno',
    categoria: 'Operadores',
    nivel: 'Intermedio',
    puntos: 200,
    descripcion: `Ahora toca un planeta con anillos… y una luna.
${LIENZO}

Llama u = max(1, min(ancho, alto) // 8) a la unidad de medida. De arriba abajo en prioridad:
1. La luna (amarilla): círculo de radio u con centro en (ancho * 0.75, alto * 0.25), arriba a la derecha.
2. El planeta (naranja): círculo de radio 2 * u en el centro del lienzo (ancho / 2, alto / 2).
3. Los anillos: con dx y dy, la distancia del píxel al centro del lienzo, calcula d = raíz(dx² + (2·dy)²) (así los anillos salen el doble de anchos que de altos) y k = d // u. Si k está entre 3 y 6, el píxel es cian cuando k es impar y azul cuando es par.
4. Todo lo demás, negro.

Basta con que coincida el 97 % de los píxeles; ⭐⭐⭐ con el 100 %. Pista: el operador % te dice si k es par o impar.`,
    codigoBase: `import math


def color(x, y, ancho, alto):
    u = max(1, min(ancho, alto) // 8)
    dx = x + 0.5 - ancho / 2
    dy = y + 0.5 - alto / 2

    # Tu código aquí

    return "negro"
`,
    resultadoEsperado: 'Pintar el planeta, sus anillos y la luna en los 6 lienzos con al menos un 97 % de coincidencia.',
    solucion: `import math


def color(x, y, ancho, alto):
    u = max(1, min(ancho, alto) // 8)
    px, py = x + 0.5, y + 0.5
    if (px - ancho * 0.75) ** 2 + (py - alto * 0.25) ** 2 <= u ** 2:
        return "amarillo"
    dx, dy = px - ancho / 2, py - alto / 2
    if dx * dx + dy * dy <= (2 * u) ** 2:
        return "naranja"
    k = int(math.sqrt(dx * dx + (2 * dy) ** 2) // u)
    if 3 <= k <= 6:
        return "cian" if k % 2 else "azul"
    return "negro"
`,
    config: {
      mision: 'nebulosa',
      formato: 'nebulosa',
      escenarios: [
        { nombre: 'Lienzo cuadrado (48×48)', semilla: 461, params: { variante: 'anillos', ancho: 48, alto: 48 } },
        { nombre: 'Lienzo apaisado (64×32)', semilla: 462, params: { variante: 'anillos', ancho: 64, alto: 32 } },
        { semilla: 9461, params: { variante: 'anillos', ancho: 25, alto: 60 }, oculto: true },
        { semilla: 9462, params: { variante: 'anillos', ancho: 80, alto: 40 }, oculto: true },
        { semilla: 9463, params: { variante: 'anillos', ancho: 100, alto: 64 }, oculto: true },
        { semilla: 9464, params: { variante: 'anillos', ancho: 61, alto: 1 }, oculto: true },
      ],
    },
  },
];

// ---------------- 🎵 Radio (fase 5.6) ----------------

const ESCALA_PY = `ESCALA = ["do", "re", "mi", "fa", "sol", "la", "si", "do2", "re2", "mi2", "fa2", "sol2", "la2", "si2"]`;
const MORSE_PY = `MORSE = {
    "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.",
    "G": "--.", "H": "....", "I": "..", "J": ".---", "K": "-.-", "L": ".-..",
    "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.",
    "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
    "Y": "-.--", "Z": "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
    "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
}`;

const TRANSMISOR_PY = `${ESCALA_PY}
${MORSE_PY}


def transmitir(senal):
    palabras = []
    for palabra in senal["mensaje"].upper().split():
        limpia = [c for c in palabra if c in MORSE]
        if limpia:
            palabras.append(limpia)
    inicio = ESCALA.index(senal["nota"])
    salida = []
    for i, palabra in enumerate(palabras):
        nota = ESCALA[(inicio + i) % len(ESCALA)]
        if i > 0:
            salida.append(("silencio", 7))
        for j, letra in enumerate(palabra):
            if j > 0:
                salida.append(("silencio", 3))
            for k, simbolo in enumerate(MORSE[letra]):
                if k > 0:
                    salida.append(("silencio", 1))
                salida.append((nota, 1 if simbolo == "." else 3))
    return salida
`;

export const retosRadio: RetoSemilla[] = [
  {
    titulo: '🎵 SOS',
    categoria: 'Bucles',
    nivel: 'Fácil',
    puntos: 150,
    descripcion: `Tu nave necesita ayuda y la baliza está muda. Prográmala: tu código no dibuja, SUENA.
Escribe transmitir(senal). senal es un diccionario como {"nota": "la", "repeticiones": 3}. Devuelve una lista de parejas (nota, pulsos): cada pareja es un sonido (o un silencio) y cuánto dura.

El SOS en morse es S O S = ... --- ... :
- S = 3 pitidos de 1 pulso; O = 3 pitidos de 3 pulsos.
- Entre dos pitidos seguidos, ("silencio", 1).
- Al final de cada SOS, ("silencio", 4).
- Todos los pitidos suenan en senal["nota"], y el SOS completo se repite senal["repeticiones"] veces.

Ejemplo del principio con la nota "la": [("la", 1), ("silencio", 1), ("la", 1), ("silencio", 1), ("la", 1), ("silencio", 1), ("la", 3), …]
Con el botón 🔊 puedes escuchar tu señal y la señal objetivo.`,
    codigoBase: `def transmitir(senal):
    # senal = {"nota": "la", "repeticiones": 3}
    nota = senal["nota"]
    salida = [(nota, 1), ("silencio", 1)]

    # Tu código aquí

    return salida
`,
    resultadoEsperado: 'Transmitir la baliza exacta en los 6 escenarios (2 visibles y 4 ocultos con otras notas y repeticiones).',
    solucion: `def transmitir(senal):
    salida = []
    for _ in range(senal["repeticiones"]):
        for i, pulsos in enumerate([1, 1, 1, 3, 3, 3, 1, 1, 1]):
            if i > 0:
                salida.append(("silencio", 1))
            salida.append((senal["nota"], pulsos))
        salida.append(("silencio", 4))
    return salida
`,
    config: {
      mision: 'radio',
      formato: 'radio',
      escenarios: [
        { nombre: 'Baliza en la (×3)', semilla: 471, params: { variante: 'sos', nota: 'la', repeticiones: 3 } },
        { nombre: 'Baliza aguda (do2 ×2)', semilla: 472, params: { variante: 'sos', nota: 'do2', repeticiones: 2 } },
        { semilla: 9471, params: { variante: 'sos', nota: 'sol', repeticiones: 1 }, oculto: true },
        { semilla: 9472, params: { variante: 'sos', nota: 'si2', repeticiones: 4 }, oculto: true },
        { semilla: 9473, params: { variante: 'sos', nota: 'do', repeticiones: 5 }, oculto: true },
        { semilla: 9474, params: { variante: 'sos', nota: 'mi', repeticiones: 2 }, oculto: true },
      ],
    },
  },
  {
    titulo: '🎵 El transmisor morse',
    categoria: 'Estructuras de Datos',
    nivel: 'Intermedio',
    puntos: 200,
    descripcion: `Ahora la radio tiene que poder enviar CUALQUIER mensaje.
Escribe transmitir(senal), con senal = {"mensaje": "hola  tierra", "nota": "si2"}, y devuelve la lista de parejas (nota, pulsos). El código base trae el diccionario MORSE y la ESCALA de notas. Cuatro reglas a la vez:
1. Tiempos del morse: punto = 1 pulso, raya = 3. Silencios: 1 entre los símbolos de una letra, 3 entre letras, 7 entre palabras y NADA al final.
2. Cada palabra suena en la SIGUIENTE nota de la ESCALA, empezando por senal["nota"]. Tras la última nota (si2) se vuelve al principio (do). Pista: el operador %.
3. El mensaje puede venir en minúsculas y con varios espacios seguidos, que cuentan como una sola separación.
4. Los caracteres que no están en MORSE (¿, !, comas…) se ignoran; si una palabra se queda vacía, no cuenta.

Ejemplo resuelto: {"mensaje": "et a", "nota": "si2"} →
[("si2", 1), ("silencio", 3), ("si2", 3), ("silencio", 7), ("do", 1), ("silencio", 1), ("do", 3)]
(E = . y T = -, separadas por 3; luego 7 de separación entre palabras, y la segunda palabra suena en do porque después de si2 se vuelve al principio).`,
    codigoBase: `${ESCALA_PY}
${MORSE_PY}


def transmitir(senal):
    # senal = {"mensaje": "hola  tierra", "nota": "si2"}
    salida = []

    # Tu código aquí

    return salida
`,
    resultadoEsperado: 'Transmitir los 7 mensajes exactos (2 visibles y 5 ocultos: una letra sola, espacios dobles, signos y más palabras que notas).',
    solucion: TRANSMISOR_PY,
    config: {
      mision: 'radio',
      formato: 'radio',
      escenarios: [
        { nombre: '«SOS» en la', semilla: 481, params: { variante: 'morse', mensaje: 'SOS', nota: 'la' } },
        { nombre: '«hola  tierra» en si2', semilla: 482, params: { variante: 'morse', mensaje: 'hola  tierra', nota: 'si2' } },
        { semilla: 9481, params: { variante: 'morse', mensaje: 'e', nota: 'do' }, oculto: true },
        { semilla: 9482, params: { variante: 'morse', mensaje: 'buenos  dias   tripulacion', nota: 'mi' }, oculto: true },
        { semilla: 9483, params: { variante: 'morse', mensaje: '¿hola, mundo! ¡¡ !!', nota: 'sol' }, oculto: true },
        { semilla: 9484, params: { variante: 'morse', mensaje: 'a b c d e f g h i j k l m n o p', nota: 're' }, oculto: true },
        { semilla: 9485, params: { variante: 'morse', mensaje: 'mision 42 completada', nota: 'fa2' }, oculto: true },
      ],
    },
  },
  {
    titulo: '🎵 La señal con ruido',
    categoria: 'Algoritmos Avanzados',
    nivel: 'Difícil',
    puntos: 300,
    descripcion: `Llega una transmisión de la Tierra… pero DAÑADA. Ahora haces el camino inverso: de sonidos a texto.
Escribe recibir(senal) y devuelve el mensaje en MAYÚSCULAS, con un espacio entre palabras. senal es una lista de parejas como las del transmisor, pero estropeada:
- Las duraciones no son exactas. Pitidos de 1–2 pulsos = punto; de 3–5 = raya. Silencios de 1–2 = dentro de la letra; de 3–5 = entre letras; de 6 o más = entre palabras.
- Hay estática: parejas ("estatica", n) que hay que quitar. Si al quitarla quedan dos silencios juntos, SE SUMAN.
- Puede empezar o acabar con silencio o con estática.
- La nota de los pitidos no importa (cada palabra puede venir en una nota distinta).

Ejemplo resuelto: [("la", 2), ("silencio", 2), ("estatica", 1), ("silencio", 2), ("la", 4)]
Quitada la estática, los dos silencios suman 4 (separación entre letras); se leen . y - → "ET".
Pista: un diccionario invertido {código: letra} te traduce cada letra de golpe.`,
    codigoBase: `${MORSE_PY}


def recibir(senal):
    # senal = [("la", 2), ("silencio", 2), ("estatica", 1), ...]
    texto = ""
    for tipo, pulsos in senal:

        # Tu código aquí

        pass
    return texto
`,
    resultadoEsperado: 'Descifrar las 8 transmisiones (2 visibles y 6 ocultas: estática en los bordes y duraciones en los límites de cada umbral).',
    solucion: `${MORSE_PY}

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
`,
    config: {
      mision: 'radio',
      formato: 'radio',
      escenarios: [
        { nombre: 'Socorro con interferencias', semilla: 491, params: { variante: 'descifrar', mensaje: 'SOS', estatica: 1 } },
        { nombre: 'Saludo desde la Tierra', semilla: 492, params: { variante: 'descifrar', mensaje: 'HOLA TIERRA' } },
        { semilla: 9491, params: { variante: 'descifrar' }, oculto: true },
        { semilla: 9492, params: { variante: 'descifrar', bordes: true }, oculto: true },
        { semilla: 9493, params: { variante: 'descifrar', extremos: true }, oculto: true },
        { semilla: 9494, params: { variante: 'descifrar', extremos: true, bordes: true }, oculto: true },
        { semilla: 9495, params: { variante: 'descifrar', estatica: 8 }, oculto: true },
        { semilla: 9496, params: { variante: 'descifrar', mensaje: 'E T 5 0', extremos: true }, oculto: true },
      ],
    },
  },
];

// ---------------- 🧬 Colonia (fase 5.7) ----------------

export const retosColonia: RetoSemilla[] = [
  {
    titulo: '🧬 Terraformación',
    categoria: 'Funciones',
    nivel: 'Intermedio',
    puntos: 200,
    descripcion: `No controlas la colonia alienígena: escribes su LEY DE LA VIDA y la ves evolucionar sola.
Escribe regla(viva, vecinas) y devuelve True o False:
- viva: True si la celda está viva ahora.
- vecinas: cuántas de sus 8 celdas de alrededor están vivas (de 0 a 8).
- Devuelves si esa celda estará viva en la siguiente generación.

El mapa es de 24×24. Las rocas están siempre muertas. Cada generación se calcula a la vez para todas las celdas con tu regla, y hay 40 generaciones.
Objetivo: que la colonia cubra ENTERA la zona verde (todas sus celdas vivas a la vez) sin tocar NUNCA la base humana (ninguna celda de la base viva en ninguna generación).

Fíjate en el mapa (pestaña 🗺️ Mapas):
- A la zona verde se llega por una PUERTA de 2 celdas en el muro.
- La base está tras un muro con una GRIETA de 1 sola celda.
Piensa: una celda muerta justo al otro lado de la puerta, ¿cuántas vecinas vivas puede tener? ¿Y una al otro lado de la grieta?

Tu regla tiene que ser pura: con la misma entrada, siempre la misma salida. El motor la llama con las 18 combinaciones posibles y enseña la tabla que sale.
⭐⭐⭐ si cubres la zona en 25 generaciones o menos en todos los mapas, ⭐⭐ en 32 y ⭐ en 40.`,
    codigoBase: `def regla(viva, vecinas):
    # viva: True/False · vecinas: cuántas de las 8 de alrededor están vivas (0-8)
    # Devuelve si la celda estará viva en la siguiente generación
    return viva and vecinas >= 2
`,
    resultadoEsperado: 'Cubrir la zona verde en los 6 mapas (2 visibles y 4 ocultos) sin que la colonia llegue nunca a la base.',
    solucion: `def regla(viva, vecinas):
    # Lo que está vivo sigue vivo. Una celda nace si tiene 2 o más vecinas:
    # con 2 se cruza la puerta, y nunca con 0 o 1, que es lo único que se ve tras la grieta
    return viva or vecinas >= 2
`,
    config: {
      mision: 'colonia',
      formato: 'colonia',
      escenarios: [
        { nombre: 'Valle de Hiperión', semilla: 501 },
        { nombre: 'Cráter del norte', semilla: 502 },
        { semilla: 9501, oculto: true },
        { semilla: 9502, oculto: true },
        { semilla: 9503, oculto: true },
        { semilla: 9504, oculto: true },
      ],
    },
  },
];
