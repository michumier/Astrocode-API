# -*- coding: utf-8 -*-
"""
Pruebas de las ampliaciones del motor para los retos de la fase 5 (con procesos reales):
argumentos, lotes, consultas remotas y material público. Usan el reto «diagnostico».
Necesitan Linux: se ejecutan dentro del contenedor del runner.
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_retos_motor
"""

import json
import sys
import time
import unittest

from misiones.motor import ejecutar_mision, ejecutar_escenario, material_reto, recortar_fotogramas

SUMA = 'def calibrar(a, b):\n    return a + b\n'
RESTA = 'def calibrar(a, b):\n    return a - b\n'
REJILLA = 'def calibrar(x, y):\n    return (x + y) % 10\n'
REJILLA_ROTA = '''
def calibrar(x, y):
    if x == 3 and y == 2:
        return 1 / 0
    return (x + y) % 10
'''
BINARIA = '''
def calibrar(sonda):
    bajo, alto = sonda.minimo, sonda.maximo
    while bajo <= alto:
        medio = (bajo + alto) // 2
        r = sonda.probar(medio)
        print("pruebo", medio, r)
        if r == "abierta":
            return medio
        if r == "mayor":
            bajo = medio + 1
        else:
            alto = medio - 1
'''
FUERZA_BRUTA = '''
def calibrar(sonda):
    for n in range(sonda.minimo, sonda.maximo + 1):
        if sonda.probar(n) == "abierta":
            return n
'''
FUERZA_BRUTA_CAPTURANDO = '''
def calibrar(sonda):
    try:
        for n in range(sonda.minimo, sonda.maximo + 1):
            if sonda.probar(n) == "abierta":
                return n
    except Alarma:
        return 0
'''


