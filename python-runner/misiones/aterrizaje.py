# -*- coding: utf-8 -*-
"""M1 — Aterrizaje de emergencia (1D).

La nave cae por la gravedad del planeta. Cada tick el piloto decide el empuje del motor (0 a 1).
Hay que tocar el suelo a menos de 2 m/s sin quedarse sin combustible por el camino.
"""

from .base import Mision, AccionInvalida, numero

DT = 0.1             # segundos por tick
EMPUJE_MAX = 12.0    # m/s² con el motor al máximo
CONSUMO = 5.0        # unidades de combustible por segundo a empuje 1
VELOCIDAD_SEGURA = 2.0


class Aterrizaje(Mision):
    id = 'aterrizaje'
    max_ticks = 1200

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        p = self.params
        self.gravedad = float(p.get('gravedad', 3.71))
        self.altura = float(p.get('altura', round(self.rng.uniform(80, 160), 1)))
        self.velocidad = float(p.get('velocidad', round(self.rng.uniform(-8, 0), 2)))
        self.combustible0 = float(p.get('combustible', round(self.rng.uniform(70, 100), 1)))
        self.combustible = self.combustible0
        self.empuje = 0.0
        self.altura0 = self.altura
        # Terreno decorativo (solo para el visor)
        self.terreno = [round(self.rng.uniform(0, 1), 2) for _ in range(24)]

    def sensores(self):
        return {
            'altura': round(self.altura, 2),
            'velocidad': round(self.velocidad, 2),
            'combustible': round(self.combustible, 2),
            'gravedad': self.gravedad,
            'tick': self.tick,
        }

    def aplicar(self, accion):
        # Se acepta {"empuje": x} o directamente un número
        if isinstance(accion, dict):
            if 'empuje' not in accion:
                raise AccionInvalida('El diccionario que devuelves debe tener la clave "empuje"')
            accion = accion['empuje']
        empuje = numero(accion, 'empuje')
        empuje = max(0.0, min(1.0, empuje)) if self.combustible > 0 else 0.0
        self.empuje = empuje

        self.velocidad += (empuje * EMPUJE_MAX - self.gravedad) * DT
        self.altura += self.velocidad * DT
        self.combustible = max(0.0, self.combustible - empuje * CONSUMO * DT)

        if self.altura <= 0:
            self.altura = 0.0
            impacto = abs(self.velocidad)
            if impacto < VELOCIDAD_SEGURA:
                self.terminar(True, f'¡Aterrizaje perfecto a {impacto:.2f} m/s!')
            else:
                self.terminar(False, f'Impacto a {impacto:.1f} m/s (máximo seguro: {VELOCIDAD_SEGURA:.0f} m/s)')

    def motivo_tiempo_agotado(self):
        return f'La nave sigue en el aire tras {self.max_ticks // 10} segundos: hay que bajar más rápido'

    def porcentaje_combustible(self):
        return 100 * self.combustible / self.combustible0 if self.combustible0 else 0

    def estrellas(self):
        resto = self.porcentaje_combustible()
        return 3 if resto >= 60 else 2 if resto >= 40 else 1

    def metricas(self):
        return {
            'velocidad_impacto': round(abs(self.velocidad), 2),
            'combustible_restante': round(self.porcentaje_combustible(), 1),
            'segundos': round(self.tick * DT, 1),
        }

    def fotograma(self):
        return {'h': round(self.altura, 2), 'v': round(self.velocidad, 2), 'c': round(self.combustible, 1), 'e': round(self.empuje, 2)}

    def escena(self):
        return {
            'altura0': self.altura0,
            'gravedad': self.gravedad,
            'combustible0': self.combustible0,
            'terreno': self.terreno,
            'dt': DT,
        }
