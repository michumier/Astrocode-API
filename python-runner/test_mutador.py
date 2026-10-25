# -*- coding: utf-8 -*-
"""Pruebas del mutador de sabotajes: python -m unittest test_mutador (desde python-runner/)."""

import ast
import unittest

from mutador import mutar

PARENTESIS = '''def es_valido(cadena):
    # Usamos una pila
    pila = []
    mapa = {")": "(", "}": "{", "]": "["}
    for char in cadena:
        if char in mapa:
            elemento_pop = pila.pop() if pila else "#"
            if mapa[char] != elemento_pop:
                return False
        else:
            pila.append(char)
    return not pila
'''

FALTANTE = '''def encontrar_faltante(numeros):
    n = len(numeros) + 1
    suma_esperada = n * (n + 1) // 2
    suma_real = sum(numeros)
    return suma_esperada - suma_real
'''

ACUMULADOR = '''def suma_pares(lista):
    total = 0
    for x in lista:
        es_par = x % 2 == 0
        if es_par and x > 0:
            total += x
        print(x)
    return total
'''


class PruebasMutador(unittest.TestCase):

    def comprobar_variantes(self, codigo, variantes):
        self.assertTrue(variantes, 'debería generar alguna variante')
        codigos = set()
        firma = [l for l in codigo.splitlines() if l.startswith('def ')]
        for v in variantes:
            ast.parse(v['codigo'])                              # compila
            self.assertNotEqual(v['codigo'], codigo)            # cambia algo
            self.assertNotIn(v['codigo'], codigos)              # sin duplicados
            codigos.add(v['codigo'])
            self.assertTrue(1 <= v['lineas_cambiadas'] <= 3)
            self.assertEqual(len(v['codigo'].splitlines()), len(codigo.splitlines()))
            self.assertEqual([l for l in v['codigo'].splitlines() if l.startswith('def ')], firma)  # misma firma
            self.assertIn('-', v['diff'])
            self.assertIn('+', v['diff'])

    def test_parentesis(self):
        variantes = mutar(PARENTESIS, max_variantes=50)
        self.comprobar_variantes(PARENTESIS, variantes)
        operadores = {v['operador'] for v in variantes}
        self.assertTrue({'comparacion', 'negacion', 'mutable'} <= operadores, operadores)
        # Los comentarios y el formato se conservan
        for v in variantes:
            self.assertIn('# Usamos una pila', v['codigo'])

    def test_cambio_de_comparacion_es_de_una_linea(self):
        variantes = [v for v in mutar(PARENTESIS, max_variantes=50) if v['descripcion'] == '`!=` cambiado por `==`']
        self.assertEqual(len(variantes), 1)
        self.assertEqual(variantes[0]['linea'], 8)
        self.assertIn('if mapa[char] == elemento_pop:', variantes[0]['codigo'])

    def test_faltante(self):
        variantes = mutar(FALTANTE, max_variantes=50)
        self.comprobar_variantes(FALTANTE, variantes)
        descripciones = {v['descripcion'] for v in variantes}
        self.assertIn('`//` cambiado por `/`', descripciones)
        self.assertIn('quitado el `+ 1`', descripciones)

    def test_acumulador_sangria_y_booleanos(self):
        variantes = mutar(ACUMULADOR, max_variantes=50)
        self.comprobar_variantes(ACUMULADOR, variantes)
        operadores = {v['operador'] for v in variantes}
        self.assertTrue({'valor_inicial', 'booleano', 'sangria', 'aritmetica', 'return'} <= operadores, operadores)
        sangria = next(v for v in variantes if v['operador'] == 'sangria')
        self.assertIn('\n    print(x)\n', sangria['codigo'])

    def test_determinista_y_variado(self):
        a = mutar(PARENTESIS, max_variantes=6, semilla=3)
        b = mutar(PARENTESIS, max_variantes=6, semilla=3)
        self.assertEqual([v['codigo'] for v in a], [v['codigo'] for v in b])
        # Las primeras variantes son de operadores distintos
        self.assertEqual(len({v['operador'] for v in a[:3]}), 3)

    def test_unicode_en_el_codigo(self):
        codigo = 'def saludo(n):\n    mensaje = "¡Hola, cadete! 🚀"\n    return n < 3\n'
        variantes = mutar(codigo, max_variantes=20)
        cambio = next(v for v in variantes if v['operador'] == 'comparacion')
        self.assertIn('return n <= 3', cambio['codigo'])
        self.assertIn('"¡Hola, cadete! 🚀"', cambio['codigo'])

    def test_codigo_invalido(self):
        with self.assertRaises(SyntaxError):
            mutar('def roto(:\n    pass')


if __name__ == '__main__':
    unittest.main()
