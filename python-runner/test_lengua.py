# -*- coding: utf-8 -*-
"""
Pruebas del reto 👽 lengua alienígena (fase 5.2).
La lógica (reglas, generadores, ejemplos sin ambigüedad) se prueba en cualquier sistema;
la ejecución real del código del alumno necesita Linux (contenedor del runner):
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_lengua
"""

import sys
import unittest

from misiones.lengua import Lengua, OCHO, espejo, gravedad, lagos
from misiones.motor import ejecutar_escenario, material_reto

# Los escenarios VISIBLES de cada reto, tal como están en src/db/seeds/retos.ts
VISIBLES = {
    'espejo': [(301, {'filas': 3, 'columnas': 4}), (302, {'filas': 4, 'columnas': 5}), (303, {'filas': 5, 'columnas': 3})],
    'gravedad': [(311, {'filas': 4, 'columnas': 4, 'trampa': True}), (312, {'filas': 5, 'columnas': 6, 'trampa': True}),
                 (313, {'filas': 6, 'columnas': 3, 'trampa': True})],
    'lagos': [(321, {'filas': 7, 'columnas': 7, 'hueco': False}), (322, {'filas': 8, 'columnas': 9}),
              (323, {'filas': 8, 'columnas': 8, 'diagonal': True})],
}


# Reglas «trampa»: otras explicaciones razonables que los ejemplos visibles deben descartar
def voltear_vertical(r):
    return [list(f) for f in reversed(r)]


def girar_180(r):
    return [list(reversed(f)) for f in reversed(r)]


def ordenar_columnas(r):
    filas, cols = len(r), len(r[0])
    columnas = [sorted(r[f][c] for f in range(filas)) for c in range(cols)]
    return [[columnas[c][f] for c in range(cols)] for f in range(filas)]


def gravedad_hacia_arriba(r):
    return voltear_vertical(gravedad(voltear_vertical(r)))


def gravedad_por_filas(r):
    return [[0] * (len(f) - len([v for v in f if v])) + [v for v in f if v] for f in r]


def lagos_en_diagonal(r):
    return lagos(r, OCHO)


def rellenar_interior(r):
    """Pinta de azul todos los vacíos que no están en el borde (sin mirar si el agua entra)."""
    filas, cols = len(r), len(r[0])
    return [[1 if v == 0 and 0 < f < filas - 1 and 0 < c < cols - 1 else v for c, v in enumerate(fila)]
            for f, fila in enumerate(r)]


TRAMPAS = {
    'espejo': [voltear_vertical, girar_180, lambda r: [list(f) for f in r]],
    'gravedad': [ordenar_columnas, gravedad_hacia_arriba, gravedad_por_filas],
    'lagos': [lagos_en_diagonal, rellenar_interior],
}


def mision(variante, semilla, params):
    return Lengua(semilla, {'variante': variante, **params})


class PruebasReglas(unittest.TestCase):
    def test_espejo(self):
        self.assertEqual(espejo([[1, 0, 2], [0, 3, 0]]), [[2, 0, 1], [0, 3, 0]])

    def test_gravedad_conserva_el_orden(self):
        self.assertEqual(gravedad([[2, 0], [0, 4], [1, 0], [0, 0]]), [[0, 0], [0, 0], [2, 0], [1, 4]])

    def test_lagos_del_diseno(self):
        cerrado = [[5, 5, 5, 5, 0], [5, 0, 0, 5, 0], [5, 0, 0, 5, 0], [5, 5, 5, 5, 0], [0, 0, 0, 0, 0]]
        self.assertEqual(lagos(cerrado)[1], [5, 1, 1, 5, 0])
        abierto = [[5, 5, 5, 5, 0], [5, 0, 0, 0, 0], [5, 0, 0, 5, 0], [5, 5, 5, 5, 0], [0, 0, 0, 0, 0]]
        self.assertEqual(lagos(abierto), abierto)

    def test_en_diagonal_el_agua_no_pasa(self):
        esquina = [[0, 5, 5, 5], [5, 0, 0, 5], [5, 0, 0, 5], [5, 5, 5, 5]]
        self.assertEqual(lagos(esquina)[1], [5, 1, 1, 5])
        self.assertEqual(lagos(esquina, OCHO)[1], [5, 0, 0, 5])


