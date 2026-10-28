# -*- coding: utf-8 -*-
"""
Pruebas del reto 🎵 La señal de radio (fase 5.6).
La lógica se prueba en cualquier sistema; la ejecución real necesita Linux (contenedor del runner):
    docker run --rm -v "$PWD":/src -w /src <imagen-del-runner> python -m unittest test_radio
"""

import random
import sys
import unittest

from misiones.radio import ESCALA, MORSE, Radio, danar, descifrar, morse, palabras_de, sos
from misiones.motor import ejecutar_escenario, material_reto

CABECERA = f'ESCALA = {ESCALA!r}\nMORSE = {MORSE!r}\n'

SOS = '''
def transmitir(senal):
    salida = []
    for _ in range(senal["repeticiones"]):
        for i, pulsos in enumerate([1, 1, 1, 3, 3, 3, 1, 1, 1]):
            if i > 0:
                salida.append(("silencio", 1))
            salida.append((senal["nota"], pulsos))
        salida.append(("silencio", 4))
    return salida
'''
TRANSMISOR = CABECERA + '''
def transmitir(senal):
    palabras = []
    for palabra in senal["mensaje"].upper().split():
        limpia = [c for c in palabra if c in MORSE]
        if limpia:
            palabras.append(limpia)
    inicio = ESCALA.index(senal["nota"])
    salida = []
    for i, palabra in enumerate(palabras):
        nota = ESCALA[(inicio + i) % len(ESCALA)]
        if i > 0:
            salida.append(("silencio", 7))
        for j, letra in enumerate(palabra):
            if j > 0:
                salida.append(("silencio", 3))
            for k, simbolo in enumerate(MORSE[letra]):
                if k > 0:
                    salida.append(("silencio", 1))
                salida.append((nota, 1 if simbolo == "." else 3))
    return salida
'''
RECEPTOR = CABECERA + '''
INVERSO = {codigo: letra for letra, codigo in MORSE.items()}

def recibir(senal):
    limpia = []
    for tipo, d in senal:
        if tipo == "estatica":
            continue
        if limpia and tipo == "silencio" and limpia[-1][0] == "silencio":
            limpia[-1] = ("silencio", limpia[-1][1] + d)
        else:
            limpia.append((tipo, d))
    texto, letra = "", ""
    for tipo, d in limpia:
        if tipo != "silencio":
            letra += "." if d <= 2 else "-"
        elif d >= 3:
            texto += INVERSO.get(letra, "?") if letra else ""
            letra = ""
            if d >= 6:
                texto += " "
    texto += INVERSO.get(letra, "") if letra else ""
    return texto.strip()
'''
# Errores típicos: sin la vuelta de la escala, sin quitar los signos, sin fusionar los silencios, umbral mal puesto
TRANSMISOR_SIN_VUELTA = TRANSMISOR.replace('ESCALA[(inicio + i) % len(ESCALA)]', 'ESCALA[min(inicio + i, len(ESCALA) - 1)]')
TRANSMISOR_CON_SIGNOS = TRANSMISOR.replace('limpia = [c for c in palabra if c in MORSE]', 'limpia = list(palabra)').replace(
    'MORSE[letra]', 'MORSE.get(letra, "")')
RECEPTOR_SIN_FUSIONAR = RECEPTOR.replace('if limpia and tipo == "silencio" and limpia[-1][0] == "silencio":', 'if False:')
RECEPTOR_UMBRAL = RECEPTOR.replace('if d >= 6:', 'if d >= 7:')

