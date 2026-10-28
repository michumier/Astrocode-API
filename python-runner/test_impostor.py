# -*- coding: utf-8 -*-
"""
Pruebas del reto 🔍 Hay un impostor a bordo (fase 5.4).
La lógica se prueba en cualquier sistema; la ejecución real necesita Linux (contenedor del runner):
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_impostor
"""

import re
import sys
import unittest

from misiones.impostor import (Impostor, distancias, leer_apagon, sospechosos_apagon,
                               sospechosos_reactor, MIN_PASILLO)
from misiones.motor import ejecutar_escenario, material_reto

REACTOR = '''
def investigar(log):
    nombres, sala_de = {}, {}
    for linea in log.splitlines():
        if not linea.startswith("["):
            continue
        partes = linea.split()
        tipo = partes[1]
        if tipo == "TRIPULACION":
            nombres[partes[2]] = partes[3]
            sala_de[partes[2]] = "comedor"
        elif tipo == "PUERTA" and partes[2] in nombres and partes[-1] != "DENEGADO":
            sala_de[partes[2]] = partes[5]
        elif tipo == "ALERTA" and partes[2] == "SABOTAJE":
            return [nombres[t] for t, s in sala_de.items() if s == partes[3]][0]
'''
# Errores típicos: olvidar el DENEGADO y buscar "->" en cualquier línea
REACTOR_SIN_DENEGADO = REACTOR.replace(' and partes[-1] != "DENEGADO"', '')
REACTOR_FLECHA = '''
def investigar(log):
    nombres, sala_de = {}, {}
    for linea in log.splitlines():
        partes = linea.split()
        if "TRIPULACION" in linea:
            nombres[partes[2]] = partes[3]
            sala_de[partes[2]] = "comedor"
        elif "->" in linea and partes[2] in nombres and "DENEGADO" not in linea:
            sala_de[partes[2]] = partes[5]
        elif "SABOTAJE" in linea:
            return [nombres[t] for t, s in sala_de.items() if s == partes[3]][0]
'''

APAGON = '''
from collections import deque

def minutos(marca):
    hh, mm = marca.strip("[]").split(":")
    return int(hh) * 60 + int(mm)

def distancias(mapa, origen):
    dist = {origen: 0}
    cola = deque([origen])
    while cola:
        sala = cola.popleft()
        for vecina in mapa[sala]:
            if vecina not in dist:
                dist[vecina] = dist[sala] + 1
                cola.append(vecina)
    return dist

def investigar(log):
    nombres, sala_de, despues, mapa = {}, {}, {}, {}
    for linea in log.splitlines():
        if not linea.startswith("["):
            continue
        partes = linea.split()
        tipo = partes[1]
        if tipo == "TRIPULACION":
            nombres[partes[2]] = partes[3]
            sala_de[partes[2]] = "comedor"
        elif tipo == "PUERTA":
            a, b = partes[3], partes[5]
            mapa.setdefault(a, set()).add(b)
            mapa.setdefault(b, set()).add(a)
            if partes[2] in nombres and partes[-1] != "DENEGADO":
                sala_de[partes[2]] = b
        elif tipo == "ERROR":
            apagado = minutos(partes[0])
            antes = dict(sala_de)
        elif tipo == "ALERTA":
            crimen, sala = minutos(partes[0]), partes[3]
        elif tipo == "INFO":
            restaurado = minutos(partes[0])
        elif tipo == "RECUENTO":
            despues[partes[2]] = partes[3]
    dist = distancias(mapa, sala)
    for tarjeta, nombre in nombres.items():
        if 2 * dist[antes[tarjeta]] <= crimen - apagado and 2 * dist[despues[tarjeta]] <= restaurado - crimen:
            return nombre
'''
APAGON_ESTRICTO = APAGON.replace('<= crimen - apagado', '< crimen - apagado').replace('<= restaurado - crimen', '< restaurado - crimen')

# Escenarios de src/db/seeds/retos.ts (visibles y ocultos)
SEMBRADOS = [
    (431, {'variante': 'reactor', 'trampas': ['denegado']}), (432, {'variante': 'reactor'}),
    (9431, {'variante': 'reactor'}), (9432, {'variante': 'reactor'}),
    (9433, {'variante': 'reactor', 'duracion': 120}), (9434, {'variante': 'reactor', 'duracion': 180}),
    (9435, {'variante': 'reactor'}), (9436, {'variante': 'reactor', 'duracion': 200}),
    (441, {'variante': 'apagon', 'trampas': ['justo']}), (442, {'variante': 'apagon'}),
    (9441, {'variante': 'apagon'}), (9442, {'variante': 'apagon'}),
    (9443, {'variante': 'apagon', 'duracion': 120}), (9444, {'variante': 'apagon', 'duracion': 180}),
    (9445, {'variante': 'apagon'}), (9446, {'variante': 'apagon', 'duracion': 200}),
]

