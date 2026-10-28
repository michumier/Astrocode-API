# -*- coding: utf-8 -*-
"""Reto 👽 La lengua alienígena (fase 5.2). Diseño: docs/diseno/fase-5-retos.md §4.2

El alumno escribe transformar(rejilla): recibe una lista de filas con colores del 0 al 9 y
devuelve la rejilla transformada según una regla que NO se le dice: la descubre con los ejemplos
(los escenarios visibles, que se enseñan con su resultado) y se comprueba con rejillas ocultas.

  variante "espejo"   (L1) → cada fila se invierte
  variante "gravedad" (L2) → las celdas de color caen al fondo de su columna, sin cambiar su orden
  variante "lagos"    (L3) → los huecos negros encerrados por paredes grises se llenan de azul

Paleta común (también la usará la nebulosa): 0 negro (vacío) · 1 azul · 2 rojo · 3 verde
4 amarillo · 5 gris · 6 morado · 7 naranja · 8 cian · 9 granate
"""

from .base import Mision, AccionInvalida

VACIO, AZUL, PARED = 0, 1, 5
COLORES_LIBRES = (1, 2, 3, 4, 6, 7, 8, 9)
VARIANTES = ('espejo', 'gravedad', 'lagos')
MAX_INTENTOS_GENERADOR = 5_000


# ---------------- Reglas de referencia ----------------

def espejo(rejilla):
    return [list(reversed(fila)) for fila in rejilla]


def gravedad(rejilla):
    filas, cols = len(rejilla), len(rejilla[0])
    salida = [[VACIO] * cols for _ in range(filas)]
    for c in range(cols):
        colores = [rejilla[f][c] for f in range(filas) if rejilla[f][c] != VACIO]
        for i, color in enumerate(colores):
            salida[filas - len(colores) + i][c] = color
    return salida


def _mojadas(rejilla, vecinos):
    """Celdas vacías a las que llega el agua desde el borde."""
    filas, cols = len(rejilla), len(rejilla[0])
    pendientes = [(f, c) for f in range(filas) for c in range(cols)
                  if (f in (0, filas - 1) or c in (0, cols - 1)) and rejilla[f][c] == VACIO]
    mojadas = set()
    while pendientes:
        f, c = pendientes.pop()
        if (f, c) in mojadas:
            continue
        mojadas.add((f, c))
        for df, dc in vecinos:
            nf, nc = f + df, c + dc
            if 0 <= nf < filas and 0 <= nc < cols and rejilla[nf][nc] == VACIO:
                pendientes.append((nf, nc))
    return mojadas


CUATRO = ((1, 0), (-1, 0), (0, 1), (0, -1))
OCHO = CUATRO + ((1, 1), (1, -1), (-1, 1), (-1, -1))


def lagos(rejilla, vecinos=CUATRO):
    mojadas = _mojadas(rejilla, vecinos)
    return [[AZUL if v == VACIO and (f, c) not in mojadas else v for c, v in enumerate(fila)]
            for f, fila in enumerate(rejilla)]


REGLAS = {'espejo': espejo, 'gravedad': gravedad, 'lagos': lagos}


# ---------------- Generadores ----------------

def _tamano(rng, params, minimo=3, maximo=8):
    filas = int(params.get('filas') or rng.randint(minimo, maximo))
    cols = int(params.get('columnas') or rng.randint(minimo, maximo))
    return max(1, min(filas, 12)), max(1, min(cols, 12))


def _aleatoria(rng, filas, cols, densidad):
    return [[rng.choice(COLORES_LIBRES) if rng.random() < densidad else VACIO for _ in range(cols)]
            for _ in range(filas)]


def generar_espejo(rng, params):
    filas, cols = _tamano(rng, params)
    for _ in range(MAX_INTENTOS_GENERADOR):
        rejilla = _aleatoria(rng, filas, cols, 0.45)
        # Que el ejemplo enseñe algo: que no sea simétrico ni esté vacío
        if cols == 1 or rejilla != espejo(rejilla):
            return rejilla
    return rejilla


def generar_gravedad(rng, params):
    filas, cols = _tamano(rng, params)
    for _ in range(MAX_INTENTOS_GENERADOR):
        rejilla = _aleatoria(rng, filas, cols, 0.35)
        # Con una sola fila no hay nada que caiga: es un caso límite válido (la respuesta es la misma)
        if filas > 1 and rejilla == gravedad(rejilla):
            continue
        if params.get('trampa'):
            # Una columna con huecos entre colores que, ordenada, quedaría distinta:
            # así «ordenar la columna» no explica el ejemplo
            columnas = [[rejilla[f][c] for f in range(filas) if rejilla[f][c]] for c in range(cols)]
            if not any(len(col) >= 2 and col != sorted(col) for col in columnas):
                continue
        return rejilla
    raise ValueError('No se pudo generar una rejilla de gravedad con esas condiciones')


def _rectangulo(rejilla, f0, c0, alto, ancho):
    for c in range(c0, c0 + ancho):
        rejilla[f0][c] = rejilla[f0 + alto - 1][c] = PARED
    for f in range(f0, f0 + alto):
        rejilla[f][c0] = rejilla[f][c0 + ancho - 1] = PARED


