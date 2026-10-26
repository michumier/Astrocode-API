# -*- coding: utf-8 -*-
"""
Proceso del PILOTO: aquí (y solo aquí) se ejecuta el código del alumno.

Protocolo con el motor, una línea JSON por mensaje:
  piloto → motor   {"listo": true, "registro": "..."}          al cargar el código
  motor  → piloto  {"sensores": {...}}                          cada tick
  piloto → motor   {"accion": ..., "registro": "..."}           respuesta del tick
  piloto → motor   {"error": "...", "registro": "..."}          si algo falla

El motor y el estado de la simulación viven en OTRO proceso: el alumno solo recibe
los sensores del tick actual y solo puede devolver una acción.
"""

import io
import json
import os
import sys
import traceback

MAX_REGISTRO = 400  # caracteres de print() que se devuelven por tick


def main(ruta_codigo):
    # El canal del protocolo es una copia del stdout original; el stdout "normal" se redirige
    # a un buffer para que los print() del alumno no se mezclen con el protocolo.
    canal = os.fdopen(os.dup(1), 'w', buffering=1, encoding='utf-8')
    entrada = sys.stdin
    nulo = os.open(os.devnull, os.O_WRONLY)
    os.dup2(nulo, 1)
    buffer = io.StringIO()
    sys.stdout = buffer
    sys.stdin = io.StringIO('')  # input() no tiene sentido aquí

    def enviar(mensaje):
        mensaje['registro'] = buffer.getvalue()[:MAX_REGISTRO]
        buffer.seek(0)
        buffer.truncate()
        try:
            canal.write(json.dumps(mensaje, ensure_ascii=False) + '\n')
        except (TypeError, ValueError):
            canal.write(json.dumps({'error': f'Tu función devolvió algo que no se puede enviar: {mensaje.get("accion")!r}',
                                    'registro': ''}, ensure_ascii=False) + '\n')
        canal.flush()

    def error_legible(exc):
        lineas = traceback.format_exception(type(exc), exc, exc.__traceback__)
        # Solo las líneas del código del alumno (main.py) y el mensaje final
        utiles = [l for l in lineas if 'main.py' in l or not l.startswith('  File')]
        return ''.join(utiles[-6:]).strip()

    with open(ruta_codigo, encoding='utf-8') as f:
        codigo = f.read()

    espacio = {'__name__': '__piloto__'}
    try:
        exec(compile(codigo, 'main.py', 'exec'), espacio)
    except BaseException as exc:  # noqa: BLE001 - también SystemExit
        enviar({'error': error_legible(exc)})
        return

    piloto = espacio.get('piloto')
    if not callable(piloto):
        enviar({'error': 'No has definido la función `piloto(sensores)`'})
        return

    enviar({'listo': True})

    for linea in entrada:
        try:
            sensores = json.loads(linea)['sensores']
        except (ValueError, KeyError):
            return
        try:
            accion = piloto(sensores)
        except BaseException as exc:  # noqa: BLE001
            enviar({'error': error_legible(exc)})
            return
        enviar({'accion': accion})


if __name__ == '__main__':
    main(sys.argv[1])
