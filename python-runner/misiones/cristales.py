# -*- coding: utf-8 -*-
"""M3 — Recolector de cristales (rejilla).

La nave se mueve por un mapa con rocas (#). Hay que recoger todos los cristales sin
superar el límite de movimientos. Ideal para practicar búsqueda en anchura (BFS).

El generador garantiza que todos los cristales son alcanzables y calcula el recorrido
óptimo (BFS sobre posición + cristales recogidos) para las estrellas.
"""

from collections import deque

from .base import Mision, AccionInvalida

MOVIMIENTOS = {'N': (-1, 0), 'S': (1, 0), 'E': (0, 1), 'O': (0, -1)}


class Cristales(Mision):
    id = 'cristales'

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        p = self.params
        self.filas = int(p.get('filas', 9))
        self.columnas = int(p.get('columnas', 11))
        self.num_cristales = int(p.get('cristales', 4))
        self.densidad = float(p.get('rocas', 0.22))
        self.mapa, self.inicio, cristales = self._generar()
        self.posicion = list(self.inicio)
        self.pendientes = [list(c) for c in cristales]
        self.cristales0 = [list(c) for c in cristales]
        self.optimo = self._optimo()
        # El límite siempre deja ganar a la estrategia «BFS al cristal más cercano»
        self.limite = max(int(self.optimo * 1.6) + 4, self._recorrido_mas_cercano() + 2)
        self.max_ticks = self.limite
        self.movimientos = 0
        self.choques = 0

    # ---------- Generación ----------
    def _generar(self):
        for _ in range(500):
            mapa = [['#' if self.rng.random() < self.densidad else '.' for _ in range(self.columnas)] for _ in range(self.filas)]
            libres = [(f, c) for f in range(self.filas) for c in range(self.columnas) if mapa[f][c] == '.']
            if len(libres) < self.num_cristales + 5:
                continue
            inicio = self.rng.choice(libres)
            alcanzables = self._alcanzables(mapa, inicio)
            candidatos = [x for x in alcanzables if x != inicio]
            if len(candidatos) < self.num_cristales or len(alcanzables) < len(libres) * 0.6:
                continue
            cristales = self.rng.sample(sorted(candidatos), self.num_cristales)
            return [''.join(fila) for fila in mapa], inicio, cristales
        raise RuntimeError('No se pudo generar un mapa válido')

    def _vecinos(self, mapa, f, c):
        for df, dc in MOVIMIENTOS.values():
            nf, nc = f + df, c + dc
            if 0 <= nf < self.filas and 0 <= nc < self.columnas and mapa[nf][nc] != '#':
                yield nf, nc

    def _alcanzables(self, mapa, inicio):
        vistos = {inicio}
        cola = deque([inicio])
        while cola:
            f, c = cola.popleft()
            for v in self._vecinos(mapa, f, c):
                if v not in vistos:
                    vistos.add(v)
                    cola.append(v)
        return vistos

    def _optimo(self):
        """Movimientos mínimos para recoger todos los cristales (BFS sobre posición + máscara)."""
        indice = {tuple(c): i for i, c in enumerate(self.cristales0)}
        completo = (1 << len(indice)) - 1
        inicio = (tuple(self.inicio), 0)
        vistos = {inicio}
        cola = deque([(inicio, 0)])
        while cola:
            ((f, c), mascara), dist = cola.popleft()
            if mascara == completo:
                return dist
            for v in self._vecinos(self.mapa, f, c):
                nm = mascara | (1 << indice[v]) if v in indice else mascara
                estado = (v, nm)
                if estado not in vistos:
                    vistos.add(estado)
                    cola.append((estado, dist + 1))
        raise RuntimeError('Cristales inalcanzables')

    def _recorrido_mas_cercano(self):
        """Movimientos de la estrategia sencilla: ir siempre (con BFS) al cristal más cercano."""
        pos = tuple(self.inicio)
        pendientes = {tuple(c) for c in self.cristales0}
        total = 0
        while pendientes:
            vistos = {pos}
            cola = deque([(pos, 0)])
            while cola:
                actual, dist = cola.popleft()
                if actual in pendientes:
                    pendientes.discard(actual)
                    pos, total = actual, total + dist
                    break
                for v in self._vecinos(self.mapa, *actual):
                    if v not in vistos:
                        vistos.add(v)
                        cola.append((v, dist + 1))
        return total

    # ---------- Simulación ----------
    def sensores(self):
        return {
            'mapa': list(self.mapa),
            'posicion': list(self.posicion),
            'cristales': [list(c) for c in self.pendientes],
            'movimientos_restantes': self.limite - self.movimientos,
            'tick': self.tick,
        }

    def aplicar(self, accion):
        if isinstance(accion, dict):
            accion = accion.get('accion')
        if not isinstance(accion, str) or accion.strip().upper() not in MOVIMIENTOS:
            raise AccionInvalida(f'debes devolver "N", "S", "E" u "O", no {accion!r}')
        df, dc = MOVIMIENTOS[accion.strip().upper()]
        nf, nc = self.posicion[0] + df, self.posicion[1] + dc
        self.movimientos += 1
        if 0 <= nf < self.filas and 0 <= nc < self.columnas and self.mapa[nf][nc] != '#':
            self.posicion = [nf, nc]
        else:
            self.choques += 1
        if self.posicion in self.pendientes:
            self.pendientes.remove(self.posicion)
        if not self.pendientes:
            self.terminar(True, f'¡Todos los cristales recogidos en {self.movimientos} movimientos!')
        elif self.movimientos >= self.limite:
            self.terminar(False, f'Sin movimientos: faltan {len(self.pendientes)} cristal(es)')

    def motivo_tiempo_agotado(self):
        return f'Sin movimientos: faltan {len(self.pendientes)} cristal(es)'

    def estrellas(self):
        return 3 if self.movimientos <= self.optimo else 2 if self.movimientos <= self.optimo * 1.25 else 1

    def metricas(self):
        return {'movimientos': self.movimientos, 'optimo': self.optimo, 'limite': self.limite, 'choques': self.choques}

    def fotograma(self):
        return {'pos': list(self.posicion), 'recogidos': len(self.cristales0) - len(self.pendientes)}

    def escena(self):
        return {
            'mapa': list(self.mapa),
            'inicio': list(self.inicio),
            'cristales': [list(c) for c in self.cristales0],
            'limite': self.limite,
        }
