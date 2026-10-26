# -*- coding: utf-8 -*-
"""Lanza la caja negra (trazador_harness.py) en un proceso aislado y devuelve la traza."""

import json
import os
import shutil
import subprocess
import sys
import tempfile

from sandbox import creador_de_limites, entorno_limpio

HARNESS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trazador_harness.py')
MAX_PASOS = int(os.environ.get('TRAZA_MAX_PASOS', '1000'))
TIEMPO_MAXIMO = 10  # segundos (reloj)
CPU_MAXIMA = 6      # segundos de CPU (trazar es más lento que ejecutar)


def trazar(codigo, entrada='', codigo_test=None, max_pasos=MAX_PASOS):
    directorio = tempfile.mkdtemp(prefix='traza-')
    try:
        rutas = {}
        for nombre, contenido in (('main.py', codigo), ('test.py', codigo_test), ('entrada.txt', entrada or '')):
            if contenido is None:
                continue
            rutas[nombre] = os.path.join(directorio, nombre)
            with open(rutas[nombre], 'w', encoding='utf-8') as f:
                f.write(contenido)
        try:
            proceso = subprocess.run(
                [sys.executable, '-I', '-B', HARNESS, rutas['main.py'], rutas.get('test.py', ''),
                 rutas['entrada.txt'], str(max_pasos)],
                capture_output=True, timeout=TIEMPO_MAXIMO, cwd=directorio,
                env=entorno_limpio(directorio), preexec_fn=creador_de_limites(CPU_MAXIMA),
            )
        except subprocess.TimeoutExpired:
            return {'pasos': [], 'salida': '', 'truncado': True,
                    'error': f'El programa tardó más de {TIEMPO_MAXIMO} segundos (¿un input() o un sleep?)'}
        try:
            return json.loads(proceso.stdout.decode('utf-8', errors='replace'))
        except ValueError:
            return {'pasos': [], 'salida': '', 'truncado': True,
                    'error': 'La ejecución se cortó por superar el límite de tiempo o de memoria'}
    finally:
        shutil.rmtree(directorio, ignore_errors=True)
