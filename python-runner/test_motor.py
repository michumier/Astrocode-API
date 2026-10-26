# -*- coding: utf-8 -*-
"""
Pruebas del motor de misiones con procesos reales (piloto aislado).
Necesitan Linux (select sobre tuberías y límites de recursos): se ejecutan dentro del contenedor.
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_motor
"""

import sys
import time
import unittest

from misiones.motor import ejecutar_mision, ejecutar_escenario

ESCENARIOS = [
    {'semilla': 1, 'params': {'gravedad': 3.71}, 'nombre': 'Marte'},
    {'semilla': 2, 'params': {'gravedad': 1.62}, 'nombre': 'Luna'},
    {'semilla': 3, 'params': {'gravedad': 2.4}, 'oculto': True},
]

DOS_CONDICIONES = '''
def piloto(sensores):
    if sensores["velocidad"] < -6 or (sensores["altura"] < 25 and sensores["velocidad"] < -1.5):
        return {"empuje": 1}
    return {"empuje": 0}
'''

CON_MEMORIA = '''
pasos = 0
def piloto(s):
    global pasos
    pasos += 1
    print("tick", pasos, "altura", round(s["altura"]))
    objetivo = -max(1.0, s["altura"] * 0.12)
    return min(1, max(0, (objetivo - s["velocidad"]) * 0.8 + s["gravedad"] / 12))
'''


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasMotor(unittest.TestCase):

    def test_solucion_valida_y_detalle_solo_en_visibles(self):
        resultados = ejecutar_mision(DOS_CONDICIONES, 'aterrizaje', ESCENARIOS)
        self.assertEqual([r['exito'] for r in resultados], [True, True, True])
        visibles, oculto = resultados[:2], resultados[2]
        for r in visibles:
            self.assertGreater(len(r['fotogramas']), 10)
            self.assertEqual(len(r['fotogramas']), r['ticks'] + 1)
            self.assertIn('escena', r)
        for clave in ('fotogramas', 'registro', 'escena'):
            self.assertNotIn(clave, oculto)
        self.assertEqual(oculto['nombre'], 'Escenario 3')

    def test_estado_entre_ticks_y_prints_en_el_registro(self):
        r = ejecutar_escenario(CON_MEMORIA, 'aterrizaje', ESCENARIOS[0], True)
        self.assertTrue(r['exito'], r['motivo'])
        self.assertTrue(r['registro'][0]['texto'].startswith('tick 1 altura'))
        # Los print() no rompen el protocolo y el registro está acotado
        self.assertLessEqual(sum(len(x['texto']) for x in r['registro']), 4000)

    def test_sin_motor_se_estrella(self):
        r = ejecutar_escenario('def piloto(s):\n    return 0', 'aterrizaje', ESCENARIOS[0], False)
        self.assertFalse(r['exito'])
        self.assertIn('Impacto', r['motivo'])

    def test_errores_legibles(self):
        casos = {
            'def piloto(s)\n    return 0': 'SyntaxError',
            'x = 1': 'No has definido la función `piloto(sensores)`',
            'def piloto(s):\n    return s["altitud"]': 'KeyError',
            'def piloto(s):\n    pass': 'devolvió None',
            'def piloto(s):\n    return "mucho"': 'debe ser un número',
            'def piloto(s):\n    return {1, 2}': 'no se puede enviar',
        }
        for codigo, esperado in casos.items():
            r = ejecutar_escenario(codigo, 'aterrizaje', ESCENARIOS[0], True)
            self.assertFalse(r['exito'])
            self.assertTrue(r['error_codigo'])
            self.assertIn(esperado, r['motivo'], codigo)

    def test_bucle_infinito_en_el_piloto(self):
        inicio = time.monotonic()
        r = ejecutar_escenario('def piloto(s):\n    while True:\n        pass', 'aterrizaje', ESCENARIOS[0], False)
        self.assertIn('no respondió a tiempo (tick 0)', r['motivo'])
        self.assertLess(time.monotonic() - inicio, 3)

    def test_bucle_infinito_al_cargar(self):
        r = ejecutar_escenario('while True:\n    pass\ndef piloto(s):\n    return 0', 'aterrizaje', ESCENARIOS[0], False)
        self.assertIn('tardó demasiado en cargar', r['motivo'])

    def test_no_puede_tocar_la_simulacion(self):
        trampas = [
            # Intentar importar el motor para cambiar la física
            'import misiones.aterrizaje as a\na.VELOCIDAD_SEGURA = 999\ndef piloto(s):\n    return 0',
            # Escribir un mensaje falso del protocolo directamente en la salida
            'import os\nos.write(1, b\'{"accion": 1}\\n\')\ndef piloto(s):\n    return 0',
            # Leer el canal del protocolo para "ver el futuro"
            'import sys\ndef piloto(s):\n    sys.stdin.read()\n    return 0',
        ]
        for codigo in trampas:
            r = ejecutar_escenario(codigo, 'aterrizaje', ESCENARIOS[0], False)
            self.assertFalse(r['exito'], codigo)

    def test_memorizar_un_escenario_no_sirve_en_otro(self):
        # Se graba el empuje de una solución buena en el escenario 1 y se repite a ciegas
        r = ejecutar_escenario(DOS_CONDICIONES, 'aterrizaje', ESCENARIOS[0], True)
        secuencia = [f['e'] for f in r['fotogramas'][1:]]
        memorizado = f'EMPUJES = {secuencia!r}\ndef piloto(s):\n    t = s["tick"]\n    return EMPUJES[t] if t < len(EMPUJES) else 1'
        mismo = ejecutar_escenario(memorizado, 'aterrizaje', ESCENARIOS[0], False)
        otro = ejecutar_escenario(memorizado, 'aterrizaje', {'semilla': 99, 'params': {'gravedad': 1.62}}, False)
        self.assertTrue(mismo['exito'])
        self.assertFalse(otro['exito'])

    def test_asteroides_y_cristales(self):
        carril = '''
def piloto(s):
    c = s["carril"]
    opciones = [x for x in (c, c - 1, c + 1) if 0 <= x < s["carriles"]]
    mejor = max(opciones, key=lambda x: s["distancias"][x])
    return "mantener" if mejor == c else ("izquierda" if mejor < c else "derecha")
'''
        r = ejecutar_mision(carril, 'asteroides', [{'semilla': 4}, {'semilla': 5, 'oculto': True}])
        self.assertTrue(all(x['exito'] for x in r), r)
        self.assertEqual(len(r[0]['escena']['asteroides']) > 0, True)

        r = ejecutar_escenario('def piloto(s):\n    return "N"', 'cristales', {'semilla': 4}, True)
        self.assertFalse(r['exito'])
        self.assertIn('cristal', r['motivo'])

    def test_mision_desconocida(self):
        with self.assertRaises(ValueError):
            ejecutar_mision('def piloto(s): return 0', 'teletransporte', [{}])


if __name__ == '__main__':
    unittest.main()
