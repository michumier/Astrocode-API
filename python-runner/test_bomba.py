# -*- coding: utf-8 -*-
"""
Pruebas del reto 💣 bomba (fase 5.1).
La lógica (manual, generador) se prueba en cualquier sistema; la ejecución real del código
del alumno necesita Linux (contenedor del runner):
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_bomba
"""

import random
import sys
import unittest

from misiones.bomba import (Bomba, COLUMNAS, RAMAS, cortes_cables, explicacion, generar, orden_teclado,
                            regla_boton, solucion)
from misiones.motor import ejecutar_escenario, material_reto

# Combinaciones posibles de (regla del paso 1, rama del paso 2)
COMBINACIONES = [(1, 'azul'), (1, 'vocal'), (1, 'sin_vocal'), (2, 'vocal'), (2, 'sin_vocal'),
                 (3, 'azul'), (3, 'azul_final'), (4, 'azul_final'), (4, 'rojo'), (4, 'vocal'),
                 (4, 'sin_vocal'), (5, 'azul'), (5, 'rojo'), (5, 'vocal'), (5, 'sin_vocal')]

REFERENCIA_B1 = '''
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

def desactivar(bomba):
    return cortes_cables(bomba["cables"], bomba["serie"])
'''

COLUMNAS_PY = 'COLUMNAS = ' + repr(COLUMNAS) + '\n'

REFERENCIA_B2 = REFERENCIA_B1.replace('def desactivar(bomba):\n    return cortes_cables(bomba["cables"], bomba["serie"])\n', '') + COLUMNAS_PY + '''
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
    return {"cables": cortes_cables(bomba["cables"], bomba["serie"]),
            "boton": modulo_boton(bomba["boton"], bomba["baterias"]),
            "teclado": modulo_teclado(bomba["teclado"])}
'''

# Errores típicos que deben fallar en algún escenario
SIN_PASO_2 = REFERENCIA_B1.replace('    return cortes_cables(bomba["cables"], bomba["serie"])',
                                   '    return [primer_corte(bomba["cables"], bomba["serie"])]')
ORDEN_CAMBIADO = REFERENCIA_B1.replace(
    '''    if cables[-1] == "blanco":
        return len(cables) - 1
    if cables.count("azul") > 1:
        return len(cables) - 1 - cables[::-1].index("azul")''',
    '''    if cables.count("azul") > 1:
        return len(cables) - 1 - cables[::-1].index("azul")
    if cables[-1] == "blanco":
        return len(cables) - 1''')
AZUL_SIN_LIMITE = REFERENCIA_B1.replace(
    '''        if primero + 1 < len(cables):
            cortes.append(primero + 1)''', '''        cortes.append(primero + 1)''')
PRIMER_AZUL = REFERENCIA_B1.replace('len(cables) - 1 - cables[::-1].index("azul")', 'cables.index("azul")')


def escenario(variante, semilla, objetivo=None, boton=None):
    params = {'variante': variante}
    if objetivo:
        params['objetivo'] = list(objetivo)
    if boton:
        params['boton'] = boton
    return {'semilla': semilla, 'params': params}


class PruebasManual(unittest.TestCase):
    def test_ejemplos_del_enunciado(self):
        self.assertEqual(cortes_cables(['rojo', 'azul', 'blanco', 'azul', 'negro'], 'K7Q2M5'), ([3, 4], 3, 'azul'))
        self.assertEqual(cortes_cables(['amarillo', 'negro', 'blanco'], 'A41B2C'), ([1, 2], 1, 'vocal'))

    def test_casos_limite(self):
        # Azul al final: no hay cable a la derecha
        self.assertEqual(cortes_cables(['rojo', 'azul', 'negro', 'azul'], 'BCD123'), ([3], 3, 'azul_final'))
        # Primer corte en el último cable: «el último sin cortar» es el penúltimo
        self.assertEqual(cortes_cables(['rojo', 'negro', 'blanco'], 'A00001'), ([2, 1], 2, 'vocal'))

    def test_boton_y_teclado(self):
        self.assertEqual(regla_boton({'color': 'azul', 'texto': 'ABORTAR'}, 4), (1, 'mantener'))
        self.assertEqual(regla_boton({'color': 'azul', 'texto': 'DETONAR'}, 2), (2, 'pulsar'))
        self.assertEqual(regla_boton({'color': 'blanco', 'texto': 'DETONAR'}, 1), (3, 'mantener'))
        self.assertEqual(regla_boton({'color': 'rojo', 'texto': 'PULSAR'}, 0), (4, 'pulsar'))
        self.assertEqual(orden_teclado(['🌙', '🪐', '⭐', '🛸']), (0, ['🪐', '🛸', '🌙', '⭐']))


