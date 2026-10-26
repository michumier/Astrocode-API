# -*- coding: utf-8 -*-
"""
Proceso de la CAJA NEGRA: ejecuta el código del alumno con sys.settrace y registra,
paso a paso, la línea que se ejecuta y las variables de cada nivel de la pila.

Solo se registran las líneas del archivo del alumno (main.py). Si se pasa un test (test.py),
se ejecuta después y se registran las llamadas que haga a las funciones del alumno.

Uso: python -I -B trazador_harness.py main.py [test.py] entrada.txt max_pasos
El resultado se escribe como un único JSON por el stdout original.
"""

import io
import json
import os
import sys
import traceback
import types

MAX_BYTES = 1_000_000      # tamaño máximo de la traza
MAX_TEXTO = 200            # caracteres por valor
MAX_ELEMENTOS = 50         # elementos por lista / diccionario
MAX_ATRIBUTOS = 20
MAX_PROFUNDIDAD = 3
MAX_SALIDA = 64 * 1024

ARCHIVO_ALUMNO = 'main.py'


def recortar(texto):
    return texto if len(texto) <= MAX_TEXTO else texto[:MAX_TEXTO] + '…'


def repr_seguro(valor):
    try:
        return recortar(repr(valor))
    except Exception:  # noqa: BLE001 - un __repr__ roto del alumno no debe tumbar la traza
        return '<sin representación>'


def serializar(valor, profundidad=0, vistos=None):
    """Convierte un valor de Python en algo pequeño y seguro para enviar como JSON."""
    if valor is None or isinstance(valor, (bool, int, float)):
        return {'t': type(valor).__name__, 'r': repr_seguro(valor)}
    if isinstance(valor, str):
        return {'t': 'str', 'r': repr_seguro(valor)}

    vistos = vistos or set()
    if id(valor) in vistos:
        return {'t': 'ref', 'r': '↺ (referencia circular)'}
    if profundidad >= MAX_PROFUNDIDAD:
        return {'t': type(valor).__name__, 'r': repr_seguro(valor)}
    vistos = vistos | {id(valor)}

    if isinstance(valor, (list, tuple, set, frozenset)) or type(valor).__name__ == 'deque':
        elementos = list(valor) if not isinstance(valor, (set, frozenset)) else sorted(valor, key=repr_seguro)
        return {
            't': type(valor).__name__,
            'id': id(valor),
            'longitud': len(elementos),
            'elementos': [serializar(x, profundidad + 1, vistos) for x in elementos[:MAX_ELEMENTOS]],
        }
    if isinstance(valor, dict):
        items = list(valor.items())
        return {
            't': 'dict',
            'id': id(valor),
            'longitud': len(items),
            'items': [[serializar(k, profundidad + 1, vistos), serializar(v, profundidad + 1, vistos)] for k, v in items[:MAX_ELEMENTOS]],
        }
    if hasattr(valor, '__dict__') and not isinstance(valor, (type, types.ModuleType, types.FunctionType, types.MethodType)):
        atributos = {k: v for k, v in vars(valor).items() if not k.startswith('__')}
        return {
            't': 'obj',
            'clase': type(valor).__name__,
            'id': id(valor),
            'atributos': {k: serializar(v, profundidad + 1, vistos) for k, v in list(atributos.items())[:MAX_ATRIBUTOS]},
        }
    return {'t': type(valor).__name__, 'r': repr_seguro(valor)}


def es_variable_visible(nombre, valor):
    if nombre.startswith('__'):
        return False
    return not isinstance(valor, (types.ModuleType, types.FunctionType, type, types.BuiltinFunctionType))


def main(ruta_codigo, ruta_test, ruta_entrada, max_pasos):
    canal = os.fdopen(os.dup(1), 'w', encoding='utf-8')
    nulo = os.open(os.devnull, os.O_WRONLY)
    os.dup2(nulo, 1)
    salida = io.StringIO()
    sys.stdout = salida
    with open(ruta_entrada, encoding='utf-8') as f:
        sys.stdin = io.StringIO(f.read())

    pasos = []
    estado = {'bytes': 0, 'truncado': False}

    def terminar(error=None):
        sys.settrace(None)
        resultado = {
            'pasos': pasos,
            'salida': salida.getvalue()[:MAX_SALIDA],
            'error': error,
            'truncado': estado['truncado'],
        }
        canal.write(json.dumps(resultado, ensure_ascii=False))
        canal.flush()
        os._exit(0)

    def pila(frame):
        niveles = []
        while frame is not None and frame.f_code.co_filename == ARCHIVO_ALUMNO:
            nombre = frame.f_code.co_name
            variables = {k: serializar(v) for k, v in list(frame.f_locals.items()) if es_variable_visible(k, v)}
            niveles.append({'funcion': '<programa>' if nombre == '<module>' else nombre, 'linea': frame.f_lineno, 'vars': variables})
            frame = frame.f_back
        niveles.reverse()  # de fuera hacia dentro
        return niveles

    def registrar(frame, evento, arg):
        paso = {'linea': frame.f_lineno, 'evento': evento, 'pila': pila(frame), 'salida': len(salida.getvalue())}
        if evento == 'return':
            paso['retorno'] = serializar(arg)
        elif evento == 'exception':
            tipo, valor, _ = arg
            paso['excepcion'] = recortar(f'{tipo.__name__}: {valor}')
        tamano = len(json.dumps(paso, ensure_ascii=False))
        if len(pasos) >= max_pasos or estado['bytes'] + tamano > MAX_BYTES:
            estado['truncado'] = True
            terminar()
        estado['bytes'] += tamano
        pasos.append(paso)

    def traza(frame, evento, arg):
        if frame.f_code.co_filename != ARCHIVO_ALUMNO:
            return None
        if evento in ('line', 'return', 'exception'):
            registrar(frame, evento, arg)
        return traza

    def error_legible(exc):
        lineas = traceback.format_exception(type(exc), exc, exc.__traceback__)
        utiles = [l for l in lineas if ARCHIVO_ALUMNO in l or 'test.py' in l or not l.startswith('  File')]
        return recortar(''.join(utiles[-6:]).strip()) if utiles else repr_seguro(exc)

    with open(ruta_codigo, encoding='utf-8') as f:
        codigo = f.read()
    test = None
    if ruta_test:
        with open(ruta_test, encoding='utf-8') as f:
            test = f.read()

    espacio = {'__name__': '__main__'}
    try:
        compilado = compile(codigo, ARCHIVO_ALUMNO, 'exec')
        compilado_test = compile(test, 'test.py', 'exec') if test else None
    except SyntaxError as exc:
        terminar(f'SyntaxError en la línea {exc.lineno}: {exc.msg}')

    sys.settrace(traza)
    try:
        exec(compilado, espacio)
        if compilado_test:
            exec(compilado_test, espacio)
    except BaseException as exc:  # noqa: BLE001
        terminar(error_legible(exc))
    terminar()


if __name__ == '__main__':
    argumentos = sys.argv[1:]
    main(argumentos[0], argumentos[1] or None, argumentos[2], int(argumentos[3]))
