# -*- coding: utf-8 -*-
"""
Pruebas del reto 🎨 Pinta la nebulosa (fase 5.5).
La lógica se prueba en cualquier sistema; la ejecución real necesita Linux (contenedor del runner):
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_nebulosa
"""

import sys
import time
import unittest

from misiones.nebulosa import Nebulosa, a_color, anillos, bandera
from misiones.motor import ejecutar_escenario, material_reto

# Soluciones como las escribiría un alumno: con decimales y nombres de color
BANDERA = '''
def color(x, y, ancho, alto):
    radio = min(ancho, alto) // 4
    if (x + 0.5 - ancho / 2) ** 2 + (y + 0.5 - alto / 2) ** 2 <= radio ** 2:
        return "amarillo"
    if x * 3 // ancho == 1:
        return "naranja"
    return "morado"
'''
ANILLOS = '''
import math

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
'''
# Errores típicos: cambiar x por y, depender del tamaño 48×48, o poner la luna abajo (eje Y al revés)
BANDERA_XY = BANDERA.replace('if x * 3 // ancho == 1', 'if y * 3 // alto == 1')
BANDERA_FIJA = BANDERA.replace('ancho', '48').replace('alto', '48').replace('def color(x, y, 48, 48)', 'def color(x, y, ancho, alto)')
ANILLOS_LUNA_ABAJO = ANILLOS.replace('alto * 0.25', 'alto * 0.75')

SEMBRADOS = [
    (451, {'variante': 'bandera', 'ancho': 48, 'alto': 48}), (452, {'variante': 'bandera', 'ancho': 64, 'alto': 32}),
    (9451, {'variante': 'bandera', 'ancho': 25, 'alto': 60}), (9452, {'variante': 'bandera', 'ancho': 80, 'alto': 40}),
    (9453, {'variante': 'bandera', 'ancho': 61, 'alto': 1}), (9454, {'variante': 'bandera', 'ancho': 37, 'alto': 37}),
    (461, {'variante': 'anillos', 'ancho': 48, 'alto': 48}), (462, {'variante': 'anillos', 'ancho': 64, 'alto': 32}),
    (9461, {'variante': 'anillos', 'ancho': 25, 'alto': 60}), (9462, {'variante': 'anillos', 'ancho': 80, 'alto': 40}),
    (9463, {'variante': 'anillos', 'ancho': 100, 'alto': 64}), (9464, {'variante': 'anillos', 'ancho': 61, 'alto': 1}),
]


def pintar(codigo, ancho, alto):
    espacio = {}
    exec(codigo, espacio)
    return ''.join(str(a_color(espacio['color'](x, y, ancho, alto))) for y in range(alto) for x in range(ancho))


class PruebasLogica(unittest.TestCase):
    def test_colores_por_nombre_o_numero(self):
        self.assertEqual(a_color('Amarillo '), 4)
        self.assertEqual(a_color(9), 9)
        for malo in (10, -1, True, 'rosa', None, 4.0):
            self.assertIsNone(a_color(malo))

    def test_bandera_ejemplo(self):
        self.assertEqual(bandera(0, 0, 48, 48), 6)    # morado a la izquierda
        self.assertEqual(bandera(16, 0, 48, 48), 7)   # naranja en el centro
        self.assertEqual(bandera(24, 24, 48, 48), 4)  # sol en el centro
        self.assertEqual(bandera(47, 47, 48, 48), 6)

    def test_anillos_luna_arriba_a_la_derecha(self):
        self.assertEqual(anillos(36, 12, 48, 48), 4)
        self.assertNotEqual(anillos(36, 36, 48, 48), 4)  # abajo a la derecha no hay luna
        self.assertEqual(anillos(24, 24, 48, 48), 7)

    def test_las_soluciones_con_decimales_coinciden_exactamente(self):
        for _, p in SEMBRADOS:
            codigo = BANDERA if p['variante'] == 'bandera' else ANILLOS
            self.assertEqual(pintar(codigo, p['ancho'], p['alto']), Nebulosa(1, p).objetivo, p)

    def test_material_trae_el_objetivo_de_cada_tamano(self):
        m = material_reto('nebulosa', [{'semilla': 451, 'params': SEMBRADOS[0][1]}])[0]['material']
        self.assertEqual(set(m), {'variante', 'ancho', 'alto', 'objetivo'})
        self.assertEqual(len(m['objetivo']), 48 * 48)


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasEjecucion(unittest.TestCase):

    def ejecutar(self, codigo, semilla, params, detalle=False):
        return ejecutar_escenario(codigo, 'nebulosa', {'semilla': semilla, 'params': params}, con_detalle=detalle)

    def test_soluciones_pintan_todos_los_escenarios_sembrados(self):
        for semilla, params in SEMBRADOS:
            codigo = BANDERA if params['variante'] == 'bandera' else ANILLOS
            r = self.ejecutar(codigo, semilla, params)
            self.assertTrue(r['exito'], (params, r['motivo']))
            self.assertEqual(r['estrellas'], 3)
            self.assertEqual(r['metricas']['porcentaje'], 100)

    def test_rendimiento_48x48_por_debajo_de_un_segundo(self):
        inicio = time.monotonic()
        r = self.ejecutar(ANILLOS, 461, SEMBRADOS[6][1])
        self.assertTrue(r['exito'])
        self.assertLess(time.monotonic() - inicio, 1.0)

    def test_errores_tipicos(self):
        r = self.ejecutar(BANDERA_XY, 452, SEMBRADOS[1][1])
        self.assertFalse(r['exito'])
        self.assertIn('%', r['motivo'])
        fallos = [s for s, p in SEMBRADOS[2:6] if not self.ejecutar(BANDERA_FIJA, s, p)['exito']]
        self.assertTrue(fallos)
        self.assertTrue(self.ejecutar(BANDERA_FIJA, *SEMBRADOS[0])['exito'])
        self.assertFalse(self.ejecutar(ANILLOS_LUNA_ABAJO, *SEMBRADOS[6])['exito'])

    def test_anillos_aprueba_con_97_y_da_menos_estrellas(self):
        # Sin la luna se pierde menos del 3 %: aprueba, pero no con ⭐⭐⭐
        sin_luna = ANILLOS.replace('<= u ** 2', '< 0')
        r = self.ejecutar(sin_luna, *SEMBRADOS[9])
        self.assertTrue(r['exito'], r['motivo'])
        self.assertLess(r['estrellas'], 3)

    def test_color_invalido_dice_que_pixel(self):
        r = self.ejecutar('def color(x, y, ancho, alto):\n    return "rosa" if x == 3 and y == 2 else 0\n', *SEMBRADOS[0])
        self.assertFalse(r['exito'])
        self.assertIn('color(3, 2, 48, 48)', r['motivo'])
        self.assertIn("'rosa'", r['motivo'])

    def test_fotogramas_van_pintando_por_lotes(self):
        r = self.ejecutar(BANDERA, *SEMBRADOS[0], detalle=True)
        largos = [len(f['imagen']) for f in r['fotogramas']]
        self.assertEqual(largos, [0, 512, 1024, 1536, 2048, 2304])
        self.assertEqual(r['escena']['objetivo'], r['fotogramas'][-1]['imagen'])

    def test_un_pixel_de_alto(self):
        r = self.ejecutar(BANDERA, *SEMBRADOS[4])
        self.assertTrue(r['exito'], r['motivo'])


if __name__ == '__main__':
    unittest.main()
