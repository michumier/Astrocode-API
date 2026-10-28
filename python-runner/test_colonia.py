# -*- coding: utf-8 -*-
"""
Pruebas del reto 🧬 La colonia (fase 5.7), con el validador de mapas del diseño (riesgo R7).
La lógica se prueba en cualquier sistema; la ejecución real necesita Linux (contenedor del runner):
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_colonia
"""

import random
import sys
import unittest

from misiones.colonia import ENTRADAS, GENERACIONES, N, VECINOS, Colonia, simular, tabla_de
from misiones.motor import ejecutar_escenario, material_reto

SEMILLAS = [501, 502, 9501, 9502, 9503, 9504]

REFERENCIA = '''
def regla(viva, vecinas):
    return viva or vecinas >= 2
'''
TONTAS = {
    'siempre viva': lambda v, n: True,
    'nunca': lambda v, n: False,
    'quedarse igual': lambda v, n: v,
    'invadirlo todo': lambda v, n: v or n >= 1,
    'Juego de la Vida': lambda v, n: n == 3 or (v and n == 2),
    'solo nace con 3': lambda v, n: v or n >= 3,
}


def mapas():
    return [Colonia(s) for s in SEMILLAS]


def aprueba(tabla, lista):
    for m in lista:
        cubierta, infectada, _ = simular(tabla, m.rocas, m.inicial, m.base, m.objetivo)
        if infectada or not cubierta:
            return False
    return True


class PruebasLogica(unittest.TestCase):
    def test_vecinos_en_bordes_y_centro(self):
        self.assertEqual(len(VECINOS[0]), 3)
        self.assertEqual(len(VECINOS[N + 1]), 8)
        self.assertEqual(len(ENTRADAS), 18)

    def test_mapas_deterministas(self):
        for s in SEMILLAS:
            self.assertEqual(Colonia(s).material(), Colonia(s).material())

    def test_grieta_y_puerta(self):
        for m in mapas():
            f, c = divmod(m.grieta, N)
            # La grieta es un hueco de 1 celda: al otro lado (dentro de la base) solo se ve esa celda
            dentro = [j for j in VECINOS[m.grieta] if j in m.base]
            self.assertTrue(dentro, (f, c))
            for j in dentro:
                self.assertEqual([k for k in VECINOS[j] if k not in m.rocas and k not in m.base], [m.grieta])
            self.assertEqual(len(m.puerta), 2)
            self.assertFalse(set(m.puerta) & m.rocas)

    def test_validador_referencia_gana_con_tres_estrellas(self):
        for m in mapas():
            cubierta, infectada, _ = simular(tabla_de(lambda v, n: v or n >= 2), m.rocas, m.inicial, m.base, m.objetivo)
            self.assertIsNone(infectada)
            self.assertTrue(12 <= cubierta <= 25, cubierta)

    def test_validador_reglas_tontas_fallan(self):
        lista = mapas()
        for nombre, f in TONTAS.items():
            self.assertFalse(aprueba(tabla_de(f), lista), nombre)

    def test_validador_reglas_aleatorias_casi_nunca_aprueban(self):
        lista = mapas()
        rng = random.Random(2026)
        total = 2000
        aprobadas = 0
        for _ in range(total):
            bits = rng.getrandbits(18)
            tabla = [[bool(bits >> i & 1) for i in range(9)], [bool(bits >> (9 + i) & 1) for i in range(9)]]
            aprobadas += aprueba(tabla, lista)
        self.assertLess(aprobadas / total, 0.03, aprobadas)

    def test_material(self):
        m = material_reto('colonia', [{'semilla': 501}])[0]['material']
        self.assertEqual(set(m), {'lado', 'generaciones', 'rocas', 'base', 'objetivo', 'inicial'})
        self.assertEqual(len(m['base']), 16)
        self.assertEqual(len(m['objetivo']), 16)


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasEjecucion(unittest.TestCase):

    def ejecutar(self, codigo, semilla, detalle=False):
        return ejecutar_escenario(codigo, 'colonia', {'semilla': semilla}, con_detalle=detalle)

    def test_referencia_supera_todos_los_mapas(self):
        for s in SEMILLAS:
            r = self.ejecutar(REFERENCIA, s)
            self.assertTrue(r['exito'], (s, r['motivo']))
            self.assertEqual(r['estrellas'], 3)

    def test_invadirlo_todo_infecta_la_base_y_el_visor_se_para_ahi(self):
        r = self.ejecutar('def regla(viva, vecinas):\n    return viva or vecinas >= 1\n', 501, detalle=True)
        self.assertFalse(r['exito'])
        self.assertIn('alcanzó la base en la generación', r['motivo'])
        self.assertFalse(r['error_codigo'])
        final = r['fotogramas'][-1]
        self.assertEqual(len(final['generaciones']), final['infectada'] + 1)

    def test_tabla_y_generaciones_para_el_visor(self):
        r = self.ejecutar(REFERENCIA, 501, detalle=True)
        final = r['fotogramas'][-1]
        self.assertEqual(final['tabla']['viva'], [True] * 9)
        self.assertEqual(final['tabla']['muerta'], [False, False] + [True] * 7)
        self.assertEqual(len(final['generaciones']), GENERACIONES + 1)
        self.assertTrue(all(len(g) == N * N for g in final['generaciones']))
        self.assertEqual(r['metricas']['generacion'], final['cubierta'])

    def test_extincion_y_estancamiento(self):
        r = self.ejecutar('def regla(viva, vecinas):\n    return False\n', 502)
        self.assertIn('se extinguió', r['motivo'])
        r = self.ejecutar('def regla(viva, vecinas):\n    return viva or vecinas >= 3\n', 502)
        self.assertIn('no cubrió toda la zona verde', r['motivo'])

    def test_regla_impura_y_valores_raros(self):
        impura = 'import random\n\ndef regla(viva, vecinas):\n    return random.random() < 0.5\n'
        r = self.ejecutar(impura, 501)
        self.assertFalse(r['exito'])
        self.assertIn('pura', r['motivo'])
        r = self.ejecutar('def regla(viva, vecinas):\n    return "si"\n', 501)
        self.assertIn('True o False', r['motivo'])
        r = self.ejecutar('def regla(viva, vecinas):\n    return 1 if vecinas >= 2 or viva else 0\n', 501)
        self.assertTrue(r['exito'], r['motivo'])


if __name__ == '__main__':
    unittest.main()
