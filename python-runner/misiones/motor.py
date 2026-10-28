# -*- coding: utf-8 -*-
"""
Motor de las misiones de pilotaje.

Para cada escenario arranca un proceso nuevo con el código del alumno (piloto_harness.py,
con los mismos límites que /run) y lo va alimentando tick a tick con los sensores.
La simulación vive en este proceso: el alumno no puede leerla ni modificarla.
"""

import json
import os
import select
import shutil
import subprocess
import sys
import tempfile
import time

from sandbox import creador_de_limites, entorno_limpio
from .base import AccionInvalida
from .aterrizaje import Aterrizaje
from .asteroides import Asteroides
from .cristales import Cristales
from .diagnostico import Diagnostico
from .bomba import Bomba
from .lengua import Lengua
from .camara import Camara
from .impostor import Impostor
from .nebulosa import Nebulosa

MISIONES = {m.id: m for m in (Aterrizaje, Asteroides, Cristales, Diagnostico, Bomba, Lengua, Camara, Impostor, Nebulosa)}

HARNESS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'piloto_harness.py')

ESPERA_CARGA = 3.0       # segundos para cargar el código del alumno
TIEMPO_ESCENARIO = 8.0   # segundos (reloj) por escenario
CPU_ESCENARIO = 4        # segundos de CPU por escenario
MAX_REGISTRO_TOTAL = 4000
MAX_CONSULTAS = 100_000  # tope de seguridad por escenario (cada reto pone su propio límite)
MAX_DETALLE = 2_000_000  # caracteres de fotogramas (en JSON) por escenario


class _Piloto:
    """Proceso del alumno con lectura de respuestas con tiempo límite."""

    def __init__(self, codigo, funcion='piloto'):
        self.dir = tempfile.mkdtemp(prefix='piloto-')
        ruta = os.path.join(self.dir, 'main.py')
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write(codigo)
        self.proc = subprocess.Popen(
            [sys.executable, '-I', '-B', HARNESS, ruta, funcion],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            cwd=self.dir, env=entorno_limpio(self.dir),
            preexec_fn=creador_de_limites(CPU_ESCENARIO),
        )
        self.pendiente = b''

    def leer(self, espera):
        """Lee una línea JSON o devuelve None si no llega a tiempo / el proceso murió."""
        limite = time.monotonic() + espera
        while b'\n' not in self.pendiente:
            restante = limite - time.monotonic()
            if restante <= 0:
                return None
            listos, _, _ = select.select([self.proc.stdout], [], [], restante)
            if not listos:
                return None
            trozo = os.read(self.proc.stdout.fileno(), 65536)
            if not trozo:
                return None
            self.pendiente += trozo
        linea, self.pendiente = self.pendiente.split(b'\n', 1)
        try:
            return json.loads(linea.decode('utf-8', errors='replace'))
        except ValueError:
            return {'error': 'Respuesta ilegible del piloto'}

    def enviar(self, mensaje):
        try:
            self.proc.stdin.write((json.dumps(mensaje) + '\n').encode('utf-8'))
            self.proc.stdin.flush()
            return True
        except (BrokenPipeError, OSError):
            return False

    def cerrar(self):
        try:
            self.proc.kill()
        except OSError:
            pass
        try:
            self.proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            pass
        # Cerrar las tuberías: si no, el servidor acabaría quedándose sin descriptores
        for tuberia in (self.proc.stdin, self.proc.stdout):
            try:
                tuberia.close()
            except OSError:
                pass
        shutil.rmtree(self.dir, ignore_errors=True)


def recortar_fotogramas(fotogramas):
    """Si los fotogramas pasan de MAX_DETALLE, se queda uno de cada N (y siempre el último)."""
    tamano = len(json.dumps(fotogramas))
    if tamano <= MAX_DETALLE:
        return fotogramas, False
    paso = tamano // MAX_DETALLE + 1
    recortados = fotogramas[::paso]
    if (len(fotogramas) - 1) % paso:
        recortados.append(fotogramas[-1])
    return recortados, True


