# -*- coding: utf-8 -*-
"""Clase base de las misiones de pilotaje.

Una misión es una simulación determinista (misma semilla + mismo piloto = mismo resultado).
El motor le pide los sensores, se los pasa al piloto del alumno (en otro proceso),
y aplica la acción que devuelve. El alumno nunca toca este objeto.
"""

import random


class AccionInvalida(Exception):
    """El piloto devolvió algo que la misión no entiende."""


class Mision:
    id = ''
    max_ticks = 1000

    def __init__(self, semilla, params=None):
        self.semilla = int(semilla)
        self.rng = random.Random(self.semilla)
        self.params = dict(params or {})
        self.tick = 0
        self.fin = None  # dict con el resultado cuando termina

    # --- A implementar por cada misión ---
    def sensores(self):
        raise NotImplementedError

    def aplicar(self, accion):
        """Aplica la acción del tick actual (lanza AccionInvalida si no vale)."""
        raise NotImplementedError

    def fotograma(self):
        """Estado reducido del tick actual para el visor."""
        raise NotImplementedError

    def escena(self):
        """Datos estáticos para dibujar (terreno, mapa...)."""
        return {}

    def estrellas(self):
        """1-3 si se completó con éxito."""
        return 1

    def metricas(self):
        return {}

    # --- Comunes ---
    def terminado(self):
        return self.fin is not None

    def terminar(self, exito, motivo):
        if self.fin is None:
            self.fin = {'exito': bool(exito), 'motivo': motivo}

    def avanzar(self, accion):
        self.aplicar(accion)
        self.tick += 1
        if self.fin is None and self.tick >= self.max_ticks:
            self.terminar(False, self.motivo_tiempo_agotado())

    def motivo_tiempo_agotado(self):
        return f'Se acabó el tiempo de la misión ({self.max_ticks} ticks)'

    def resultado(self):
        fin = self.fin or {'exito': False, 'motivo': 'La misión no terminó'}
        return {
            'exito': fin['exito'],
            'motivo': fin['motivo'],
            'ticks': self.tick,
            'estrellas': self.estrellas() if fin['exito'] else 0,
            'metricas': self.metricas(),
        }


def numero(valor, nombre):
    """Convierte a float o lanza AccionInvalida con un mensaje claro."""
    if isinstance(valor, bool) or not isinstance(valor, (int, float)):
        raise AccionInvalida(f'`{nombre}` debe ser un número, pero tu función devolvió {valor!r}')
    if valor != valor:  # NaN
        raise AccionInvalida(f'`{nombre}` es NaN')
    return float(valor)
