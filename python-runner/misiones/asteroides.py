# -*- coding: utf-8 -*-
"""M2 — Cinturón de asteroides (carriles).

La nave avanza por un cinturón con varios carriles. Cada tick puede moverse un carril a la
izquierda, a la derecha o mantenerse. Si un asteroide llega a su carril, la nave se destruye.
Hay que sobrevivir hasta el final del cinturón.

El generador comprueba con una búsqueda en anchura (BFS) que cada escenario tiene solución.
"""

from collections import deque

from .base import Mision, AccionInvalida

ACCIONES = {'izquierda': -1, 'mantener': 0, 'derecha': 1}
LEJOS = 99         # distancia cuando no hay asteroide a la vista en un carril
VISION = 15        # ticks que alcanzan los sensores


class Asteroides(Mision):
    id = 'asteroides'

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        p = self.params
        self.carriles = int(p.get('carriles', 5))
        self.duracion = int(p.get('duracion', 120))
        self.densidad = float(p.get('densidad', 0.45))
        self.max_ticks = self.duracion
        self.carril = self.carriles // 2
        self.maniobras = 0
        self.ultima_accion = 'mantener'
        # asteroides: {tick_de_llegada: set(carriles)}
        self.asteroides, self.minimo_maniobras = self._generar()

    # ---------- Generación con garantía de solución ----------
    def _generar(self):
        for _ in range(200):
            filas = {}
            t = 6
            while t < self.duracion - 2:
                ocupados = set()
                for c in range(self.carriles):
                    if self.rng.random() < self.densidad:
                        ocupados.add(c)
                if len(ocupados) >= self.carriles:
                    ocupados.discard(self.rng.randrange(self.carriles))
                if ocupados:
                    filas[t] = ocupados
                t += self.rng.choice((2, 3, 3, 4))
            minimo = self._minimo_maniobras(filas)
            # Además de tener solución, debe poder resolverse solo con lo que ven los sensores:
            # la estrategia sencilla «ir al carril vecino con más espacio» tiene que sobrevivir
            if minimo is not None and self._sobrevive_estrategia_sencilla(filas):
                return filas, minimo
        raise RuntimeError('No se pudo generar un cinturón con solución')

    def _sobrevive_estrategia_sencilla(self, filas):
        carril = self.carriles // 2
        for t in range(self.duracion):
            def distancia(c):
                for d in range(1, VISION + 1):
                    if c in filas.get(t + d, ()):
                        return d
                return LEJOS
            opciones = [c for c in (carril, carril - 1, carril + 1) if 0 <= c < self.carriles]
            carril = max(opciones, key=distancia)  # en empate gana mantenerse (va primero)
            if carril in filas.get(t + 1, ()):
                return False
        return True

    def _minimo_maniobras(self, filas):
        """BFS 0-1 sobre (tick, carril): mínimo de maniobras para sobrevivir, o None."""
        inicio = (0, self.carriles // 2)
        mejor = {inicio: 0}
        cola = deque([(0, inicio)])
        while cola:
            coste, (t, c) = cola.popleft()
            if coste > mejor.get((t, c), 1e9):
                continue
            if t == self.duracion:
                return coste
            for d in (0, -1, 1):
                nc = c + d
                if not 0 <= nc < self.carriles:
                    continue
                nt = t + 1
                if nc in filas.get(nt, ()):
                    continue
                ncoste = coste + (1 if d else 0)
                if ncoste < mejor.get((nt, nc), 1e9):
                    mejor[(nt, nc)] = ncoste
                    if d:
                        cola.append((ncoste, (nt, nc)))
                    else:
                        cola.appendleft((ncoste, (nt, nc)))
        return None

    # ---------- Simulación ----------
    def _distancia(self, carril):
        for d in range(1, VISION + 1):
            if carril in self.asteroides.get(self.tick + d, ()):
                return d
        return LEJOS

    def sensores(self):
        return {
            'carril': self.carril,
            'carriles': self.carriles,
            'distancias': [self._distancia(c) for c in range(self.carriles)],
            'tick': self.tick,
            'ticks_restantes': self.duracion - self.tick,
        }

    def aplicar(self, accion):
        if isinstance(accion, dict):
            accion = accion.get('accion')
        if not isinstance(accion, str) or accion.strip().lower() not in ACCIONES:
            raise AccionInvalida(f'debes devolver "izquierda", "derecha" o "mantener", no {accion!r}')
        accion = accion.strip().lower()
        nuevo = self.carril + ACCIONES[accion]
        if 0 <= nuevo < self.carriles and nuevo != self.carril:
            self.carril = nuevo
            self.maniobras += 1
        self.ultima_accion = accion
        if self.carril in self.asteroides.get(self.tick + 1, ()):
            self.terminar(False, f'¡Impacto con un asteroide en el carril {self.carril} (tick {self.tick + 1})!')
        elif self.tick + 1 >= self.duracion:
            self.terminar(True, f'¡Has atravesado el cinturón con {self.maniobras} maniobras!')

    def estrellas(self):
        minimo = max(self.minimo_maniobras, 1)
        return 3 if self.maniobras <= minimo * 1.3 + 1 else 2 if self.maniobras <= minimo * 2 + 2 else 1

    def metricas(self):
        return {'maniobras': self.maniobras, 'minimo_maniobras': self.minimo_maniobras}

    def fotograma(self):
        return {'carril': self.carril, 'a': self.ultima_accion}

    def escena(self):
        return {
            'carriles': self.carriles,
            'duracion': self.duracion,
            'asteroides': sorted([t, c] for t, cs in self.asteroides.items() for c in cs),
        }