def ejecutar_escenario(codigo, mision_id, escenario, con_detalle):
    """Simula un escenario. Devuelve el resultado (y fotogramas/registro si con_detalle)."""
    clase = MISIONES[mision_id]
    mision = clase(escenario.get('semilla', 0), escenario.get('params'))
    fotogramas = [mision.fotograma()] if con_detalle else None
    registro = []
    total_registro = 0
    error = None

    def anotar(texto):
        nonlocal total_registro
        if texto and con_detalle and total_registro < MAX_REGISTRO_TOTAL:
            registro.append({'t': mision.tick, 'texto': texto[:MAX_REGISTRO_TOTAL - total_registro]})
            total_registro += len(texto)

    piloto = _Piloto(codigo, mision.funcion)
    # Las misiones de pilotaje conservan sus mensajes de siempre («Tu piloto…»)
    quien = 'Tu piloto' if mision.funcion == 'piloto' else f'Tu función {mision.funcion}()'
    inicio = time.monotonic()
    consultas = 0
    try:
        respuesta = piloto.leer(ESPERA_CARGA)
        if respuesta is None:
            error = 'Tu código tardó demasiado en cargar (¿hay un bucle infinito fuera de la función?)'
        elif 'error' in respuesta:
            anotar(respuesta.get('registro'))
            error = respuesta['error']
        else:
            anotar(respuesta.get('registro'))
            while not mision.terminado():
                if time.monotonic() - inicio > TIEMPO_ESCENARIO:
                    error = f'La misión superó el tiempo máximo de cálculo (tick {mision.tick})'
                    break
                if not piloto.enviar(mision.mensaje()):
                    error = f'{quien} dejó de responder en el tick {mision.tick}'
                    break
                # Mientras la función del alumno hace consultas, el motor las va contestando
                while True:
                    respuesta = piloto.leer(mision.espera_respuesta)
                    if respuesta is None:
                        error = (f'{quien} no respondió a tiempo (tick {mision.tick}). '
                                 f'¿Hay un bucle infinito en {mision.funcion}()?')
                        break
                    anotar(respuesta.get('registro'))
                    if 'consulta' not in respuesta:
                        break
                    consultas += 1
                    if consultas > MAX_CONSULTAS or time.monotonic() - inicio > TIEMPO_ESCENARIO:
                        error = f'Demasiadas consultas: se superó el tiempo máximo de cálculo (tick {mision.tick})'
                        break
                    consulta = respuesta['consulta'] if isinstance(respuesta['consulta'], dict) else {}
                    try:
                        contestacion = mision.consultar(consulta.get('metodo'), consulta.get('args') or [])
                    except AccionInvalida as exc:
                        error = f'Consulta no válida en el tick {mision.tick}: {exc}'
                        break
                    if not piloto.enviar(contestacion):
                        error = f'{quien} dejó de responder en el tick {mision.tick}'
                        break
                if error:
                    break
                if 'error' in respuesta:
                    error = f'Error en el tick {mision.tick}:\n{respuesta["error"]}'
                    break
                # Una consulta puede haber terminado el reto (por ejemplo, al saltar la alarma)
                if mision.terminado():
                    break
                accion = respuesta['acciones'] if 'acciones' in respuesta else respuesta.get('accion')
                if accion is None and not mision.admite_none:
                    error = f'En el tick {mision.tick} tu función devolvió None. ¿Te falta un return?'
                    break
                try:
                    mision.avanzar(accion)
                except AccionInvalida as exc:
                    error = f'Acción no válida en el tick {mision.tick}: {exc}'
                    break
                if con_detalle:
                    fotogramas.append(mision.fotograma())
    finally:
        piloto.cerrar()

    # Si el reto ya había terminado por su cuenta (p. ej. la alarma), el error posterior
    # (la excepción Alarma sin capturar) no es un fallo del código: se queda el motivo del reto
    fin_propio = mision.terminado()
    if error:
        mision.terminar(False, error)
    # Si el escenario se cortó a medias (error, alarma…), el visor necesita el último estado igualmente
    if con_detalle:
        ultimo = mision.fotograma()
        if ultimo != fotogramas[-1]:
            fotogramas.append(ultimo)
    resultado = mision.resultado()
    resultado['error_codigo'] = bool(error) and not fin_propio
    if con_detalle:
        fotogramas, recortado = recortar_fotogramas(fotogramas)
        if recortado:
            resultado['detalle_recortado'] = True
        resultado['fotogramas'] = fotogramas
        resultado['registro'] = registro
        resultado['escena'] = mision.escena()
    return resultado


def material_reto(mision_id, escenarios):
    """Material público de los escenarios, sin ejecutar código del alumno. Quien llama pasa solo los visibles."""
    if mision_id not in MISIONES:
        raise ValueError(f'Misión desconocida: {mision_id}')
    clase = MISIONES[mision_id]
    return [
        {'nombre': esc.get('nombre') or f'Escenario {i + 1}',
         'material': clase(esc.get('semilla', 0), esc.get('params')).material()}
        for i, esc in enumerate(escenarios)
    ]


def ejecutar_mision(codigo, mision_id, escenarios, detalle_ocultos=False):
    """Ejecuta todos los escenarios. Los ocultos no devuelven fotogramas ni registro."""
    if mision_id not in MISIONES:
        raise ValueError(f'Misión desconocida: {mision_id}')
    resultados = []
    for i, esc in enumerate(escenarios):
        oculto = bool(esc.get('oculto'))
        r = ejecutar_escenario(codigo, mision_id, esc, con_detalle=(not oculto) or detalle_ocultos)
        r['nombre'] = esc.get('nombre') or f'Escenario {i + 1}'
        r['oculto'] = oculto
        resultados.append(r)
    return resultados
