# -*- coding: utf-8 -*-
"""Reto 🔐 La cámara acorazada (fase 5.3). Diseño: docs/diseno/fase-5-retos.md §4.3

El alumno escribe abrir(caja). Tres cámaras, tres estrategias:
  variante "huella"      (C1) → caja es un dict con la huella SHA-256 del PIN y, a veces, una lista de
                                candidatos: hay que probar (fuerza bruta) y devolver el PIN
  variante "binaria"     (C2) → caja.probar(n) responde "mayor", "menor" o "abierta"; a los
                                maximo.bit_length() intentos salta la alarma (búsqueda binaria)
  variante "combinacion" (C3) → caja.probar("0123") responde {"exactos", "descolocados"} o "abierta";
                                10 intentos (deducción filtrando las combinaciones posibles)

En C2 y C3 el secreto vive solo en este proceso: el alumno recibe un objeto remoto cuyas
consultas contesta el motor (ampliación E4).
"""

import hashlib
from itertools import permutations

from .base import Mision, AccionInvalida

VARIANTES = ('huella', 'binaria', 'combinacion')
INTENTOS_COMBINACION = 10
COMBINACIONES = [''.join(p) for p in permutations('0123456789', 4)]


def huella(texto):
    return hashlib.sha256(texto.encode()).hexdigest()


def comparar(intento, secreto):
    exactos = sum(a == b for a, b in zip(intento, secreto))
    comunes = len(set(intento) & set(secreto))
    return {'exactos': exactos, 'descolocados': comunes - exactos}


