# -*- coding: utf-8 -*-
"""
Proceso del PILOTO: aquí (y solo aquí) se ejecuta el código del alumno.

Protocolo con el motor, una línea JSON por mensaje:
  piloto → motor   {"listo": true, "registro": "..."}          al cargar el código
  motor  → piloto  {"sensores": {...}}                          llama a funcion(sensores)
  motor  → piloto  {"args": [a, b, ...]}                        llama a funcion(a, b, ...)
  motor  → piloto  {"lote": [[a, b], [c, d], ...]}              una llamada por elemento
  motor  → piloto  {"remoto": {"atributos": {...}, "metodos": [...]}}
                                                                llama a funcion(objeto_remoto)
  piloto → motor   {"accion": ..., "registro": "..."}           respuesta (sensores, args, remoto)
  piloto → motor   {"acciones": [...], "registro": "..."}       respuesta de un lote
  piloto → motor   {"consulta": {"metodo": m, "args": [...]}}   el objeto remoto pregunta al motor...
  motor  → piloto  {"respuesta": ...} | {"excepcion": "...", "tipo": "Alarma"}   ...y el motor contesta
  piloto → motor   {"error": "...", "registro": "..."}          si algo falla

El motor y el estado de la simulación viven en OTRO proceso: el alumno solo recibe
lo que le envía el motor y solo puede devolver una respuesta (o hacer consultas).
"""

import io
import json
import os
import sys
import traceback

MAX_REGISTRO = 400  # caracteres de print() que se devuelven por mensaje


class Alarma(Exception):
    """La lanza un objeto remoto cuando el motor lo indica (por ejemplo, intentos agotados)."""


class _CanalCerrado(BaseException):
    """El motor cerró la comunicación: hay que terminar sin más."""


def main(ruta_codigo, nombre_funcion='piloto'):
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
            if 'consulta' in mensaje:
                raise TypeError(f'No se puede enviar {mensaje["consulta"].get("args")!r}: usa números, textos, listas o diccionarios')
            devuelto = mensaje.get('accion', mensaje.get('acciones'))
            canal.write(json.dumps({'error': f'Tu función devolvió algo que no se puede enviar: {devuelto!r}',
                                    'registro': ''}, ensure_ascii=False) + '\n')
        canal.flush()

    def recibir():
        linea = entrada.readline()
        if not linea:
            raise _CanalCerrado()
        return json.loads(linea)

    def error_legible(exc):
        lineas = traceback.format_exception(type(exc), exc, exc.__traceback__)
        # Solo las líneas del código del alumno (main.py) y el mensaje final
        utiles = [l for l in lineas if 'main.py' in l or not l.startswith('  File')]
        return ''.join(utiles[-6:]).strip()

    def consultar(metodo, args):
        enviar({'consulta': {'metodo': metodo, 'args': list(args)}})
        respuesta = recibir()
        if 'excepcion' in respuesta:
            raise Alarma(respuesta['excepcion'])
        return respuesta.get('respuesta')

    class Remoto:
        """Objeto que recibe el alumno: datos públicos y métodos que preguntan al motor."""

        def __init__(self, atributos, metodos):
            for nombre, valor in atributos.items():
                object.__setattr__(self, nombre, valor)
            for nombre in metodos:
                object.__setattr__(self, nombre, self._metodo(nombre))

        @staticmethod
        def _metodo(nombre):
            return lambda *args: consultar(nombre, args)

        def __repr__(self):
            publicos = {k: v for k, v in vars(self).items() if not callable(v)}
            return f'<{nombre_funcion}: {publicos}>'

    with open(ruta_codigo, encoding='utf-8') as f:
        codigo = f.read()

    espacio = {'__name__': '__piloto__', 'Alarma': Alarma}
    try:
        exec(compile(codigo, 'main.py', 'exec'), espacio)
    except BaseException as exc:  # noqa: BLE001 - también SystemExit
        enviar({'error': error_legible(exc)})
        return

    funcion = espacio.get(nombre_funcion)
    if not callable(funcion):
        firma = 'piloto(sensores)' if nombre_funcion == 'piloto' else nombre_funcion
        enviar({'error': f'No has definido la función `{firma}`'})
        return

    enviar({'listo': True})

    while True:
        try:
            mensaje = recibir()
        except (ValueError, _CanalCerrado):
            return
        try:
            if 'lote' in mensaje:
                acciones = []
                for args in mensaje['lote']:
                    try:
                        acciones.append(funcion(*args))
                    except _CanalCerrado:
                        return
                    except BaseException as exc:  # noqa: BLE001
                        con = ', '.join(repr(a) for a in args)
                        enviar({'error': f'Al llamar a {nombre_funcion}({con}):\n{error_legible(exc)}'})
                        return
                enviar({'acciones': acciones})
                continue
            if 'args' in mensaje:
                accion = funcion(*mensaje['args'])
            elif 'remoto' in mensaje:
                remoto = mensaje['remoto']
                accion = funcion(Remoto(remoto.get('atributos', {}), remoto.get('metodos', [])))
            else:
                accion = funcion(mensaje['sensores'])
        except _CanalCerrado:
            return
        except BaseException as exc:  # noqa: BLE001
            enviar({'error': error_legible(exc)})
            return
        enviar({'accion': accion})


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'piloto')