SEMBRADOS = [
    (471, {'variante': 'sos', 'nota': 'la', 'repeticiones': 3}), (472, {'variante': 'sos', 'nota': 'do2', 'repeticiones': 2}),
    (9471, {'variante': 'sos', 'nota': 'sol', 'repeticiones': 1}), (9472, {'variante': 'sos', 'nota': 'si2', 'repeticiones': 4}),
    (9473, {'variante': 'sos', 'nota': 'do', 'repeticiones': 5}), (9474, {'variante': 'sos', 'nota': 'mi', 'repeticiones': 2}),
    (481, {'variante': 'morse', 'mensaje': 'SOS', 'nota': 'la'}), (482, {'variante': 'morse', 'mensaje': 'hola  tierra', 'nota': 'si2'}),
    (9481, {'variante': 'morse', 'mensaje': 'e', 'nota': 'do'}),
    (9482, {'variante': 'morse', 'mensaje': 'buenos  dias   tripulacion', 'nota': 'mi'}),
    (9483, {'variante': 'morse', 'mensaje': '¿hola, mundo! ¡¡ !!', 'nota': 'sol'}),
    (9484, {'variante': 'morse', 'mensaje': 'a b c d e f g h i j k l m n o p', 'nota': 're'}),
    (9485, {'variante': 'morse', 'mensaje': 'mision 42 completada', 'nota': 'fa2'}),
    (491, {'variante': 'descifrar', 'mensaje': 'SOS', 'estatica': 1}), (492, {'variante': 'descifrar', 'mensaje': 'HOLA TIERRA'}),
    (9491, {'variante': 'descifrar'}), (9492, {'variante': 'descifrar', 'bordes': True}),
    (9493, {'variante': 'descifrar', 'extremos': True}), (9494, {'variante': 'descifrar', 'extremos': True, 'bordes': True}),
    (9495, {'variante': 'descifrar', 'estatica': 8}), (9496, {'variante': 'descifrar', 'mensaje': 'E T 5 0', 'extremos': True}),
]


class PruebasLogica(unittest.TestCase):
    def test_ejemplos_del_diseno(self):
        self.assertEqual(morse('et a', 'si2'), [('si2', 1), ('silencio', 3), ('si2', 3), ('silencio', 7),
                                                ('do', 1), ('silencio', 1), ('do', 3)])
        self.assertEqual(descifrar([('la', 2), ('silencio', 2), ('estatica', 1), ('silencio', 2), ('la', 4)]), 'ET')

    def test_sos(self):
        una = sos('la', 1)
        self.assertEqual([d for n, d in una if n == 'la'], [1, 1, 1, 3, 3, 3, 1, 1, 1])
        self.assertEqual(una[-1], ('silencio', 4))
        self.assertEqual(len(sos('la', 3)), 3 * len(una))

    def test_palabras_ignoran_signos_y_espacios(self):
        self.assertEqual(palabras_de('¿hola,  mundo! ¡¡ !!'), ['HOLA', 'MUNDO'])

    def test_vuelta_de_la_escala(self):
        notas = [n for n, _ in morse('a b c d e f g h i j k l m n o p', 're') if n != 'silencio']
        self.assertEqual(notas[0], 're')
        self.assertIn('do', notas)  # tras si2 vuelve a do

    def test_descifrar_cientos_de_senales_danadas(self):
        rng = random.Random(5)
        for _ in range(300):
            texto = ' '.join(rng.choice(['SOS', 'HOLA', 'TIERRA', '42', 'E', 'T', 'KEPLER']) for _ in range(rng.randint(1, 4)))
            senal = danar(morse(texto, rng.choice(ESCALA)), rng, rng.randint(0, 6), rng.random() < 0.5, rng.random() < 0.5)
            self.assertEqual(descifrar(senal), texto)

    def test_extremos_usan_las_fronteras(self):
        senal = Radio(9494, SEMBRADOS[18][1]).senal
        duraciones = {d for t, d in senal if t != 'estatica'}
        self.assertTrue({2, 3, 5, 6} <= duraciones, duraciones)
        self.assertEqual(senal[0][0], 'estatica')

    def test_escenarios_sembrados(self):
        for semilla, params in SEMBRADOS:
            a, b = Radio(semilla, params), Radio(semilla, params)
            self.assertEqual(a.material(), b.material())
            if params['variante'] == 'descifrar':
                self.assertEqual(descifrar(a.senal), a.texto)
                self.assertEqual(a.funcion, 'recibir')

    def test_material(self):
        m = material_reto('radio', [{'semilla': 491, 'params': SEMBRADOS[13][1]}])[0]['material']
        self.assertEqual(set(m), {'variante', 'senal'})
        m = material_reto('radio', [{'semilla': 482, 'params': SEMBRADOS[7][1]}])[0]['material']
        self.assertEqual(set(m), {'variante', 'mensaje', 'nota', 'objetivo'})