class Camara(Mision):
    id = 'camara'
    funcion = 'abrir'
    max_ticks = 1

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        self.variante = self.params.get('variante', 'huella')
        if self.variante not in VARIANTES:
            raise ValueError(f'Variante de cámara desconocida: {self.variante}')
        self.historial = []
        self.abierta = False
        self.respuesta = None
        getattr(self, f'_preparar_{self.variante}')()
        if self.variante != 'huella':
            # Con objeto remoto la función puede no devolver nada: lo que cuenta es si se abrió
            self.admite_none = True
            self.espera_respuesta = 5.0
        else:
            self.espera_respuesta = 4.0

    # ---------------- C1: huella (fuerza bruta) ----------------
    def _preparar_huella(self):
        self.cifras = int(self.params.get('cifras', 4))
        total = 10 ** self.cifras
        self.pin = str(self.params['pin']) if 'pin' in self.params else f'{self.rng.randrange(total):0{self.cifras}d}'
        n = self.params.get('candidatos')
        if n:
            otros = set()
            while len(otros) < int(n) - 1:
                c = f'{self.rng.randrange(total):0{self.cifras}d}'
                if c != self.pin:
                    otros.add(c)
            lista = sorted(otros)
            self.rng.shuffle(lista)
            posicion = self.params.get('posicion')
            i = 0 if posicion == 'inicio' else len(lista) if posicion == 'fin' else self.rng.randint(0, len(lista))
            lista.insert(i, self.pin)
            if self.params.get('repetido'):
                lista.insert(self.rng.randint(i + 1, len(lista)), self.pin)
            self.candidatos = lista
        else:
            self.candidatos = None
        self.huella = huella(self.pin)

    def _caja_huella(self):
        return {'huella': self.huella, 'candidatos': list(self.candidatos) if self.candidatos else None, 'cifras': self.cifras}

    # ---------------- C2: búsqueda binaria ----------------
    def _preparar_binaria(self):
        self.minimo = 1
        self.maximo = max(int(self.params.get('maximo', 1000)), 2)
        self.intentos = self.maximo.bit_length()
        self.secreto = int(self.params['secreto']) if 'secreto' in self.params else self.rng.randint(1, self.maximo)
        self.bajo, self.alto = self.minimo, self.maximo

    # ---------------- C3: combinación ----------------
    def _preparar_combinacion(self):
        self.intentos = INTENTOS_COMBINACION
        self.secreto = str(self.params['secreto']) if 'secreto' in self.params else self.rng.choice(COMBINACIONES)
        self.posibles = list(COMBINACIONES)

    # ---------------- Mensajes ----------------
    def sensores(self):
        return {}

    def mensaje(self):
        if self.variante == 'huella':
            return {'args': [self._caja_huella()]}
        if self.variante == 'binaria':
            atributos = {'minimo': self.minimo, 'maximo': self.maximo, 'intentos': self.intentos}
        else:
            atributos = {'cifras': 4, 'intentos': self.intentos}
        return {'remoto': {'atributos': atributos, 'metodos': ['probar']}}

    def consultar(self, metodo, args):
        if self.variante == 'huella':
            raise AccionInvalida('esta cámara no tiene método probar: devuelve el PIN')
        if metodo != 'probar' or len(args) != 1:
            raise AccionInvalida('la caja solo tiene el método probar(valor), con un único valor')
        if self.abierta:
            return {'respuesta': 'abierta'}
        if len(self.historial) >= self.intentos:
            self.terminar(False, f'🚨 Saltó la alarma: agotaste los {self.intentos} intentos sin abrir')
            return {'excepcion': f'¡Alarma! Has agotado los {self.intentos} intentos', 'tipo': 'Alarma'}
        valor = args[0]
        if self.variante == 'binaria':
            return {'respuesta': self._probar_binaria(valor)}
        return {'respuesta': self._probar_combinacion(valor)}

    def _probar_binaria(self, n):
        if isinstance(n, bool) or not isinstance(n, int) or not self.minimo <= n <= self.maximo:
            self.historial.append({'valor': repr(n)[:30], 'respuesta': 'invalido', 'bajo': self.bajo, 'alto': self.alto})
            return 'invalido'
        if n == self.secreto:
            self.abierta = True
            respuesta = 'abierta'
            self.bajo = self.alto = n
        elif self.secreto > n:
            respuesta = 'mayor'
            self.bajo = max(self.bajo, n + 1)
        else:
            respuesta = 'menor'
            self.alto = min(self.alto, n - 1)
        self.historial.append({'valor': n, 'respuesta': respuesta, 'bajo': self.bajo, 'alto': self.alto})
        return respuesta

    def _probar_combinacion(self, intento):
        valido = isinstance(intento, str) and len(intento) == 4 and intento.isdigit() and len(set(intento)) == 4
        if not valido:
            self.historial.append({'valor': repr(intento)[:30], 'respuesta': 'invalido', 'posibles': len(self.posibles)})
            return 'invalido'
        if intento == self.secreto:
            self.abierta = True
            self.posibles = [intento]
            self.historial.append({'valor': intento, 'respuesta': 'abierta', 'posibles': 1})
            return 'abierta'
        respuesta = comparar(intento, self.secreto)
        self.posibles = [p for p in self.posibles if comparar(intento, p) == respuesta]
        self.historial.append({'valor': intento, 'respuesta': respuesta, 'posibles': len(self.posibles)})
        return respuesta

    # ---------------- Respuesta final ----------------
    def aplicar(self, accion):
        if self.variante == 'huella':
            if not isinstance(accion, str):
                if isinstance(accion, int) and not isinstance(accion, bool):
                    raise AccionInvalida(f'Devuelve el PIN como texto ("{accion:0{self.cifras}d}"), no como número')
                raise AccionInvalida(f'Devuelve el PIN como texto, no {accion!r}'[:200])
            self.respuesta = accion
            if accion == self.pin:
                self.abierta = True
                self.terminar(True, f'🔓 Abierta: el PIN era {self.pin}')
            else:
                self.terminar(False, f'🔒 «{accion}» no es el PIN (su huella no coincide)')
            return
        self.respuesta = accion
        n = len(self.historial)
        if self.abierta:
            self.terminar(True, f'🔓 Abierta en {n} intento{"s" if n != 1 else ""} (límite {self.intentos})')
        else:
            self.terminar(False, f'🔒 Tu función terminó sin abrir la cámara ({n} intento{"s" if n != 1 else ""})')

    # ---------------- Visor ----------------
    def fotograma(self):
        if self.fin is None and not self.historial:
            return {'fase': 'inicio'}
        datos = {'fase': 'fin', 'abierta': self.abierta, 'historial': self.historial}
        # Solo viaja en escenarios visibles: tras el intento se enseña el secreto
        if self.variante == 'huella':
            datos['pin'] = self.pin
            datos['respuesta'] = self.respuesta if isinstance(self.respuesta, str) else None
            datos['probados'] = (self.candidatos.index(self.pin) + 1) if self.candidatos else int(self.pin) + 1
        else:
            datos['secreto'] = self.secreto
        return datos

    def escena(self):
        return self.material()

    def material(self):
        if self.variante == 'huella':
            return {'variante': 'huella', **self._caja_huella()}
        if self.variante == 'binaria':
            return {'variante': 'binaria', 'minimo': self.minimo, 'maximo': self.maximo, 'intentos': self.intentos}
        return {'variante': 'combinacion', 'cifras': 4, 'intentos': self.intentos, 'combinaciones': len(COMBINACIONES)}

    def metricas(self):
        if self.variante == 'huella':
            return {}
        return {'intentos': len(self.historial), 'limite': self.intentos}

    def estrellas(self):
        if self.variante != 'combinacion':
            return 3
        n = len(self.historial)
        return 3 if n <= 7 else 2 if n <= 8 else 1