class PruebasGenerador(unittest.TestCase):
    def test_determinista(self):
        for variante in ('cables', 'modulos'):
            a = Bomba(42, {'variante': variante}).bomba
            b = Bomba(42, {'variante': variante}).bomba
            self.assertEqual(a, b)

    def test_todas_las_combinaciones_se_pueden_generar(self):
        for regla, rama in COMBINACIONES:
            bomba = generar(random.Random(regla * 10), 'cables', [regla, rama])
            self.assertEqual(cortes_cables(bomba['cables'], bomba['serie'])[1:], (regla, rama))
        for b in range(1, 5):
            bomba = generar(random.Random(b), 'modulos', None, b)
            self.assertEqual(regla_boton(bomba['boton'], bomba['baterias'])[0], b)

    def test_formato_de_las_bombas(self):
        rng = random.Random(7)
        for _ in range(500):
            bomba = generar(rng, 'modulos')
            self.assertTrue(3 <= len(bomba['cables']) <= 6)
            self.assertEqual(len(bomba['serie']), 6)
            self.assertTrue(bomba['serie'][-1].isdigit())
            # El teclado siempre tiene solución única
            self.assertEqual(sum(all(s in c for s in bomba['teclado']) for c in COLUMNAS), 1)
            self.assertEqual(len(set(bomba['teclado'])), 4)

    def test_objetivo_imposible(self):
        with self.assertRaises(ValueError):
            generar(random.Random(0), 'cables', [2, 'rojo'])

    def test_material_sin_solucion(self):
        material = material_reto('bomba', [escenario('modulos', 1)])[0]['material']
        self.assertEqual(set(material), {'variante', 'bomba', 'columnas'})
        self.assertNotIn('esperado', str(material))

    def test_explicacion(self):
        bomba = {'cables': ['rojo', 'azul', 'blanco', 'azul', 'negro'], 'serie': 'K7Q2M5'}
        self.assertIn('regla 3 → cable 3', explicacion(bomba, 'cables'))
        self.assertEqual(solucion(bomba, 'cables'), [3, 4])


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasEjecucion(unittest.TestCase):

    def ejecutar(self, codigo, esc):
        return ejecutar_escenario(codigo, 'bomba', esc, con_detalle=True)

    def test_referencia_b1_aprueba_muchas_semillas(self):
        for i, (regla, rama) in enumerate(COMBINACIONES * 4):
            r = self.ejecutar(REFERENCIA_B1, escenario('cables', i, (regla, rama)))
            self.assertTrue(r['exito'], (regla, rama, r['motivo']))

    def test_referencia_b2_aprueba(self):
        for i, (regla, rama) in enumerate(COMBINACIONES):
            r = self.ejecutar(REFERENCIA_B2, escenario('modulos', i, (regla, rama), i % 4 + 1))
            self.assertTrue(r['exito'], (regla, rama, r['motivo']))

    def test_errores_tipicos_fallan(self):
        for codigo, combinacion in ((SIN_PASO_2, (3, 'azul')), (ORDEN_CAMBIADO, (2, 'vocal')),
                                    (AZUL_SIN_LIMITE, (3, 'azul_final')), (PRIMER_AZUL, (3, 'azul'))):
            # El generador puede dar una bomba donde el error no se nota: con varias semillas seguro que sí
            fallos = [not self.ejecutar(codigo, escenario('cables', s, combinacion))['exito'] for s in range(40)]
            self.assertTrue(any(fallos), combinacion)

    def test_fallo_visible_explica_la_solucion(self):
        r = self.ejecutar('def desactivar(bomba):\n    return [0]\n', escenario('cables', 1, (3, 'azul')))
        self.assertFalse(r['exito'])
        self.assertIn('BOOM', r['motivo'])
        self.assertIn('regla 3', r['motivo'])
        final = r['fotogramas'][-1]
        self.assertEqual(final['respuesta'], [0])
        self.assertEqual(final['correcto'], False)
        self.assertEqual(len(r['fotogramas']), 2)

    def test_respuestas_mal_formadas(self):
        casos = {
            'def desactivar(b):\n    return 3\n': 'LISTA',
            'def desactivar(b):\n    return [99]\n': 'solo tiene',
            'def desactivar(b):\n    return ["rojo"]\n': 'enteros',
            'def desactivar(b):\n    pass\n': 'None',
        }
        for codigo, texto in casos.items():
            r = self.ejecutar(codigo, escenario('cables', 1))
            self.assertFalse(r['exito'])
            self.assertIn(texto, r['motivo'], codigo)
        r = self.ejecutar('def desactivar(b):\n    return {"cables": [0], "boton": "pulsar"}\n', escenario('modulos', 1))
        self.assertIn('Falta la clave "teclado"', r['motivo'])
        r = self.ejecutar('def desactivar(b):\n    return {"cables": [0], "boton": "girar", "teclado": [1, 2, 3, 4]}\n',
                          escenario('modulos', 1))
        self.assertIn('"pulsar" o "mantener"', r['motivo'])

    def test_tuplas_valen_como_listas(self):
        codigo = REFERENCIA_B1.replace('    return cortes\n', '    return tuple(cortes)\n')
        self.assertTrue(self.ejecutar(codigo, escenario('cables', 3, (3, 'azul')))['exito'])


if __name__ == '__main__':
    unittest.main()
