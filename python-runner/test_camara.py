# -*- coding: utf-8 -*-
"""
Pruebas del reto 🔐 cámara acorazada (fase 5.3).
La lógica se prueba en cualquier sistema; la ejecución real (con consultas al motor) necesita
Linux (contenedor del runner):
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_camara
"""

import sys
import unittest

from misiones.camara import COMBINACIONES, Camara, comparar, huella
from misiones.motor import ejecutar_escenario, material_reto

HUELLA = '''
import hashlib

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
'''
HUELLA_SIN_CEROS = HUELLA.replace('str(n).zfill(cifras)', 'str(n)')

BINARIA = '''
def abrir(caja):
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
'''
FUERZA_BRUTA = '''
def abrir(caja):
    for n in range(caja.minimo, caja.maximo + 1):
        if caja.probar(n) == "abierta":
            return n
'''

COMBINACION = '''
from itertools import permutations

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
'''
AL_AZAR = '''
import random
from itertools import permutations

def abrir(caja):
    todas = ["".join(p) for p in permutations("0123456789", 4)]
    random.seed(1)
    for intento in random.sample(todas, 10):
        if caja.probar(intento) == "abierta":
            return intento
'''

# Escenarios de src/db/seeds/retos.ts (visibles y ocultos)
SEMBRADOS = [
    (401, {'variante': 'huella', 'candidatos': 500}), (402, {'variante': 'huella'}),
    (9401, {'variante': 'huella', 'candidatos': 50, 'posicion': 'inicio'}),
    (9402, {'variante': 'huella', 'candidatos': 2000, 'posicion': 'fin'}),
    (9403, {'variante': 'huella', 'pin': '0000'}), (9404, {'variante': 'huella', 'pin': '9999'}),
    (9405, {'variante': 'huella', 'cifras': 5}), (9406, {'variante': 'huella', 'candidatos': 300, 'repetido': True}),
    (411, {'variante': 'binaria', 'maximo': 1000, 'secreto': 731}), (412, {'variante': 'binaria', 'maximo': 1000000}),
    (9411, {'variante': 'binaria', 'maximo': 1000, 'secreto': 1}),
    (9412, {'variante': 'binaria', 'maximo': 1000000, 'secreto': 1000000}),
    (9413, {'variante': 'binaria', 'maximo': 1000000, 'secreto': 500000}),
    (9414, {'variante': 'binaria', 'maximo': 1000000000}),
    (9415, {'variante': 'binaria', 'maximo': 1000000, 'secreto': 987654}), (9416, {'variante': 'binaria', 'maximo': 2}),
    (421, {'variante': 'combinacion', 'secreto': '4271'}), (422, {'variante': 'combinacion'}),
    (9421, {'variante': 'combinacion', 'secreto': '9431'}), (9422, {'variante': 'combinacion', 'secreto': '0123'}),
    (9423, {'variante': 'combinacion', 'secreto': '9876'}), (9424, {'variante': 'combinacion'}),
    (9425, {'variante': 'combinacion'}), (9426, {'variante': 'combinacion', 'secreto': '5293'}),
]


