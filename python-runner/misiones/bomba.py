# -*- coding: utf-8 -*-
"""Reto 💣 Desactiva la bomba (fase 5.1). Diseño: docs/diseno/fase-5-retos.md §4.1

El alumno escribe desactivar(bomba) y aplica el manual:
  variante "cables"  (B1) → lista de posiciones que corta, en orden
  variante "modulos" (B2) → {"cables": [...], "boton": "pulsar"|"mantener", "teclado": [símbolos en orden]}

Cada escenario puede pedir qué reglas deben darse (params.objetivo = [regla, rama] y, en B2,
params.boton = 1..4). El generador crea bombas al azar con la semilla hasta encontrar una que
cumpla el objetivo, así todas las reglas salen en los escenarios.
"""

from .base import Mision, AccionInvalida

COLORES = ('rojo', 'azul', 'blanco', 'amarillo', 'negro')
VOCALES = 'AEIOU'
CONSONANTES = 'BCDFGHJKLMNPQRSTVWXYZ'

# Ramas del paso 2 (qué pasa tras el primer corte)
RAMAS = ('azul', 'azul_final', 'rojo', 'vocal', 'sin_vocal')

# Teclado (B2): cuatro columnas; en cada bomba, solo una contiene sus cuatro símbolos
COLUMNAS = [
    ['🪐', '🌍', '🛸', '🌙', '⭐', '🌀', '👾'],
    ['🔭', '🌙', '💎', '🪐', '💫', '🌍', '🌑'],
    ['🌀', '🚀', '👽', '🔭', '⭐', '🌑', '🌠'],
    ['👾', '🌠', '💫', '🛸', '🚀', '💎', '👽'],
]

BOTON_COLORES = ('azul', 'rojo', 'blanco', 'amarillo')
BOTON_TEXTOS = ('ABORTAR', 'DETONAR', 'MANTENER', 'PULSAR')

MAX_INTENTOS_GENERADOR = 50_000


# ---------------- Manual (solución de referencia) ----------------

def primer_corte(cables, serie):
    """Paso 1: (regla que se aplica, posición del primer corte)."""
    if 'rojo' not in cables:
        return 1, 1
    if cables[-1] == 'blanco':
        return 2, len(cables) - 1
    if cables.count('azul') > 1:
        return 3, len(cables) - 1 - cables[::-1].index('azul')
    if int(serie[-1]) % 2 == 1:
        return 4, len(cables) - 1
    return 5, 0


def cortes_cables(cables, serie):
    """Manual B1 completo: (lista de cortes, regla del paso 1, rama del paso 2)."""
    regla, primero = primer_corte(cables, serie)
    cortes = [primero]
    color = cables[primero]
    if color == 'azul':
        if primero + 1 < len(cables):
            cortes.append(primero + 1)
            rama = 'azul'
        else:
            rama = 'azul_final'
    elif color == 'rojo':
        rama = 'rojo'
    elif any(v in serie for v in VOCALES):
        cortes.append([i for i in range(len(cables)) if i != primero][-1])
        rama = 'vocal'
    else:
        rama = 'sin_vocal'
    return cortes, regla, rama


def regla_boton(boton, baterias):
    """Manual del botón: (regla, acción)."""
    if boton['color'] == 'azul' and boton['texto'] == 'ABORTAR':
        return 1, 'mantener'
    if baterias > 1 and boton['texto'] == 'DETONAR':
        return 2, 'pulsar'
    if boton['color'] == 'blanco':
        return 3, 'mantener'
    return 4, 'pulsar'


def orden_teclado(simbolos):
    """Manual del teclado: (columna 0-3, símbolos en el orden de esa columna)."""
    for i, columna in enumerate(COLUMNAS):
        if all(s in columna for s in simbolos):
            return i, sorted(simbolos, key=columna.index)
    raise ValueError('Ninguna columna contiene los cuatro símbolos')


def solucion(bomba, variante):
    cortes, _, _ = cortes_cables(bomba['cables'], bomba['serie'])
    if variante == 'cables':
        return cortes
    _, accion = regla_boton(bomba['boton'], bomba['baterias'])
    _, orden = orden_teclado(bomba['teclado'])
    return {'cables': cortes, 'boton': accion, 'teclado': orden}


NOMBRES_RAMA = {
    'azul': 'era azul → también el de su derecha',
    'azul_final': 'era azul pero era el último → nada más',
    'rojo': 'era rojo → nada más',
    'vocal': 'la serie tiene vocal → también el último sin cortar',
    'sin_vocal': 'la serie no tiene vocal → nada más',
}


def explicacion(bomba, variante):
    """Por qué la respuesta correcta es esa (solo se enseña en escenarios visibles)."""
    cortes, regla, rama = cortes_cables(bomba['cables'], bomba['serie'])
    partes = [f'Cables: paso 1 → regla {regla} → cable {cortes[0]}. Paso 2 → {NOMBRES_RAMA[rama]}. '
              f'Respuesta: {cortes}']
    if variante == 'modulos':
        n, accion = regla_boton(bomba['boton'], bomba['baterias'])
        col, orden = orden_teclado(bomba['teclado'])
        partes.append(f'Botón: regla {n} → «{accion}»')
        partes.append(f'Teclado: columna {"ABCD"[col]} → {" ".join(orden)}')
    return '\n'.join(partes)


# ---------------- Generador ----------------