@unittest.skipUnless(sys.platform.startswith('linux'), 'necesita Linux (contenedor)')
class PruebasEjecucion(unittest.TestCase):

    def ejecutar(self, codigo, semilla, params, detalle=False):
        return ejecutar_escenario(codigo, 'radio', {'semilla': semilla, 'params': params}, con_detalle=detalle)

    def test_soluciones_superan_todos_los_escenarios(self):
        codigos = {'sos': SOS, 'morse': TRANSMISOR, 'descifrar': RECEPTOR}
        for semilla, params in SEMBRADOS:
            r = self.ejecutar(codigos[params['variante']], semilla, params)
            self.assertTrue(r['exito'], (semilla, params, r['motivo']))
            self.assertEqual(r['estrellas'], 3)

    def test_primera_diferencia(self):
        # Un silencio de 1 entre letras en lugar de 3
        mal = TRANSMISOR.replace('salida.append(("silencio", 3))', 'salida.append(("silencio", 1))')
        r = self.ejecutar(mal, *SEMBRADOS[6], detalle=True)
        self.assertFalse(r['exito'])
        self.assertIn('En la posición 5 esperaba ("silencio", 3) y llegó ("silencio", 1)', r['motivo'])
        self.assertEqual(r['fotogramas'][-1]['diferencia'], 5)

    def test_corta_y_sobra(self):
        corta = SOS.replace('salida.append(("silencio", 4))', 'pass')
        self.assertIn('faltan', self.ejecutar(corta, *SEMBRADOS[2])['motivo'])
        larga = SOS.replace('return salida', 'return salida + [("la", 1)]')
        self.assertIn('Sobran 1 elementos', self.ejecutar(larga, *SEMBRADOS[2])['motivo'])

    def test_errores_tipicos_fallan_en_los_ocultos(self):
        self.assertFalse(self.ejecutar(TRANSMISOR_SIN_VUELTA, *SEMBRADOS[11])['exito'])
        self.assertFalse(self.ejecutar(TRANSMISOR_CON_SIGNOS, *SEMBRADOS[10])['exito'])
        for codigo in (RECEPTOR_SIN_FUSIONAR, RECEPTOR_UMBRAL):
            fallos = [s for s, p in SEMBRADOS[15:] if not self.ejecutar(codigo, s, p)['exito']]
            self.assertTrue(fallos, codigo[-200:])

    def test_validacion(self):
        casos = [
            ('return "SOS"', 'lista de parejas'),
            ('return [("la", 1, 2)]', 'no es una pareja'),
            ('return [("fa#", 1)]', 'que no existe'),
            ('return [("la", 0)]', 'del 1 al 16'),
            ('return [("la", 1.5)]', 'del 1 al 16'),
            ('return [("la", 1)] * 5000', 'el máximo es 4000'),
        ]
        for cuerpo, texto in casos:
            r = self.ejecutar(f'def transmitir(senal):\n    {cuerpo}\n', *SEMBRADOS[0])
            self.assertFalse(r['exito'])
            self.assertIn(texto, r['motivo'], cuerpo)

    def test_r3_texto(self):
        r = self.ejecutar('def recibir(senal):\n    return "  hola   tierra "\n', *SEMBRADOS[14], detalle=True)
        self.assertTrue(r['exito'], r['motivo'])
        r = self.ejecutar('def recibir(senal):\n    return "HOLA TIERRO"\n', *SEMBRADOS[14], detalle=True)
        self.assertFalse(r['exito'])
        self.assertIn('posición 10', r['motivo'])
        self.assertEqual(r['fotogramas'][-1]['esperado'], 'HOLA TIERRA')
        r = self.ejecutar('def transmitir(senal):\n    return ""\n', *SEMBRADOS[14])
        self.assertIn('recibir', r['motivo'])


if __name__ == '__main__':
    unittest.main()