GRAMATICA = re.compile(
    r'^\[\d\d:\d\d\] (TRIPULACION K-\d{3} \w+'
    r'|PUERTA (K-\d{3}|dron-\d) \w+ -> \w+( DENEGADO)?'
    r'|ENERGIA \w+ \d+%'
    r'|COMMS K-\d{3} "[^"]*"'
    r'|MANTENIMIENTO dron-\d [\w ]+ en \w+'
    r'|ALERTA SABOTAJE \w+'
    r'|ERROR registro de puertas desactivado'
    r'|INFO registro de puertas restaurado'
    r'|RECUENTO K-\d{3} \w+)$'
)


class PruebasLogica(unittest.TestCase):
    def test_ejemplo_del_diseno_bfs(self):
        mapa = {'comedor': {'hangar'}, 'hangar': {'comedor', 'laboratorio'},
                'laboratorio': {'hangar', 'reactor', 'puente'}, 'reactor': {'laboratorio'}, 'puente': {'laboratorio'}}
        self.assertEqual(distancias(mapa, 'reactor'), {'reactor': 0, 'laboratorio': 1, 'hangar': 2, 'puente': 2, 'comedor': 3})

    def test_todas_las_lineas_cumplen_la_gramatica(self):
        for semilla, params in SEMBRADOS:
            for linea in Impostor(semilla, params).lineas[1:]:
                self.assertRegex(linea, GRAMATICA, (semilla, linea))

    def test_escenarios_sembrados_deterministas_y_con_culpable_unico(self):
        for semilla, params in SEMBRADOS:
            a, b = Impostor(semilla, params), Impostor(semilla, params)
            self.assertEqual(a.log, b.log)
            resolver = sospechosos_reactor if params['variante'] == 'reactor' else sospechosos_apagon
            self.assertEqual(resolver(a.log), [a.nombre[a.culpable]], semilla)
            self.assertTrue(800 <= len(a.lineas) <= 3000, len(a.lineas))

    def test_unicidad_en_muchas_semillas(self):
        for semilla in range(300):
            r = Impostor(semilla, {'variante': 'reactor'})
            self.assertEqual(sospechosos_reactor(r.log), [r.nombre[r.culpable]])
            a = Impostor(semilla, {'variante': 'apagon'})
            self.assertEqual(sospechosos_apagon(a.log), [a.nombre[a.culpable]])

    def test_trampas_del_reactor_muerden(self):
        for semilla, params in SEMBRADOS[2:8]:
            m = Impostor(semilla, params)
            culpable = [m.nombre[m.culpable]]
            self.assertNotEqual(sospechosos_reactor(m.log, ignorar_denegadas=True), culpable)
            self.assertNotEqual(sospechosos_reactor(m.log, por_minuto=True), culpable)
            # Un dron pasa por la sala del crimen antes de la alerta
            antes = m.lineas[:m.linea_alerta]
            self.assertTrue(any(re.search(rf'PUERTA dron-\d \w+ -> {m.sala}$|MANTENIMIENTO dron-\d .* en {m.sala}$', l)
                                for l in antes[-12:]))

    def test_trampas_del_apagon_muerden(self):
        for semilla, params in SEMBRADOS[9:]:
            m = Impostor(semilla, params)
            culpable = [m.nombre[m.culpable]]
            self.assertNotEqual(sospechosos_apagon(m.log, estricto=True), culpable)
            self.assertNotEqual(sospechosos_apagon(m.log, ignorar_denegadas=True), culpable)
            a, b = m.prohibido
            self.assertFalse(any(re.search(rf'PUERTA \S+ ({a} -> {b}|{b} -> {a})$', l) for l in m.lineas))
            self.assertTrue(any(re.search(rf'PUERTA \S+ ({a} -> {b}|{b} -> {a}) DENEGADO$', l) for l in m.lineas))

    def test_el_mapa_deducido_es_la_estacion(self):
        for semilla, params in SEMBRADOS[8:]:
            m = Impostor(semilla, params)
            mapa = leer_apagon(m.log)['vecinos']
            self.assertEqual({tuple(sorted((a, b))) for a in mapa for b in mapa[a]}, set(m.pasillos))

    def test_el_tiempo_cumple_los_dos_minutos_por_pasillo(self):
        m = Impostor(442, {'variante': 'apagon'})
        d = leer_apagon(m.log)
        for t in m.tripulacion:
            dist = distancias(d['vecinos'], d['antes'][t])
            self.assertLessEqual(MIN_PASILLO * dist[d['despues'][t]], d['restaurado'] - d['apagado'])

    def test_material(self):
        r = Impostor(431, {'variante': 'reactor', 'trampas': ['denegado']}).material()
        self.assertEqual(set(r), {'variante', 'lineas', 'log', 'salas', 'pasillos'})
        a = material_reto('impostor', [{'semilla': 441, 'params': {'variante': 'apagon', 'trampas': ['justo']}}])[0]['material']
        # En I2 el mapa no se da: deducirlo es parte del reto
        self.assertEqual(set(a), {'variante', 'lineas', 'log'})


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasEjecucion(unittest.TestCase):

    def ejecutar(self, codigo, semilla, params, detalle=False):
        return ejecutar_escenario(codigo, 'impostor', {'semilla': semilla, 'params': params}, con_detalle=detalle)

    def test_soluciones_resuelven_todos_los_escenarios_sembrados(self):
        for semilla, params in SEMBRADOS:
            codigo = REACTOR if params['variante'] == 'reactor' else APAGON
            r = self.ejecutar(codigo, semilla, params)
            self.assertTrue(r['exito'], (semilla, params, r['motivo']))
            self.assertEqual(r['estrellas'], 3)

    def test_errores_tipicos_fallan_en_los_ocultos(self):
        for codigo in (REACTOR_SIN_DENEGADO, REACTOR_FLECHA):
            fallos = [s for s, p in SEMBRADOS[2:8] if not self.ejecutar(codigo, s, p)['exito']]
            self.assertTrue(fallos, codigo[:60])
        fallos = [s for s, p in SEMBRADOS[10:] if not self.ejecutar(APAGON_ESTRICTO, s, p)['exito']]
        self.assertEqual(len(fallos), 6)

    def test_fallo_explica_donde_estaba_el_acusado(self):
        m = Impostor(432, {'variante': 'reactor'})
        inocente = next(t for t in m.tripulacion if t != m.culpable)
        r = self.ejecutar(f'def investigar(log):\n    return "{m.nombre[inocente]}"\n', 432, {'variante': 'reactor'}, detalle=True)
        self.assertFalse(r['exito'])
        self.assertRegex(r['motivo'], rf'{m.nombre[inocente]} estaba en el \w+ en la alerta \(línea [\d.]+\)')
        final = r['fotogramas'][-1]
        self.assertEqual(final['culpable'], m.nombre[m.culpable])
        self.assertEqual(len(final['tripulantes']), 6)

    def test_respuestas_raras(self):
        m = Impostor(431, {'variante': 'reactor', 'trampas': ['denegado']})
        p = {'variante': 'reactor', 'trampas': ['denegado']}
        tarjeta = self.ejecutar(f'def investigar(log):\n    return "{m.culpable}"\n', 431, p)
        self.assertIn('tarjeta', tarjeta['motivo'])
        mayusculas = self.ejecutar(f'def investigar(log):\n    return "  {m.nombre[m.culpable].upper()} "\n', 431, p)
        self.assertTrue(mayusculas['exito'])
        lista = self.ejecutar('def investigar(log):\n    return ["Vega"]\n', 431, p)
        self.assertFalse(lista['exito'])
        self.assertIn('NOMBRE', lista['motivo'])

    def test_apagon_visor_con_rutas(self):
        r = self.ejecutar(APAGON, 441, {'variante': 'apagon', 'trampas': ['justo']}, detalle=True)
        final = r['fotogramas'][-1]
        self.assertEqual([t['nombre'] for t in final['tripulantes'] if t['pudo']], [final['culpable']])
        for t in final['tripulantes']:
            self.assertEqual(len(t['ruta_ida']) - 1, t['ida'] // MIN_PASILLO)
            self.assertEqual(t['ruta_ida'][-1], final['sala'])
        self.assertEqual(len(r['escena']['pasillos']), len(Impostor(441, {'variante': 'apagon', 'trampas': ['justo']}).pasillos))


if __name__ == '__main__':
    unittest.main()
