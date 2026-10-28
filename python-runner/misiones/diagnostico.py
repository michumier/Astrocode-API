# -*- coding: utf-8 -*-
"""Reto de calibración del motor (fase 5.0).

No es un ejercicio para alumnos: sirve para probar de punta a punta las ampliaciones
del motor que usarán los retos de la fase 5 (argumentos, lotes y consultas) y para
medir su rendimiento. Solo se siembra con RETOS_DE_PRUEBA=1.

  modo "args":     calibrar(a, b) → a + b, tres veces (un tick por pareja)
  modo "lote":     calibrar(x, y) → (x + y) % 10 para cada punto de una rejilla lado × lado
  modo "consulta": calibrar(sonda) → hay que acertar un número con sonda.probar(n)
                   («mayor», «menor» o «abierta») antes de agotar sonda.intentos
"""

from .base import Mision, AccionInvalida

MODOS = ('args', 'lote', 'consulta')


class Diagnostico(Mision):
    id = 'diagnostico'
    funcion = 'calibrar'
    max_ticks = 3

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        self.modo = self.params.get('modo', 'args')
        if self.modo not in MODOS:
            raise ValueError(f'Modo de diagnóstico desconocido: {self.modo}')
        self.aciertos = 0
        if self.modo == 'args':
            self.pares = [(self.rng.randint(1, 99), self.rng.randint(1, 99)) for _ in range(self.max_ticks)]
        elif self.modo == 'lote':
            self.lado = min(max(int(self.params.get('lado', 8)), 1), 64)
            self.imagen = ''
            self.espera_respuesta = 3.0
        else:
            self.maximo = max(int(self.params.get('maximo', 1000)), 2)
            self.intentos = self.maximo.bit_length()
            self.secreto = self.rng.randint(1, self.maximo)
            self.usados = 0
            self.abierta = False
            self.historial = []
            self.admite_none = True
            self.espera_respuesta = 3.0

    # ---- Mensajes al alumno ----
    def sensores(self):
        return {}

    def mensaje(self):
        if self.modo == 'args':
            return {'args': list(self.pares[self.tick])}
        if self.modo == 'lote':
            return {'lote': [[x, y] for y in range(self.lado) for x in range(self.lado)]}
        return {'remoto': {
            'atributos': {'minimo': 1, 'maximo': self.maximo, 'intentos': self.intentos},
            'metodos': ['probar'],
        }}

    def consultar(self, metodo, args):
        if metodo != 'probar' or len(args) != 1:
            raise AccionInvalida('la sonda solo tiene el método probar(n)')
        if self.abierta:
            return {'respuesta': 'abierta'}
        if self.usados >= self.intentos:
            self.terminar(False, f'🚨 Saltó la alarma: agotaste los {self.intentos} intentos')
            return {'excepcion': f'¡Alarma! Has agotado los {self.intentos} intentos', 'tipo': 'Alarma'}
        self.usados += 1
        n = args[0]
        if isinstance(n, bool) or not isinstance(n, int):
            self.historial.append([None, 'invalido'])
            return {'respuesta': 'invalido'}
        if n == self.secreto:
            self.abierta = True
            respuesta = 'abierta'
        else:
            respuesta = 'mayor' if self.secreto > n else 'menor'
        self.historial.append([n, respuesta])
        return {'respuesta': respuesta}

    # ---- Respuesta del alumno ----
    def aplicar(self, accion):
        if self.modo == 'args':
            a, b = self.pares[self.tick]
            if isinstance(accion, bool) or not isinstance(accion, (int, float)):
                raise AccionInvalida(f'calibrar({a}, {b}) debe devolver un número, no {accion!r}')
            if accion != a + b:
                self.terminar(False, f'calibrar({a}, {b}) devolvió {accion!r}; se esperaba {a + b}')
                return
            self.aciertos += 1
            if self.tick == self.max_ticks - 1:
                self.terminar(True, 'Calibración correcta')
        elif self.modo == 'lote':
            total = self.lado * self.lado
            if not isinstance(accion, list) or len(accion) != total:
                raise AccionInvalida(f'se esperaban {total} resultados')
            celdas = []
            for i, valor in enumerate(accion):
                x, y = i % self.lado, i // self.lado
                bueno = isinstance(valor, int) and not isinstance(valor, bool) and valor == (x + y) % 10
                self.aciertos += bueno
                celdas.append(str(valor) if bueno else '?')
            self.imagen = ''.join(celdas)
            self.terminar(self.aciertos == total, f'{self.aciertos} de {total} puntos correctos')
        else:
            if self.abierta:
                self.terminar(True, f'Abierta en {self.usados} intentos')
            else:
                self.terminar(False, 'La función terminó sin acertar el número')

    # ---- Visor ----
    def fotograma(self):
        if self.modo == 'args':
            return {'tick': self.tick, 'aciertos': self.aciertos}
        if self.modo == 'lote':
            return {'imagen': self.imagen}
        return {'historial': list(self.historial), 'usados': self.usados}

    def escena(self):
        if self.modo == 'args':
            return {'modo': 'args'}
        if self.modo == 'lote':
            return {'modo': 'lote', 'lado': self.lado}
        return {'modo': 'consulta', 'maximo': self.maximo, 'intentos': self.intentos}

    def material(self):
        explicaciones = {
            'args': 'calibrar(a, b) debe devolver a + b',
            'lote': 'calibrar(x, y) debe devolver (x + y) % 10 para cada punto de la rejilla',
            'consulta': 'calibrar(sonda) debe acertar el número con sonda.probar(n)',
        }
        return {**self.escena(), 'explicacion': explicaciones[self.modo]}

    def estrellas(self):
        return 3

    def metricas(self):
        if self.modo == 'consulta':
            return {'intentos': self.usados, 'limite': self.intentos}
        if self.modo == 'lote':
            return {'aciertos': self.aciertos, 'total': self.lado * self.lado}
        return {'aciertos': self.aciertos}
