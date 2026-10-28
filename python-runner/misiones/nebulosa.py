# -*- coding: utf-8 -*-
"""Reto 🎨 Pinta la nebulosa (fase 5.5). Diseño: docs/diseno/fase-5-retos.md §4.5

El alumno escribe color(x, y, ancho, alto) y devuelve el color de ese píxel: un nombre de la
paleta común o su número (0 negro · 1 azul · 2 rojo · 3 verde · 4 amarillo · 5 gris · 6 morado
· 7 naranja · 8 cian · 9 granate). El motor la llama una vez por píxel, en lotes de 512.
  variante "bandera" (N1) → tres franjas verticales (morado, naranja, morado) y un sol amarillo
                            en el centro. Hay que acertar el 100 % de los píxeles
  variante "anillos" (N2) → un planeta naranja con anillos elípticos alternos (cian y azul) y una
                            luna amarilla arriba a la derecha. Basta con el 97 %

Las imágenes objetivo usan aritmética entera (las coordenadas se doblan o cuadruplican para medir
desde el centro de cada píxel), así que una solución con decimales coincide exactamente.
"""

from math import isqrt

from .base import Mision, AccionInvalida

PALETA = ['negro', 'azul', 'rojo', 'verde', 'amarillo', 'gris', 'morado', 'naranja', 'cian', 'granate']
NEGRO, AZUL, AMARILLO, MORADO, NARANJA, CIAN = 0, 1, 4, 6, 7, 8
VARIANTES = ('bandera', 'anillos')
LOTE = 512
UMBRAL = {'bandera': 100.0, 'anillos': 97.0}


def bandera(x, y, ancho, alto):
    radio = min(ancho, alto) // 4
    # Distancia al centro del lienzo medida desde el centro del píxel (x + 0.5), en coordenadas dobladas
    dx, dy = 2 * x + 1 - ancho, 2 * y + 1 - alto
    if dx * dx + dy * dy <= (2 * radio) ** 2:
        return AMARILLO
    return NARANJA if x * 3 // ancho == 1 else MORADO


def anillos(x, y, ancho, alto):
    u = max(1, min(ancho, alto) // 8)
    # Luna: centro en (3/4 del ancho, 1/4 del alto), radio u (coordenadas cuadruplicadas)
    lx, ly = 4 * x + 2 - 3 * ancho, 4 * y + 2 - alto
    if lx * lx + ly * ly <= (4 * u) ** 2:
        return AMARILLO
    dx, dy = 2 * x + 1 - ancho, 2 * y + 1 - alto
    # Planeta: círculo de radio 2u en el centro
    if dx * dx + dy * dy <= (4 * u) ** 2:
        return NARANJA
    # Anillos: elipses el doble de anchas que de altas; el anillo k va de k·u a (k+1)·u
    k = isqrt(dx * dx + 4 * dy * dy) // (2 * u)
    if 3 <= k <= 6:
        return CIAN if k % 2 else AZUL
    return NEGRO


REFERENCIAS = {'bandera': bandera, 'anillos': anillos}


def a_color(valor):
    """Nombre o número de la paleta → número, o None si no es un color."""
    if isinstance(valor, bool):
        return None
    if isinstance(valor, int):
        return valor if 0 <= valor <= 9 else None
    if isinstance(valor, str):
        nombre = valor.strip().lower()
        return PALETA.index(nombre) if nombre in PALETA else None
    return None


class Nebulosa(Mision):
    id = 'nebulosa'
    funcion = 'color'
    espera_respuesta = 3.0

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        self.variante = self.params.get('variante', 'bandera')
        if self.variante not in VARIANTES:
            raise ValueError(f'Variante de nebulosa desconocida: {self.variante}')
        self.ancho = min(max(int(self.params.get('ancho', 48)), 1), 128)
        self.alto = min(max(int(self.params.get('alto', 48)), 1), 128)
        referencia = REFERENCIAS[self.variante]
        self.objetivo = ''.join(str(referencia(x, y, self.ancho, self.alto))
                                for y in range(self.alto) for x in range(self.ancho))
        self.total = self.ancho * self.alto
        self.max_ticks = -(-self.total // LOTE)
        self.imagen = ''
        self.aciertos = 0

    def _pixel(self, i):
        return i % self.ancho, i // self.ancho

    # ---------------- Mensajes ----------------
    def sensores(self):
        return {}

    def mensaje(self):
        inicio = self.tick * LOTE
        return {'lote': [[*self._pixel(i), self.ancho, self.alto] for i in range(inicio, min(inicio + LOTE, self.total))]}

    def aplicar(self, accion):
        inicio = self.tick * LOTE
        esperados = min(LOTE, self.total - inicio)
        if not isinstance(accion, list) or len(accion) != esperados:
            raise AccionInvalida(f'se esperaban {esperados} colores')
        trozo = []
        for j, valor in enumerate(accion):
            color = a_color(valor)
            if color is None:
                x, y = self._pixel(inicio + j)
                raise AccionInvalida(f'color({x}, {y}, {self.ancho}, {self.alto}) devolvió {valor!r}: '
                                     f'tiene que ser un color de la paleta ("negro", "azul"…) o un número del 0 al 9'[:300])
            trozo.append(str(color))
        self.imagen += ''.join(trozo)
        if len(self.imagen) == self.total:
            self.aciertos = sum(a == b for a, b in zip(self.imagen, self.objetivo))
            umbral = UMBRAL[self.variante]
            texto = f'{self.porcentaje():.1f}'.replace('.', ',')
            if self.porcentaje() >= umbral:
                self.terminar(True, f'🎨 Nebulosa pintada: {texto} % de los píxeles coinciden')
            else:
                exigido = 'acertarlos todos' if umbral == 100 else f'al menos el {umbral:.0f} %'
                self.terminar(False, f'🖌️ Coinciden el {texto} % de los píxeles ({self.total - self.aciertos} distintos); hace falta {exigido}')

    def porcentaje(self):
        return 100.0 * self.aciertos / self.total

    # ---------------- Visor ----------------
    def fotograma(self):
        # La imagen que lleva pintada (un carácter por píxel); el objetivo viaja en la escena
        return {'imagen': self.imagen}

    def escena(self):
        return self.material()

    def material(self):
        return {'variante': self.variante, 'ancho': self.ancho, 'alto': self.alto, 'objetivo': self.objetivo}

    def metricas(self):
        if len(self.imagen) < self.total:
            return {}
        return {'aciertos': self.aciertos, 'pixeles': self.total, 'porcentaje': round(self.porcentaje(), 2)}

    def estrellas(self):
        p = self.porcentaje()
        return 3 if p >= 100 else 2 if p >= 99 else 1
