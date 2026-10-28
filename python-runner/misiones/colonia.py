# -*- coding: utf-8 -*-
"""Reto 🧬 La colonia (fase 5.7). Diseño: docs/diseno/fase-5-retos.md §4.7

El alumno escribe regla(viva, vecinas) → True/False: la ley de la vida de una colonia alienígena.
Solo hay 18 entradas posibles (viva o muerta × 0-8 vecinas), así que el motor llama a la función
18 veces (dos veces cada una, para comprobar que es pura), construye la tabla y simula él solo
las 40 generaciones: es rápido, determinista y no admite trampas.

Co1 · Terraformación (mapa de 24×24):
  - un muro vertical separa la colonia de la zona verde; lo cruza una PUERTA de 2 celdas
  - la base humana está en una esquina, tras un muro con una GRIETA de 1 celda
  - la colonia tiene que cubrir entera la zona verde antes de la generación 40 sin tocar
    NUNCA la base (en ninguna de las 40 generaciones)
Al otro lado de la grieta una célula solo ve 1 vecina viva; al otro lado de la puerta, 2. Así que
la regla tiene que dejar nacer con 2 vecinas (para pasar la puerta) pero no con 0 ni con 1 (para
no colarse por la grieta, ni aparecer de la nada dentro de la base).
"""

from .base import Mision, AccionInvalida

N = 24
GENERACIONES = 40
ENTRADAS = [(viva, vecinas) for viva in (True, False) for vecinas in range(9)]
MAX_INTENTOS_MAPA = 400


def vecinos_de(n=N):
    lista = []
    for i in range(n * n):
        f, c = divmod(i, n)
        lista.append([(f + df) * n + c + dc for df in (-1, 0, 1) for dc in (-1, 0, 1)
                      if (df or dc) and 0 <= f + df < n and 0 <= c + dc < n])
    return lista


VECINOS = vecinos_de()


def simular(tabla, rocas, inicial, base, objetivo, generaciones=GENERACIONES, guardar=False):
    """tabla[viva][vecinas] → bool. Devuelve (cubierta_en, infectada_en, historial de generaciones)."""
    libres = [i for i in range(N * N) if i not in rocas]
    celdas = [0] * (N * N)
    for i in inicial:
        celdas[i] = 1
    historial = [celdas] if guardar else None
    cubierta = infectada = None
    for g in range(1, generaciones + 1):
        nuevas = [0] * (N * N)
        for i in libres:
            n = 0
            for j in VECINOS[i]:
                n += celdas[j]
            nuevas[i] = 1 if tabla[celdas[i]][n] else 0
        estable = nuevas == celdas
        celdas = nuevas
        if guardar:
            historial.append(celdas)
        if infectada is None and any(celdas[i] for i in base):
            infectada = g
            if not guardar:
                break
        if cubierta is None and all(celdas[i] for i in objetivo):
            cubierta = g
        # Si ya no cambia, el futuro es igual: se rellena el historial sin simular
        if estable:
            if guardar:
                historial.extend([celdas] * (generaciones - g))
            break
    return cubierta, infectada, historial


def tabla_de(funcion):
    """Tabla [muerta, viva] × vecinas a partir de una función de Python (para las pruebas)."""
    return [[bool(funcion(False, n)) for n in range(9)], [bool(funcion(True, n)) for n in range(9)]]


def referencia(viva, vecinas):
    return viva or vecinas >= 2


def invadirlo_todo(viva, vecinas):
    return viva or vecinas >= 1


def solo_con_tres(viva, vecinas):
    return viva or vecinas >= 3


