# -*- coding: utf-8 -*-
"""
Pruebas de la caja negra (procesos reales con límites): se ejecutan dentro del contenedor.
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_trazador
"""

import json
import sys
import unittest

from trazador import trazar


def valor(paso, nombre, nivel=-1):
    """Representación de una variable en un paso (nivel -1 = función más interna)."""
    return paso['pila'][nivel]['vars'].get(nombre)


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasTrazador(unittest.TestCase):

    def test_bucle_for(self):
        codigo = 'total = 0\nfor i in range(5):\n    total += i\nprint(total)\n'
        r = trazar(codigo)
        self.assertIsNone(r['error'])
        self.assertFalse(r['truncado'])
        self.assertEqual(r['salida'], '10\n')
        lineas = [p['linea'] for p in r['pasos'] if p['evento'] == 'line']
        self.assertEqual(lineas, [1, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 4])
        # «total» va cambiando: 0, 0, 1, 3, 6, 10
        totales = []
        for p in r['pasos']:
            v = valor(p, 'total')
            if v and (not totales or totales[-1] != v['r']):
                totales.append(v['r'])
        self.assertEqual(totales, ['0', '1', '3', '6', '10'])
        # La salida acumulada solo aparece tras el print
        self.assertEqual(r['pasos'][-1]['salida'], 3)

    def test_recursion_pila(self):
        codigo = 'def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n\nx = fact(4)\n'
        r = trazar(codigo)
        profundidades = [len(p['pila']) for p in r['pasos']]
        self.assertEqual(max(profundidades), 5)  # <programa> + fact(4..1)
        self.assertEqual(profundidades[-1], 1)
        retornos = [p['retorno']['r'] for p in r['pasos'] if p['evento'] == 'return' and p['pila'][-1]['funcion'] == 'fact']
        self.assertEqual(retornos, ['1', '2', '6', '24'])
        self.assertEqual(r['pasos'][-1]['pila'][0]['vars']['x']['r'], '24')
        # Las funciones no aparecen como variables
        self.assertNotIn('fact', r['pasos'][-1]['pila'][0]['vars'])

    def test_bucle_infinito_se_corta(self):
        r = trazar('n = 0\nwhile True:\n    n += 1\n')
        self.assertTrue(r['truncado'])
        self.assertEqual(len(r['pasos']), 1000)
        self.assertIsNone(r['error'])

    def test_excepcion(self):
        r = trazar('lista = [1, 2]\nprint(lista[5])\n')
        self.assertIn('IndexError', r['error'])
        excepciones = [p for p in r['pasos'] if p['evento'] == 'exception']
        self.assertEqual(excepciones[0]['linea'], 2)
        self.assertIn('IndexError', excepciones[0]['excepcion'])

    def test_error_de_sintaxis(self):
        r = trazar('def f(:\n    pass\n')
        self.assertIn('SyntaxError en la línea 1', r['error'])
        self.assertEqual(r['pasos'], [])

    def test_serializacion(self):
        codigo = (
            'class Nodo:\n'
            '    def __init__(self, v):\n'
            '        self.valor = v\n'
            '        self.siguiente = None\n'
            'a = Nodo(1)\n'
            'a.siguiente = a\n'                      # ciclo
            'grande = list(range(500))\n'
            'd = {"clave": [1, 2], 3: "tres"}\n'
            'texto = "x" * 1000\n'
            'fin = True\n'
        )
        r = trazar(codigo)
        vars_ = r['pasos'][-1]['pila'][0]['vars']
        self.assertEqual(vars_['a']['t'], 'obj')
        self.assertEqual(vars_['a']['clase'], 'Nodo')
        self.assertEqual(vars_['a']['atributos']['siguiente']['t'], 'ref')
        self.assertEqual(vars_['grande']['longitud'], 500)
        self.assertEqual(len(vars_['grande']['elementos']), 50)
        self.assertEqual(vars_['d']['items'][0][0]['r'], "'clave'")
        self.assertLessEqual(len(vars_['texto']['r']), 201)
        self.assertNotIn('Nodo', vars_)  # las clases no aparecen como variables

    def test_repr_roto_no_tumba_la_traza(self):
        codigo = 'class Raro:\n    def __repr__(self):\n        raise ValueError("no")\nr = Raro()\nx = 1\n'
        r = trazar(codigo)
        self.assertIsNone(r['error'])
        self.assertEqual(r['pasos'][-1]['pila'][0]['vars']['x']['r'], '1')

    def test_print_no_rompe_el_json(self):
        r = trazar('print("}{ ] json roto \\" \\n")\nprint(\'{"pasos": []}\')\n')
        self.assertIsNone(r['error'])
        self.assertGreaterEqual(len(r['pasos']), 2)

    def test_stdin(self):
        r = trazar('nombre = input()\nprint("Hola", nombre)\n', entrada='Cadete\n')
        self.assertEqual(r['salida'], 'Hola Cadete\n')

    def test_test_externo_traza_las_funciones_del_alumno(self):
        alumno = 'def doble(x):\n    resultado = x * 2\n    return resultado\n'
        r = trazar(alumno, codigo_test='print(doble(21))')
        self.assertEqual(r['salida'], '42\n')
        dentro = [p for p in r['pasos'] if p['pila'] and p['pila'][-1]['funcion'] == 'doble']
        self.assertTrue(dentro)
        # Solo se registran líneas del archivo del alumno
        self.assertTrue(all(1 <= p['linea'] <= 3 for p in r['pasos']))

    def test_traza_acotada_en_tamano(self):
        r = trazar('datos = list(range(50))\nfor i in range(400):\n    datos[i % 50] = "x" * 150\n')
        self.assertLessEqual(len(json.dumps(r['pasos'])), 1_100_000)

    def test_sin_secretos_del_entorno(self):
        r = trazar('import os\nclaves = sorted(os.environ)\n')
        self.assertNotIn('JWT_SECRET', r['pasos'][-1]['pila'][0]['vars']['claves']['elementos'].__repr__())


if __name__ == '__main__':
    unittest.main()
