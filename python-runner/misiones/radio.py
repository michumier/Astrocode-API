# -*- coding: utf-8 -*-
"""Reto 🎵 La señal de radio (fase 5.6). Diseño: docs/diseno/fase-5-retos.md §4.6

  variante "sos"      (R1) → transmitir({"nota", "repeticiones"}) devuelve la baliza SOS en morse:
                             una lista de parejas (nota, pulsos)
  variante "morse"    (R2) → transmitir({"mensaje", "nota"}) codifica cualquier mensaje con los tiempos
                             del morse y cada palabra en la siguiente nota de la ESCALA
  variante "descifrar"(R3) → recibir(senal) hace el camino inverso: una transmisión dañada (duraciones
                             imprecisas y estática) → el texto

Las listas viajan como JSON, así que las parejas llegan al alumno como listas [nota, pulsos]
(se desempaquetan igual que las tuplas) y vuelven del alumno también como listas.
"""

from .base import Mision, AccionInvalida

ESCALA = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do2', 're2', 'mi2', 'fa2', 'sol2', 'la2', 'si2']
SILENCIO, ESTATICA = 'silencio', 'estatica'
MORSE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
    'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
    'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
}
INVERSO = {codigo: letra for letra, codigo in MORSE.items()}
VARIANTES = ('sos', 'morse', 'descifrar')
MAX_ELEMENTOS = 4000
MAX_PULSOS = 16
PALABRAS_R3 = ['HOLA', 'TIERRA', 'BASE', 'LUNA', 'MARTE', 'ORBITA', 'COHETE', 'SOS', 'AGUA', 'NAVE',
               'ESTRELLA', 'COMETA', 'RADIO', 'SENAL', 'PILOTO', 'MOTOR', 'ALERTA', 'CAPSULA', '42', 'KEPLER']


# ---------------- Referencias ----------------

def sos(nota, repeticiones):
    salida = []
    for _ in range(repeticiones):
        for i, pulsos in enumerate((1, 1, 1, 3, 3, 3, 1, 1, 1)):
            if i:
                salida.append((SILENCIO, 1))
            salida.append((nota, pulsos))
        salida.append((SILENCIO, 4))
    return salida


def palabras_de(mensaje):
    """Palabras en mayúsculas sin los caracteres que no están en MORSE; las que se quedan vacías no cuentan."""
    palabras = [''.join(c for c in p if c in MORSE) for p in mensaje.upper().split()]
    return [p for p in palabras if p]


def morse(mensaje, nota):
    salida = []
    inicio = ESCALA.index(nota)
    for i, palabra in enumerate(palabras_de(mensaje)):
        sonido = ESCALA[(inicio + i) % len(ESCALA)]
        if i:
            salida.append((SILENCIO, 7))
        for j, letra in enumerate(palabra):
            if j:
                salida.append((SILENCIO, 3))
            for k, simbolo in enumerate(MORSE[letra]):
                if k:
                    salida.append((SILENCIO, 1))
                salida.append((sonido, 1 if simbolo == '.' else 3))
    return salida


def descifrar(senal):
    """La solución de R3 (la misma que el diseño): limpiar, fusionar silencios y leer con umbrales."""
    limpia = []
    for tipo, d in senal:
        if tipo == ESTATICA:
            continue
        if limpia and tipo == SILENCIO and limpia[-1][0] == SILENCIO:
            limpia[-1] = (SILENCIO, limpia[-1][1] + d)
        else:
            limpia.append((tipo, d))
    texto, letra = '', ''
    for tipo, d in limpia:
        if tipo != SILENCIO:
            letra += '.' if d <= 2 else '-'
        elif d >= 3:
            texto += INVERSO.get(letra, '?') if letra else ''
            letra = ''
            if d >= 6:
                texto += ' '
    texto += INVERSO.get(letra, '') if letra else ''
    return ' '.join(texto.split())