def generar_lagos(rng, params):
    """Recintos de pared: cerrados (lagos), con un hueco (el agua entra) y, si se pide, con una
    esquina abierta (hueco solo en diagonal: el agua NO entra al interior)."""
    filas, cols = _tamano(rng, params, 6, 12)
    for _ in range(MAX_INTENTOS_GENERADOR):
        rejilla = [[VACIO] * cols for _ in range(filas)]
        recintos = rng.randint(2, 3)
        colocados = []
        for _ in range(recintos):
            alto, ancho = rng.randint(3, min(6, filas)), rng.randint(3, min(6, cols))
            f0, c0 = rng.randint(0, filas - alto), rng.randint(0, cols - ancho)
            _rectangulo(rejilla, f0, c0, alto, ancho)
            colocados.append((f0, c0, alto, ancho))
        # Abrir un hueco en un lado de algún recinto
        if params.get('hueco', True) and colocados:
            f0, c0, alto, ancho = rng.choice(colocados)
            if ancho > 2:
                rejilla[f0][rng.randint(c0 + 1, c0 + ancho - 2)] = VACIO
        if params.get('diagonal'):
            f0, c0, alto, ancho = colocados[0]
            rejilla[f0][c0] = VACIO
        # Algo de ruido de color fuera de las paredes (no cambia: solo se rellenan huecos vacíos)
        for _ in range(rng.randint(0, 3)):
            f, c = rng.randrange(filas), rng.randrange(cols)
            if rejilla[f][c] == VACIO:
                rejilla[f][c] = rng.choice((2, 3, 4, 7))
        salida = lagos(rejilla)
        if salida == rejilla:
            continue  # sin ningún lago no enseña nada
        if params.get('diagonal') and salida == lagos(rejilla, OCHO):
            continue  # la esquina abierta debe marcar la diferencia
        return rejilla
    raise ValueError('No se pudo generar una rejilla de lagos con esas condiciones')


GENERADORES = {'espejo': generar_espejo, 'gravedad': generar_gravedad, 'lagos': generar_lagos}


# ---------------- Validación ----------------

def validar_rejilla(valor):
    if not isinstance(valor, (list, tuple)) or not valor:
        raise AccionInvalida(f'Devuelve una lista de filas (lista de listas), no {valor!r}'[:200])
    ancho = None
    for i, fila in enumerate(valor):
        if not isinstance(fila, (list, tuple)):
            raise AccionInvalida(f'La fila {i} no es una lista: {fila!r}'[:200])
        if ancho is None:
            ancho = len(fila)
        elif len(fila) != ancho:
            raise AccionInvalida(f'Las filas deben medir lo mismo: la fila 0 tiene {ancho} celdas y la {i}, {len(fila)}')
        for j, v in enumerate(fila):
            if isinstance(v, bool) or not isinstance(v, int) or not 0 <= v <= 9:
                raise AccionInvalida(f'La celda ({i}, {j}) vale {v!r}: los colores son números del 0 al 9')
    return [list(f) for f in valor]


class Lengua(Mision):
    id = 'lengua'
    funcion = 'transformar'
    max_ticks = 1

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        self.variante = self.params.get('variante', 'espejo')
        if self.variante not in VARIANTES:
            raise ValueError(f'Variante de lengua desconocida: {self.variante}')
        self.entrada = GENERADORES[self.variante](self.rng, self.params)
        self.esperado = REGLAS[self.variante](self.entrada)
        self.respuesta = None
        self.diferencias = []

    def sensores(self):
        # Copia: si el alumno modifica la rejilla, no toca la del motor (viaja por JSON igualmente)
        return [list(f) for f in self.entrada]

    def aplicar(self, accion):
        respuesta = validar_rejilla(accion)
        self.respuesta = respuesta
        filas, cols = len(self.esperado), len(self.esperado[0])
        if len(respuesta) != filas or len(respuesta[0]) != cols:
            self.terminar(False, f'Tu rejilla mide {len(respuesta)}×{len(respuesta[0])} y la esperada '
                                 f'{filas}×{cols} (filas × columnas)')
            return
        self.diferencias = [[f, c] for f in range(filas) for c in range(cols) if respuesta[f][c] != self.esperado[f][c]]
        if self.diferencias:
            n = len(self.diferencias)
            self.terminar(False, f'{n} celda{"s" if n != 1 else ""} distinta{"s" if n != 1 else ""} de {filas * cols}')
        else:
            self.terminar(True, '🛸 Los alienígenas te entienden')

    def fotograma(self):
        if self.respuesta is None:
            return {'fase': 'inicio'}
        return {'fase': 'fin', 'salida': self.respuesta, 'diferencias': self.diferencias}

    def escena(self):
        # Solo viaja en escenarios visibles: ahí el resultado esperado es un ejemplo más
        return {'variante': self.variante, 'entrada': self.entrada, 'esperado': self.esperado}

    def material(self):
        return {'variante': self.variante, 'entrada': self.entrada, 'salida': self.esperado}

    def metricas(self):
        if self.respuesta is None:
            return {}
        total = len(self.esperado) * len(self.esperado[0])
        return {'celdas_bien': total - len(self.diferencias), 'celdas': total}

    def estrellas(self):
        return 3
