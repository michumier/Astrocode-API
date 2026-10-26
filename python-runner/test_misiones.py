# -*- coding: utf-8 -*-
"""Pruebas de las simulaciones (sin procesos): python -m unittest test_misiones"""

import unittest
from collections import deque

from misiones.aterrizaje import Aterrizaje, EMPUJE_MAX
from misiones.asteroides import Asteroides
from misiones.cristales import Cristales, MOVIMIENTOS
from misiones.base import AccionInvalida

SEMILLAS = range(30)
GRAVEDADES = (1.62, 3.71, 2.4)


def volar(mision, piloto):
    while not mision.terminado():
        mision.avanzar(piloto(mision.sensores()))
    return mision.resultado()


# ---------- Pilotos de referencia (los mismos que se dan como soluciones) ----------

def piloto_nada(s):
    return {'empuje': 0}


def piloto_dos_condiciones(s):
    if s['velocidad'] < -6 or (s['altura'] < 25 and s['velocidad'] < -1.5):
        return {'empuje': 1}
    return {'empuje': 0}


def piloto_proporcional(s):
    objetivo = -max(1.0, s['altura'] * 0.12)
    return {'empuje': min(1, max(0, (objetivo - s['velocidad']) * 0.8 + s['gravedad'] / EMPUJE_MAX))}


def piloto_carril_libre(s):
    c = s['carril']
    opciones = [x for x in (c, c - 1, c + 1) if 0 <= x < s['carriles']]
    mejor = max(opciones, key=lambda x: s['distancias'][x])
    return 'mantener' if mejor == c else 'izquierda' if mejor < c else 'derecha'


def piloto_cristal_cercano(s):
    mapa, (f0, c0) = s['mapa'], s['posicion']
    objetivos = {tuple(c) for c in s['cristales']}
    previo = {(f0, c0): None}
    cola = deque([(f0, c0)])
    while cola:
        f, c = cola.popleft()
        if (f, c) in objetivos:
            while previo[(f, c)] != (f0, c0):
                f, c = previo[(f, c)]
            for nombre, (df, dc) in MOVIMIENTOS.items():
                if (f0 + df, c0 + dc) == (f, c):
                    return nombre
        for df, dc in MOVIMIENTOS.values():
            nf, nc = f + df, c + dc
            if 0 <= nf < len(mapa) and 0 <= nc < len(mapa[0]) and mapa[nf][nc] != '#' and (nf, nc) not in previo:
                previo[(nf, nc)] = (f, c)
                cola.append((nf, nc))
    return 'N'


class PruebasAterrizaje(unittest.TestCase):

    def test_sin_motor_se_estrella(self):
        for s in SEMILLAS:
            r = volar(Aterrizaje(s, {'gravedad': 3.71}), piloto_nada)
            self.assertFalse(r['exito'])
            self.assertIn('Impacto', r['motivo'])

    def test_dos_condiciones_aterriza_siempre(self):
        for s in SEMILLAS:
            for g in GRAVEDADES:
                r = volar(Aterrizaje(s, {'gravedad': g}), piloto_dos_condiciones)
                self.assertTrue(r['exito'], (s, g, r))

    def test_proporcional_aterriza_con_estrellas(self):
        estrellas = []
        for s in SEMILLAS:
            for g in GRAVEDADES:
                r = volar(Aterrizaje(s, {'gravedad': g}), piloto_proporcional)
                self.assertTrue(r['exito'], (s, g, r))
                estrellas.append(r['estrellas'])
        self.assertGreaterEqual(sum(estrellas) / len(estrellas), 2.0)
        self.assertIn(3, estrellas)

    def test_determinista(self):
        a = volar(Aterrizaje(7, {'gravedad': 2.4}), piloto_proporcional)
        b = volar(Aterrizaje(7, {'gravedad': 2.4}), piloto_proporcional)
        self.assertEqual(a, b)

    def test_acciones(self):
        m = Aterrizaje(1)
        m.avanzar(0.5)             # un número también vale
        m.avanzar({'empuje': 3})   # se recorta a 1
        self.assertEqual(m.empuje, 1.0)
        for mala in ({'potencia': 1}, 'mucho', None, True):
            with self.assertRaises(AccionInvalida):
                Aterrizaje(1).avanzar(mala)

    def test_sin_combustible_no_hay_empuje(self):
        m = Aterrizaje(1, {'combustible': 0.1})
        m.avanzar(1)
        m.avanzar(1)
        self.assertEqual(m.empuje, 0.0)


class PruebasAsteroides(unittest.TestCase):

    def test_estrategia_sencilla_sobrevive(self):
        for s in SEMILLAS:
            m = Asteroides(s)
            r = volar(m, piloto_carril_libre)
            self.assertTrue(r['exito'], (s, r))
            self.assertGreaterEqual(r['estrellas'], 1)

    def test_quedarse_quieto_suele_estrellarse(self):
        estrellados = sum(not volar(Asteroides(s), lambda _: 'mantener')['exito'] for s in SEMILLAS)
        self.assertGreaterEqual(estrellados, 25)

    def test_generador_con_solucion_y_sensores(self):
        m = Asteroides(3, {'carriles': 5, 'duracion': 80})
        self.assertIsNotNone(m.minimo_maniobras)
        s = m.sensores()
        self.assertEqual(len(s['distancias']), 5)
        self.assertTrue(all(1 <= d <= 15 or d == 99 for d in s['distancias']))

    def test_determinista(self):
        self.assertEqual(Asteroides(11).escena(), Asteroides(11).escena())
        self.assertNotEqual(Asteroides(11).escena(), Asteroides(12).escena())

    def test_accion_invalida(self):
        with self.assertRaises(AccionInvalida):
            Asteroides(1).avanzar('arriba')


class PruebasCristales(unittest.TestCase):

    def test_bfs_al_mas_cercano_lo_recoge_todo(self):
        for s in SEMILLAS:
            r = volar(Cristales(s), piloto_cristal_cercano)
            self.assertTrue(r['exito'], (s, r))
            self.assertGreaterEqual(r['metricas']['movimientos'], r['metricas']['optimo'])

    def test_moverse_al_azar_fracasa(self):
        import random
        rng = random.Random(0)
        fracasos = sum(not volar(Cristales(s), lambda _: rng.choice('NSEO'))['exito'] for s in SEMILLAS)
        self.assertGreaterEqual(fracasos, 25)

    def test_mapa_valido(self):
        m = Cristales(5, {'filas': 7, 'columnas': 9, 'cristales': 3})
        self.assertEqual(len(m.mapa), 7)
        self.assertEqual(len(m.mapa[0]), 9)
        self.assertEqual(len(m.cristales0), 3)
        for f, c in m.cristales0 + [list(m.inicio)]:
            self.assertEqual(m.mapa[f][c], '.')

    def test_chocar_con_roca_gasta_movimiento(self):
        m = Cristales(2)
        f, c = m.posicion
        for nombre, (df, dc) in MOVIMIENTOS.items():
            nf, nc = f + df, c + dc
            fuera = not (0 <= nf < m.filas and 0 <= nc < m.columnas)
            if fuera or m.mapa[nf][nc] == '#':
                m.avanzar(nombre)
                self.assertEqual(m.posicion, [f, c])
                self.assertEqual(m.choques, 1)
                return
        self.skipTest('sin roca alrededor en esta semilla')


if __name__ == '__main__':
    unittest.main()