class PruebasLogica(unittest.TestCase):
    def test_comparar_ejemplo_del_enunciado(self):
        self.assertEqual(comparar('0123', '4271'), {'exactos': 0, 'descolocados': 2})
        self.assertEqual(comparar('4271', '4271'), {'exactos': 4, 'descolocados': 0})
        self.assertEqual(len(COMBINACIONES), 5040)

    def test_escenarios_sembrados_se_generan_y_son_deterministas(self):
        for semilla, params in SEMBRADOS:
            a, b = Camara(semilla, params), Camara(semilla, params)
            self.assertEqual(a.material(), b.material())

    def test_huella_candidatos(self):
        c = Camara(9406, {'variante': 'huella', 'candidatos': 300, 'repetido': True})
        self.assertEqual(len(c.candidatos), 301)
        self.assertEqual(c.candidatos.count(c.pin), 2)
        self.assertEqual(c.huella, huella(c.pin))
        self.assertEqual(Camara(9401, {'variante': 'huella', 'candidatos': 50, 'posicion': 'inicio'}).candidatos[0],
                         Camara(9401, {'variante': 'huella', 'candidatos': 50, 'posicion': 'inicio'}).pin)
        self.assertEqual(len(Camara(9405, {'variante': 'huella', 'cifras': 5}).pin), 5)

    def test_binaria_intentos_justos(self):
        for maximo in (2, 1000, 10 ** 6, 10 ** 9):
            self.assertEqual(Camara(1, {'variante': 'binaria', 'maximo': maximo}).intentos, maximo.bit_length())

    def test_material_sin_secretos(self):
        # Solo datos públicos: la huella sí (es el reto), pero nunca el PIN ni el secreto
        claves = {
            'huella': {'variante', 'huella', 'candidatos', 'cifras'},
            'binaria': {'variante', 'minimo', 'maximo', 'intentos'},
            'combinacion': {'variante', 'cifras', 'intentos', 'combinaciones'},
        }
        for semilla, params in SEMBRADOS:
            self.assertEqual(set(Camara(semilla, params).material()), claves[params['variante']])
        self.assertEqual(material_reto('camara', [{'semilla': 1, 'params': {'variante': 'combinacion'}}])[0]['material']['intentos'], 10)


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasEjecucion(unittest.TestCase):

    def ejecutar(self, codigo, semilla, params, detalle=False):
        return ejecutar_escenario(codigo, 'camara', {'semilla': semilla, 'params': params}, con_detalle=detalle)

    def test_soluciones_abren_todos_los_escenarios_sembrados(self):
        codigos = {'huella': HUELLA, 'binaria': BINARIA, 'combinacion': COMBINACION}
        for semilla, params in SEMBRADOS:
            r = self.ejecutar(codigos[params['variante']], semilla, params)
            self.assertTrue(r['exito'], (semilla, params, r['motivo']))

    def test_huella_sin_ceros_falla_con_pines_cortos(self):
        r = self.ejecutar(HUELLA_SIN_CEROS, 1, {'variante': 'huella', 'pin': '0042'})
        self.assertFalse(r['exito'])

    def test_huella_devolver_numero_explica_el_formato(self):
        r = self.ejecutar('def abrir(caja):\n    return 42\n', 1, {'variante': 'huella', 'pin': '0042'})
        self.assertFalse(r['exito'])
        self.assertIn('"0042"', r['motivo'])

    def test_huella_detalle_para_la_animacion(self):
        r = self.ejecutar(HUELLA, 401, {'variante': 'huella', 'candidatos': 500}, detalle=True)
        final = r['fotogramas'][-1]
        c = Camara(401, {'variante': 'huella', 'candidatos': 500})
        self.assertEqual(final['pin'], c.pin)
        self.assertEqual(final['probados'], c.candidatos.index(c.pin) + 1)

    def test_fuerza_bruta_salta_la_alarma_en_la_camara_de_ceres(self):
        r = self.ejecutar(FUERZA_BRUTA, 9415, {'variante': 'binaria', 'maximo': 1000000, 'secreto': 987654})
        self.assertFalse(r['exito'])
        self.assertIn('alarma', r['motivo'].lower())
        self.assertFalse(r['error_codigo'])
        # Aunque se corte por la alarma, el visor recibe el historial completo
        r = self.ejecutar(FUERZA_BRUTA, 412, {'variante': 'binaria', 'maximo': 1000000}, detalle=True)
        self.assertEqual(len(r['fotogramas'][-1]['historial']), 20)

    def test_binaria_historial_con_rango(self):
        r = self.ejecutar(BINARIA, 411, {'variante': 'binaria', 'maximo': 1000, 'secreto': 731}, detalle=True)
        historial = r['fotogramas'][-1]['historial']
        self.assertEqual([h['valor'] for h in historial], [500, 750, 625, 687, 718, 734, 726, 730, 732, 731])
        self.assertEqual((historial[0]['bajo'], historial[0]['alto']), (501, 1000))
        self.assertEqual(r['metricas'], {'intentos': 10, 'limite': 10})

    def test_valores_invalidos_cuentan_como_intento(self):
        codigo = 'def abrir(caja):\n    print(caja.probar("hola"))\n    print(caja.probar(10 ** 12))\n'
        r = self.ejecutar(codigo, 1, {'variante': 'binaria', 'maximo': 1000}, detalle=True)
        self.assertEqual(r['metricas']['intentos'], 2)
        self.assertIn('invalido', ''.join(e['texto'] for e in r['registro']))

    def test_combinacion_estrellas_segun_intentos(self):
        r = self.ejecutar(COMBINACION, 9421, {'variante': 'combinacion', 'secreto': '9431'}, detalle=True)
        self.assertTrue(r['exito'])
        self.assertEqual(r['metricas']['intentos'], 9)
        self.assertEqual(r['estrellas'], 1)
        r = self.ejecutar(COMBINACION, 9422, {'variante': 'combinacion', 'secreto': '0123'})
        self.assertEqual(r['estrellas'], 3)

    def test_combinacion_posibles_bajan_en_el_historial(self):
        r = self.ejecutar(COMBINACION, 421, {'variante': 'combinacion', 'secreto': '4271'}, detalle=True)
        posibles = [h['posibles'] for h in r['fotogramas'][-1]['historial']]
        self.assertEqual(posibles, [1260, 288, 128, 21, 2, 1])

    def test_al_azar_no_abre_y_mal_formado_cuenta(self):
        self.assertFalse(self.ejecutar(AL_AZAR, 9423, {'variante': 'combinacion', 'secreto': '9876'})['exito'])
        codigo = 'def abrir(caja):\n    print(caja.probar("1123"), caja.probar(1234))\n'
        r = self.ejecutar(codigo, 1, {'variante': 'combinacion'}, detalle=True)
        self.assertEqual(r['metricas']['intentos'], 2)

    def test_el_secreto_no_esta_en_el_proceso_del_alumno(self):
        codigo = 'def abrir(caja):\n    print(vars(caja), dir(caja))\n'
        r = self.ejecutar(codigo, 1, {'variante': 'combinacion', 'secreto': '5293'}, detalle=True)
        visto = ''.join(e['texto'] for e in r['registro'])
        self.assertNotIn('5293', visto)
        self.assertNotIn('secreto', visto)


if __name__ == '__main__':
    unittest.main()