class Colonia(Mision):
    id = 'colonia'
    funcion = 'regla'
    max_ticks = 1
    espera_respuesta = 3.0

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        for _ in range(MAX_INTENTOS_MAPA):
            if self._mapa():
                break
        else:
            raise RuntimeError(f'No se pudo generar el mapa de la colonia (semilla {semilla})')
        self.tabla = None
        self.historial = None
        self.cubierta = self.infectada = None

    # ---------------- Mapa ----------------
    def _mapa(self):
        rng = self.rng
        rocas, base, objetivo = set(), set(), set()
        idx = lambda f, c: f * N + c  # noqa: E731
        # Muro vertical con una puerta de 2 celdas
        muro = rng.randint(10, 13)
        puerta = rng.randint(3, N - 5)
        for f in range(N):
            if f not in (puerta, puerta + 1):
                rocas.add(idx(f, muro))
        # Base 4×4 en una esquina de la izquierda, tras un muro en L con una grieta de 1 celda
        arriba = rng.random() < 0.5
        filas_base = range(0, 4) if arriba else range(N - 4, N)
        fila_muro = 4 if arriba else N - 5
        for f in filas_base:
            for c in range(4):
                base.add(idx(f, c))
        tramo = [(fila_muro, c) for c in range(4)] + [(f, 4) for f in filas_base]
        for f, c in tramo + [(fila_muro, 4)]:
            rocas.add(idx(f, c))
        grieta = rng.choice(tramo)
        rocas.discard(idx(*grieta))
        # Zona verde 4×4 al otro lado del muro
        fo = rng.randint(1, N - 5)
        co = rng.randint(muro + 4, N - 5)
        for f in range(fo, fo + 4):
            for c in range(co, co + 4):
                objetivo.add(idx(f, c))
        # Colonia inicial: un grupito de 3×3 en la izquierda, lejos de la base
        fc = rng.randint(6, N - 9)
        cc = rng.randint(5, muro - 4)
        patron = [(df, dc) for df in range(3) for dc in range(3) if rng.random() < 0.7]
        if len(patron) < 5:
            return False
        inicial = {idx(fc + df, cc + dc) for df, dc in patron}
        # Algunas rocas sueltas, lejos de la puerta, la grieta, la base, la zona verde y la colonia
        prohibidas = set(base) | set(objetivo) | inicial
        for f, c in [(puerta, muro), (puerta + 1, muro), grieta]:
            prohibidas |= {idx(f + df, c + dc) for df in range(-2, 3) for dc in range(-2, 3)
                           if 0 <= f + df < N and 0 <= c + dc < N}
        for _ in range(rng.randint(5, 10)):
            i = rng.randrange(N * N)
            if i not in prohibidas and i not in rocas:
                rocas.add(i)
        if inicial & rocas:
            return False

        # El validador: la referencia gana (y con margen para ⭐⭐⭐), las trampas muerden
        datos = (rocas, inicial, base, objetivo)
        cubierta, infectada, _ = simular(tabla_de(referencia), *datos)
        if infectada or not cubierta or not 12 <= cubierta <= 25:
            return False
        if not simular(tabla_de(invadirlo_todo), *datos)[1]:
            return False  # la grieta tiene que dejar pasar a quien nace con 1 vecina
        if simular(tabla_de(solo_con_tres), *datos)[0]:
            return False  # la puerta no deja pasar a quien solo nace con 3
        self.rocas, self.inicial, self.base, self.objetivo = rocas, inicial, base, objetivo
        self.grieta = idx(*grieta)
        self.puerta = [idx(puerta, muro), idx(puerta + 1, muro)]
        return True

    # ---------------- Mensajes ----------------
    def sensores(self):
        return {}

    def mensaje(self):
        # Cada entrada dos veces: si la función no es pura, se nota
        return {'lote': [list(e) for e in ENTRADAS] * 2}

    def aplicar(self, accion):
        if not isinstance(accion, list) or len(accion) != 2 * len(ENTRADAS):
            raise AccionInvalida(f'se esperaban {2 * len(ENTRADAS)} respuestas')
        tabla = [[False] * 9, [False] * 9]
        for k, ((viva, vecinas), valor) in enumerate(zip(ENTRADAS * 2, accion)):
            if isinstance(valor, bool):
                vivo = valor
            elif isinstance(valor, int) and valor in (0, 1):
                vivo = bool(valor)
            else:
                raise AccionInvalida(f'regla({viva}, {vecinas}) devolvió {valor!r}: tiene que devolver True o False'[:200])
            if k >= len(ENTRADAS) and tabla[int(viva)][vecinas] != vivo:
                raise AccionInvalida(f'regla({viva}, {vecinas}) devolvió una vez {not vivo} y otra {vivo}: '
                                     'tiene que ser pura (misma entrada, misma salida)')
            tabla[int(viva)][vecinas] = vivo
        self.tabla = tabla
        self.cubierta, self.infectada, self.historial = simular(
            tabla, self.rocas, self.inicial, self.base, self.objetivo, guardar=True)
        if self.infectada:
            self.terminar(False, f'☣️ La colonia alcanzó la base en la generación {self.infectada}')
        elif self.cubierta:
            self.terminar(True, f'🌱 Zona verde cubierta en la generación {self.cubierta} y la base, intacta')
        else:
            mejor = max(sum(g[i] for i in self.objetivo) for g in self.historial)
            vivas = sum(self.historial[-1])
            if not vivas:
                motivo = f'💀 La colonia se extinguió (la mejor cobertura fue de {mejor} de {len(self.objetivo)} celdas)'
            else:
                motivo = (f'🌫️ En {GENERACIONES} generaciones la colonia no cubrió toda la zona verde '
                          f'(como mucho, {mejor} de {len(self.objetivo)} celdas a la vez)')
            self.terminar(False, motivo)

    # ---------------- Visor ----------------
    def fotograma(self):
        if self.historial is None:
            return {'fase': 'inicio'}
        # Las generaciones hasta la infección (el visor se para ahí) o las 40
        hasta = self.infectada if self.infectada else GENERACIONES
        return {
            'fase': 'fin',
            'tabla': {'viva': self.tabla[1], 'muerta': self.tabla[0]},
            'generaciones': [''.join(map(str, g)) for g in self.historial[:hasta + 1]],
            'cubierta': self.cubierta, 'infectada': self.infectada,
        }

    def escena(self):
        return self.material()

    def material(self):
        return {
            'lado': N, 'generaciones': GENERACIONES,
            'rocas': sorted(self.rocas), 'base': sorted(self.base), 'objetivo': sorted(self.objetivo),
            'inicial': sorted(self.inicial),
        }

    def metricas(self):
        if self.historial is None:
            return {}
        return {'generacion': self.cubierta or 0, 'limite': GENERACIONES}

    def estrellas(self):
        g = self.cubierta or GENERACIONES
        return 3 if g <= 25 else 2 if g <= 32 else 1