def danar(senal, rng, estatica=3, extremos=False, bordes=False):
    """Estropea una transmisión de R2: duraciones dentro de cada margen, estática y silencios en los bordes."""
    rangos = {('p', 1): (1, 2), ('p', 3): (3, 5), ('s', 1): (1, 2), ('s', 3): (3, 5), ('s', 7): (6, 9)}
    # Con extremos se usan los valores frontera de los umbrales (2, 3, 5 y 6)
    frontera = {('p', 1): 2, ('p', 3): 5, ('s', 1): 2, ('s', 3): 3, ('s', 7): 6}
    salida = []
    for tipo, d in senal:
        clave = ('s' if tipo == SILENCIO else 'p', d)
        bajo, alto = rangos[clave]
        nuevo = frontera[clave] if extremos and rng.random() < 0.6 else rng.randint(bajo, alto)
        if clave == ('p', 3) and extremos and rng.random() < 0.5:
            nuevo = 3
        if clave == ('s', 3) and extremos and rng.random() < 0.5:
            nuevo = 5
        salida.append([tipo, nuevo])
    # Estática: a veces parte un silencio en dos (que hay que volver a sumar), a veces va junto a un pitido
    for _ in range(estatica):
        silencios = [i for i, (t, d) in enumerate(salida) if t == SILENCIO and d >= 2]
        if silencios and rng.random() < 0.7:
            i = rng.choice(silencios)
            d = salida[i][1]
            a = rng.randint(1, d - 1)
            salida[i:i + 1] = [[SILENCIO, a], [ESTATICA, rng.randint(1, 3)], [SILENCIO, d - a]]
        else:
            pitidos = [i for i, (t, _) in enumerate(salida) if t not in (SILENCIO, ESTATICA)]
            i = rng.choice(pitidos)
            salida.insert(i + 1, [ESTATICA, rng.randint(1, 3)])
    if bordes:
        salida = [[ESTATICA, 2], [SILENCIO, rng.randint(1, 8)]] + salida + [[SILENCIO, rng.randint(1, 8)], [ESTATICA, 1]]
    return salida


def pareja(p):
    return f'("{p[0]}", {p[1]})'