def escenario(modo, **params):
    return {'semilla': 7, 'params': {'modo': modo, **params}, 'nombre': modo}


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasRetosMotor(unittest.TestCase):

    # ---- E1 + E2: nombre de función y argumentos posicionales ----
    def test_args_correctos(self):
        r = ejecutar_escenario(SUMA, 'diagnostico', escenario('args'), con_detalle=True)
        self.assertTrue(r['exito'], r['motivo'])
        self.assertEqual(r['ticks'], 3)
        self.assertEqual(len(r['fotogramas']), 4)
        self.assertFalse(r['error_codigo'])

    def test_args_incorrectos_explican_que_falla(self):
        r = ejecutar_escenario(RESTA, 'diagnostico', escenario('args'), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('se esperaba', r['motivo'])
        self.assertFalse(r['error_codigo'])

    def test_funcion_con_otro_nombre(self):
        r = ejecutar_escenario('def piloto(s):\n    return 1\n', 'diagnostico', escenario('args'), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('No has definido la función `calibrar`', r['motivo'])
        self.assertTrue(r['error_codigo'])

    def test_bucle_infinito_nombra_la_funcion(self):
        r = ejecutar_escenario('def calibrar(a, b):\n    while True: pass\n', 'diagnostico', escenario('args'), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('calibrar()', r['motivo'])

    # ---- E3: lotes ----
    def test_lote_correcto_y_rapido(self):
        inicio = time.monotonic()
        r = ejecutar_escenario(REJILLA, 'diagnostico', escenario('lote', lado=48), con_detalle=True)
        segundos = time.monotonic() - inicio
        self.assertTrue(r['exito'], r['motivo'])
        self.assertEqual(r['metricas'], {'aciertos': 48 * 48, 'total': 48 * 48})
        self.assertEqual(len(r['fotogramas'][-1]['imagen']), 48 * 48)
        print(f'\n  rendimiento: lote de 48×48 = {48 * 48} llamadas en {segundos:.2f} s')
        self.assertLess(segundos, 1.0)

    def test_error_en_un_lote_dice_con_que_argumentos(self):
        r = ejecutar_escenario(REJILLA_ROTA, 'diagnostico', escenario('lote', lado=8), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('calibrar(3, 2)', r['motivo'])
        self.assertIn('ZeroDivisionError', r['motivo'])

    def test_lote_con_tamano_erroneo(self):
        codigo = 'def calibrar(x, y):\n    return None\n'
        r = ejecutar_escenario(codigo, 'diagnostico', escenario('lote', lado=4), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('0 de 16', r['motivo'])

    # ---- E4: consultas remotas ----
    def test_consultas_busqueda_binaria(self):
        r = ejecutar_escenario(BINARIA, 'diagnostico', escenario('consulta', maximo=1_000_000), con_detalle=True)
        self.assertTrue(r['exito'], r['motivo'])
        self.assertLessEqual(r['metricas']['intentos'], 20)
        self.assertEqual(r['metricas']['limite'], 20)
        # Los print hechos entre consultas llegan al registro
        self.assertTrue(any('pruebo' in e['texto'] for e in r['registro']))

    def test_fuerza_bruta_hace_saltar_la_alarma(self):
        r = ejecutar_escenario(FUERZA_BRUTA, 'diagnostico', escenario('consulta', maximo=1000), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('alarma', r['motivo'].lower())
        # Saltar la alarma es fallar el reto, no un error del código
        self.assertFalse(r['error_codigo'])

    def test_capturar_la_alarma_no_sirve(self):
        r = ejecutar_escenario(FUERZA_BRUTA_CAPTURANDO, 'diagnostico', escenario('consulta', maximo=1000), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('alarma', r['motivo'].lower())

    def test_excepcion_dentro_de_la_funcion(self):
        codigo = 'def calibrar(sonda):\n    sonda.probar(1)\n    return 1 / 0\n'
        r = ejecutar_escenario(codigo, 'diagnostico', escenario('consulta'), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertTrue(r['error_codigo'])
        self.assertIn('ZeroDivisionError', r['motivo'])

    def test_sin_consultas(self):
        r = ejecutar_escenario('def calibrar(sonda):\n    pass\n', 'diagnostico', escenario('consulta'), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('sin acertar', r['motivo'])

    def test_consulta_mal_formada(self):
        codigo = 'def calibrar(sonda):\n    sonda.abrir_a_la_fuerza()\n'
        r = ejecutar_escenario(codigo, 'diagnostico', escenario('consulta'), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('AttributeError', r['motivo'])
        r = ejecutar_escenario('def calibrar(sonda):\n    sonda.probar(1, 2)\n', 'diagnostico',
                               escenario('consulta'), con_detalle=False)
        self.assertFalse(r['exito'])
        self.assertIn('Consulta no válida', r['motivo'])

    def test_el_secreto_no_esta_en_el_proceso_del_alumno(self):
        # Todo lo que el alumno puede inspeccionar de la sonda
        codigo = 'def calibrar(sonda):\n    print(vars(sonda), dir(sonda))\n'
        r = ejecutar_escenario(codigo, 'diagnostico', escenario('consulta'), con_detalle=True)
        visto = ''.join(e['texto'] for e in r['registro'])
        from misiones.diagnostico import Diagnostico
        secreto = Diagnostico(7, {'modo': 'consulta'}).secreto
        self.assertNotIn(f' {secreto},', visto.replace('{', ' ').replace('}', ','))
        self.assertNotIn('secreto', visto)
        self.assertNotIn(str(secreto), json.dumps(r['fotogramas'][0]) + json.dumps(r['escena']))

    # ---- E5: material público ----
    def test_material_publico_sin_secretos(self):
        material = material_reto('diagnostico', [escenario('consulta', maximo=5000), escenario('lote', lado=10)])
        self.assertEqual(material[0]['nombre'], 'consulta')
        self.assertEqual(set(material[0]['material']), {'modo', 'maximo', 'intentos', 'explicacion'})
        self.assertEqual(material[1]['material']['lado'], 10)
        # Determinista: misma semilla, mismo material
        self.assertEqual(material, material_reto('diagnostico', [escenario('consulta', maximo=5000), escenario('lote', lado=10)]))

    def test_material_de_mision_desconocida(self):
        with self.assertRaises(ValueError):
            material_reto('no-existe', [escenario('args')])

    # ---- Escenarios ocultos y tope de detalle ----
    def test_ocultos_sin_detalle(self):
        escenarios = [escenario('args'), {**escenario('args'), 'semilla': 99, 'oculto': True}]
        resultados = ejecutar_mision(SUMA, 'diagnostico', escenarios)
        self.assertTrue(all(r['exito'] for r in resultados))
        self.assertIn('fotogramas', resultados[0])
        self.assertNotIn('fotogramas', resultados[1])
        self.assertNotIn('registro', resultados[1])


class PruebasRecorte(unittest.TestCase):
    def test_recortar_fotogramas(self):
        pequenos = [{'i': i} for i in range(10)]
        self.assertEqual(recortar_fotogramas(pequenos), (pequenos, False))
        grandes = [{'i': i, 'relleno': 'x' * 10_000} for i in range(500)]
        recortados, recortado = recortar_fotogramas(grandes)
        self.assertTrue(recortado)
        self.assertLessEqual(len(json.dumps(recortados)), 2_100_000)
        self.assertEqual(recortados[0]['i'], 0)
        self.assertEqual(recortados[-1]['i'], 499)


if __name__ == '__main__':
    unittest.main()