class PruebasGeneradores(unittest.TestCase):
    def test_deterministas(self):
        for variante, visibles in VISIBLES.items():
            for semilla, params in visibles:
                self.assertEqual(mision(variante, semilla, params).entrada, mision(variante, semilla, params).entrada)

    def test_tamanos_y_colores(self):
        for variante in VISIBLES:
            for s in range(200):
                m = mision(variante, s, {'trampa': True} if variante == 'gravedad' else {})
                filas, cols = len(m.entrada), len(m.entrada[0])
                self.assertTrue(1 <= filas <= 12 and 1 <= cols <= 12)
                self.assertTrue(all(len(f) == cols and all(0 <= v <= 9 for v in f) for f in m.entrada))
                # Cada ejemplo enseña algo: la salida no es igual que la entrada
                if variante != 'espejo' or cols > 1:
                    self.assertNotEqual(m.entrada, m.esperado, (variante, s))

    def test_todos_los_escenarios_sembrados_se_generan(self):
        # Parámetros de los 27 escenarios de src/db/seeds/retos.ts (visibles y ocultos)
        ocultos = {
            'espejo': [(9301, {'filas': 1, 'columnas': 7}), (9302, {'filas': 6, 'columnas': 1}), (9303, {'filas': 8, 'columnas': 8}),
                       (9304, {'filas': 2, 'columnas': 10}), (9305, {'filas': 10, 'columnas': 3}), (9306, {})],
            'gravedad': [(9311, {'filas': 1, 'columnas': 6}), (9312, {'filas': 8, 'columnas': 1, 'trampa': True}),
                         (9313, {'filas': 10, 'columnas': 10, 'trampa': True}), (9314, {'filas': 3, 'columnas': 9}),
                         (9315, {'filas': 7, 'columnas': 5, 'trampa': True}), (9316, {'trampa': True})],
            'lagos': [(9321, {'filas': 6, 'columnas': 12}), (9322, {'filas': 12, 'columnas': 12, 'diagonal': True}),
                      (9323, {'filas': 10, 'columnas': 7, 'hueco': False}), (9324, {'filas': 9, 'columnas': 11}),
                      (9325, {'filas': 12, 'columnas': 8, 'diagonal': True}), (9326, {})],
        }
        for variante in VISIBLES:
            for semilla, params in VISIBLES[variante] + ocultos[variante]:
                mision(variante, semilla, params)

    def test_rejillas_extremas(self):
        self.assertEqual(len(mision('espejo', 1, {'filas': 1, 'columnas': 7}).entrada), 1)
        self.assertEqual(len(mision('gravedad', 1, {'filas': 8, 'columnas': 1, 'trampa': True}).entrada[0]), 1)
        self.assertEqual(len(mision('lagos', 1, {'filas': 12, 'columnas': 12, 'diagonal': True}).entrada), 12)

    def test_los_ejemplos_visibles_descartan_las_reglas_trampa(self):
        for variante, trampas in TRAMPAS.items():
            ejemplos = [mision(variante, s, p) for s, p in VISIBLES[variante]]
            for trampa in trampas:
                self.assertTrue(any(trampa(m.entrada) != m.esperado for m in ejemplos),
                                f'{variante}: los ejemplos no descartan {trampa.__name__}')

    def test_material_trae_los_ejemplos(self):
        material = material_reto('lengua', [{'semilla': 323, 'params': {'variante': 'lagos', 'diagonal': True}}])
        m = material[0]['material']
        self.assertEqual(set(m), {'variante', 'entrada', 'salida'})
        self.assertEqual(m['salida'], lagos(m['entrada']))


SOLUCIONES = {
    'espejo': 'def transformar(rejilla):\n    return [fila[::-1] for fila in rejilla]\n',
    'gravedad': '''
def transformar(rejilla):
    filas, columnas = len(rejilla), len(rejilla[0])
    salida = [[0] * columnas for _ in range(filas)]
    for c in range(columnas):
        colores = [rejilla[f][c] for f in range(filas) if rejilla[f][c] != 0]
        for i, color in enumerate(colores):
            salida[filas - len(colores) + i][c] = color
    return salida
''',
    'lagos': '''
def transformar(rejilla):
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
''',
}


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasEjecucion(unittest.TestCase):

    def ejecutar(self, codigo, variante, semilla, params=None):
        esc = {'semilla': semilla, 'params': {'variante': variante, **(params or {})}}
        return ejecutar_escenario(codigo, 'lengua', esc, con_detalle=True)

    def test_soluciones_aprueban_muchas_rejillas(self):
        for variante, codigo in SOLUCIONES.items():
            for s in range(40):
                params = {'diagonal': s % 2 == 0} if variante == 'lagos' else {'trampa': True} if variante == 'gravedad' else {}
                r = self.ejecutar(codigo, variante, s, params)
                self.assertTrue(r['exito'], (variante, s, r['motivo']))

    def test_lagos_con_ocho_vecinos_falla_en_la_diagonal(self):
        codigo = SOLUCIONES['lagos'].replace('for df, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):',
                                             'for df, dc in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):')
        r = self.ejecutar(codigo, 'lagos', 323, VISIBLES['lagos'][2][1])
        self.assertFalse(r['exito'])
        self.assertRegex(r['motivo'], r'celdas? distintas?')
        final = r['fotogramas'][-1]
        self.assertTrue(final['diferencias'])

    def test_devolver_la_entrada_dice_cuantas_celdas_fallan(self):
        r = self.ejecutar('def transformar(rejilla):\n    return rejilla\n', 'espejo', 301, VISIBLES['espejo'][0][1])
        self.assertFalse(r['exito'])
        self.assertIn('de 12', r['motivo'])
        self.assertEqual(r['metricas']['celdas'], 12)

    def test_modificar_la_rejilla_recibida_no_afecta_a_la_correccion(self):
        codigo = '''
def transformar(rejilla):
    for fila in rejilla:
        fila.reverse()
    return rejilla
'''
        self.assertTrue(self.ejecutar(codigo, 'espejo', 302, VISIBLES['espejo'][1][1])['exito'])

    def test_respuestas_mal_formadas(self):
        casos = {
            'def transformar(r):\n    return 5\n': 'lista de filas',
            'def transformar(r):\n    return [[1, 2], [3]]\n': 'medir lo mismo',
            'def transformar(r):\n    return [[1, "rojo"]]\n': 'del 0 al 9',
            'def transformar(r):\n    return [[1, 10]]\n': 'del 0 al 9',
            'def transformar(r):\n    return [[0]]\n': 'mide 1×1',
        }
        for codigo, texto in casos.items():
            r = self.ejecutar(codigo, 'espejo', 301, VISIBLES['espejo'][0][1])
            self.assertFalse(r['exito'])
            self.assertIn(texto, r['motivo'], codigo)

    def test_tuplas_valen(self):
        codigo = 'def transformar(rejilla):\n    return tuple(tuple(f[::-1]) for f in rejilla)\n'
        self.assertTrue(self.ejecutar(codigo, 'espejo', 303, VISIBLES['espejo'][2][1])['exito'])


if __name__ == '__main__':
    unittest.main()