class Radio(Mision):
    id = 'radio'
    funcion = 'transmitir'
    max_ticks = 1
    espera_respuesta = 3.0

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        self.variante = self.params.get('variante', 'sos')
        if self.variante not in VARIANTES:
            raise ValueError(f'Variante de radio desconocida: {self.variante}')
        self.respuesta = None
        self.diferencia = None
        if self.variante == 'sos':
            self.nota = self.params.get('nota', 'la')
            self.repeticiones = int(self.params.get('repeticiones', 3))
            self.objetivo = sos(self.nota, self.repeticiones)
        elif self.variante == 'morse':
            self.nota = self.params.get('nota', 'la')
            self.mensaje_texto = self.params.get('mensaje', 'sos')
            self.objetivo = morse(self.mensaje_texto, self.nota)
        else:
            self.funcion = 'recibir'
            if 'mensaje' in self.params:
                texto = self.params['mensaje']
            else:
                texto = ' '.join(self.rng.sample(PALABRAS_R3, self.rng.randint(2, 4)))
            self.texto = ' '.join(palabras_de(texto))
            nota = self.rng.choice(ESCALA)
            for _ in range(200):
                senal = danar(morse(self.texto, nota), self.rng, int(self.params.get('estatica', 3)),
                              bool(self.params.get('extremos')), bool(self.params.get('bordes')))
                if descifrar(senal) == self.texto:
                    break
            else:
                raise RuntimeError(f'No se pudo dañar la señal (semilla {semilla})')
            self.senal = senal

    # ---------------- Mensajes ----------------
    def sensores(self):
        return {}

    def mensaje(self):
        if self.variante == 'sos':
            return {'args': [{'nota': self.nota, 'repeticiones': self.repeticiones}]}
        if self.variante == 'morse':
            return {'args': [{'mensaje': self.mensaje_texto, 'nota': self.nota}]}
        return {'args': [[list(p) for p in self.senal]]}

    def aplicar(self, accion):
        if self.variante == 'descifrar':
            return self._aplicar_texto(accion)
        senal = self._validar(accion)
        self.respuesta = senal
        objetivo = [list(p) for p in self.objetivo]
        if senal == objetivo:
            self.terminar(True, f'📡 Transmisión perfecta: {len(senal)} sonidos y silencios, todos en su sitio')
            return
        i = next((i for i, (a, b) in enumerate(zip(senal, objetivo)) if a != b), min(len(senal), len(objetivo)))
        self.diferencia = i
        if i < len(senal) and i < len(objetivo):
            self.terminar(False, f'📻 En la posición {i} esperaba {pareja(objetivo[i])} y llegó {pareja(senal[i])}')
        elif len(senal) < len(objetivo):
            self.terminar(False, f'📻 La transmisión se corta: a partir de la posición {i} faltan {len(objetivo) - i} '
                                 f'elementos (el siguiente era {pareja(objetivo[i])})')
        else:
            self.terminar(False, f'📻 Sobran {len(senal) - i} elementos a partir de la posición {i} '
                                 f'(el primero es {pareja(senal[i])})')

    def _validar(self, accion):
        if not isinstance(accion, list):
            raise AccionInvalida(f'transmitir() tiene que devolver una lista de parejas (nota, pulsos), no {type(accion).__name__}')
        if len(accion) > MAX_ELEMENTOS:
            raise AccionInvalida(f'la lista tiene {len(accion)} elementos; el máximo es {MAX_ELEMENTOS}')
        senal = []
        for i, p in enumerate(accion):
            if not isinstance(p, list) or len(p) != 2:
                raise AccionInvalida(f'la posición {i} no es una pareja (nota, pulsos): {p!r}'[:200])
            nota, pulsos = p
            if not isinstance(nota, str) or (nota not in ESCALA and nota != SILENCIO):
                raise AccionInvalida(f'la posición {i} tiene la nota {nota!r}, que no existe: usa una de ESCALA o "silencio"'[:200])
            if isinstance(pulsos, bool) or not isinstance(pulsos, int) or not 1 <= pulsos <= MAX_PULSOS:
                raise AccionInvalida(f'la posición {i} dura {pulsos!r} pulsos: tiene que ser un número entero del 1 al {MAX_PULSOS}'[:200])
            senal.append([nota, pulsos])
        return senal

    def _aplicar_texto(self, accion):
        if not isinstance(accion, str):
            raise AccionInvalida(f'recibir() tiene que devolver el texto descifrado (un str), no {type(accion).__name__}')
        texto = ' '.join(accion.upper().split())
        self.respuesta = texto
        if texto == self.texto:
            self.terminar(True, f'📡 Mensaje descifrado: «{self.texto}»')
            return
        i = next((i for i, (a, b) in enumerate(zip(texto, self.texto)) if a != b), min(len(texto), len(self.texto)))
        self.diferencia = i
        self.terminar(False, f'📻 Descifraste «{texto[:80]}», pero el mensaje era «{self.texto}» '
                             f'(la primera diferencia está en la posición {i})')

    # ---------------- Visor ----------------
    def fotograma(self):
        if self.fin is None:
            return {'fase': 'inicio'}
        # Solo viaja en escenarios visibles
        datos = {'fase': 'fin', 'respuesta': self.respuesta, 'diferencia': self.diferencia}
        if self.variante == 'descifrar':
            datos['esperado'] = self.texto
        else:
            datos['objetivo'] = [list(p) for p in self.objetivo]
        return datos

    def escena(self):
        return self.material()

    def material(self):
        if self.variante == 'sos':
            return {'variante': 'sos', 'nota': self.nota, 'repeticiones': self.repeticiones,
                    'objetivo': [list(p) for p in self.objetivo]}
        if self.variante == 'morse':
            return {'variante': 'morse', 'mensaje': self.mensaje_texto, 'nota': self.nota,
                    'objetivo': [list(p) for p in self.objetivo]}
        # En R3 se ve la señal dañada que llega (el texto es lo que hay que descifrar)
        return {'variante': 'descifrar', 'senal': [list(p) for p in self.senal]}

    def estrellas(self):
        return 3