def _serie(rng):
    letras = VOCALES + CONSONANTES + '0123456789'
    return ''.join(rng.choice(letras) for _ in range(5)) + rng.choice('0123456789')


def _cables(rng):
    return [rng.choice(COLORES) for _ in range(rng.randint(3, 6))]


def _teclado(rng):
    while True:
        columna = rng.choice(COLUMNAS)
        simbolos = rng.sample(columna, 4)
        if sum(all(s in c for s in simbolos) for c in COLUMNAS) == 1:
            rng.shuffle(simbolos)
            return simbolos


def generar(rng, variante, objetivo=None, boton=None):
    """Bomba al azar que cumple el objetivo ([regla, rama] y regla del botón), si se pide."""
    for _ in range(MAX_INTENTOS_GENERADOR):
        bomba = {'cables': _cables(rng), 'serie': _serie(rng)}
        if objetivo:
            _, regla, rama = cortes_cables(bomba['cables'], bomba['serie'])
            if [regla, rama] != list(objetivo):
                continue
        if variante == 'modulos':
            bomba['baterias'] = rng.randint(0, 4)
            bomba['boton'] = {'color': rng.choice(BOTON_COLORES), 'texto': rng.choice(BOTON_TEXTOS)}
            if boton and regla_boton(bomba['boton'], bomba['baterias'])[0] != boton:
                continue
            bomba['teclado'] = _teclado(rng)
        return bomba
    raise ValueError(f'No se encontró ninguna bomba con el objetivo {objetivo} / botón {boton}')


# ---------------- Validación de la respuesta ----------------

def _validar_cortes(valor, cables, donde='la respuesta'):
    if isinstance(valor, bool) or isinstance(valor, int):
        raise AccionInvalida(f'{donde} debe ser una LISTA de posiciones: [{valor}] en lugar de {valor}')
    if not isinstance(valor, (list, tuple)):
        raise AccionInvalida(f'{donde} debe ser una lista de posiciones, pero devolviste {valor!r}')
    for p in valor:
        if isinstance(p, bool) or not isinstance(p, int):
            raise AccionInvalida(f'Las posiciones deben ser números enteros, pero hay {p!r}')
        if not 0 <= p < len(cables):
            raise AccionInvalida(f'Cortaste el cable {p}, pero la bomba solo tiene {len(cables)} cables '
                                 f'(posiciones 0 a {len(cables) - 1})')
    return list(valor)


class Bomba(Mision):
    id = 'bomba'
    funcion = 'desactivar'
    max_ticks = 1

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        self.variante = self.params.get('variante', 'cables')
        if self.variante not in ('cables', 'modulos'):
            raise ValueError(f'Variante de bomba desconocida: {self.variante}')
        self.bomba = generar(self.rng, self.variante, self.params.get('objetivo'), self.params.get('boton'))
        self.respuesta = None
        self.correcto = None

    def sensores(self):
        return self.bomba

    def aplicar(self, accion):
        if self.variante == 'cables':
            respuesta = _validar_cortes(accion, self.bomba['cables'])
        else:
            if not isinstance(accion, dict):
                raise AccionInvalida(f'Devuelve un diccionario con "cables", "boton" y "teclado", no {accion!r}')
            for clave in ('cables', 'boton', 'teclado'):
                if clave not in accion:
                    raise AccionInvalida(f'Falta la clave "{clave}" en el diccionario que devuelves')
            if accion['boton'] not in ('pulsar', 'mantener'):
                raise AccionInvalida(f'"boton" debe ser "pulsar" o "mantener", no {accion["boton"]!r}')
            if not isinstance(accion['teclado'], (list, tuple)) or len(accion['teclado']) != 4:
                raise AccionInvalida('"teclado" debe ser una lista con los 4 símbolos en orden')
            respuesta = {
                'cables': _validar_cortes(accion['cables'], self.bomba['cables'], '"cables"'),
                'boton': accion['boton'],
                'teclado': list(accion['teclado']),
            }
        self.respuesta = respuesta
        esperado = solucion(self.bomba, self.variante)
        self.correcto = respuesta == esperado
        if self.correcto:
            self.terminar(True, '💚 Bomba desactivada')
        else:
            self.terminar(False, f'💥 ¡BOOM! {self._que_fallo(respuesta, esperado)}\n{explicacion(self.bomba, self.variante)}')

    def _que_fallo(self, respuesta, esperado):
        if self.variante == 'cables':
            return f'Cortaste {respuesta}.'
        malos = [m for m in ('cables', 'boton', 'teclado') if respuesta[m] != esperado[m]]
        return f'Falló el módulo de {", ".join(malos)}.'

    def fotograma(self):
        if self.respuesta is None:
            return {'fase': 'inicio'}
        return {
            'fase': 'fin',
            'respuesta': self.respuesta,
            'correcto': self.correcto,
            # Los fotogramas solo viajan en escenarios visibles: ahí sí se enseña la solución
            'esperado': solucion(self.bomba, self.variante),
            'explicacion': explicacion(self.bomba, self.variante),
        }

    def escena(self):
        return {'variante': self.variante, 'bomba': self.bomba}

    def material(self):
        datos = {'variante': self.variante, 'bomba': self.bomba}
        if self.variante == 'modulos':
            datos['columnas'] = COLUMNAS
        return datos

    def estrellas(self):
        return 3
