#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor Flask para ejecutar código Python de los alumnos.

Capas de aislamiento:
  - Contenedor sin red exterior, sin acceso a la BD, sistema de archivos de solo lectura
    y usuario sin privilegios (ver Dockerfile y docker-compose.yml).
  - Cada ejecución corre en un proceso aparte con límites de CPU, memoria, procesos
    y tamaño de archivos (resource.setrlimit), en un directorio temporal propio
    y sin variables de entorno heredadas.
"""

import os
import shutil
import subprocess
import sys
import tempfile

from flask import Flask, jsonify, request

from mutador import mutar
from sandbox import TIMEOUT_SEGUNDOS, MEMORIA_MAX_MB, limitar_recursos, entorno_limpio
from misiones.motor import MISIONES, ejecutar_mision, material_reto
from trazador import trazar

app = Flask(__name__)

MAX_CODIGO = 20_000          # caracteres
MAX_SALIDA = 64 * 1024       # caracteres devueltos de stdout/stderr


def recortar(texto):
    if len(texto) > MAX_SALIDA:
        return texto[:MAX_SALIDA] + '\n... (salida recortada)'
    return texto


@app.route('/run', methods=['POST'])
def run_code():
    """
    Recibe: { "code": "código_python", "stdin": "entrada opcional" }
    Devuelve: { "stdout": "salida", "stderr": "errores", "exit_code": 0 }
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data.get('code'), str):
        return jsonify({'stdout': '', 'stderr': 'Error: No se proporcionó código para ejecutar', 'exit_code': 1}), 400

    code = data['code']
    stdin = data.get('stdin') or ''
    if len(code) > MAX_CODIGO:
        return jsonify({'stdout': '', 'stderr': 'Error: el código es demasiado largo', 'exit_code': 1}), 400

    workdir = tempfile.mkdtemp(prefix='run-')
    try:
        ruta = os.path.join(workdir, 'main.py')
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write(code)

        try:
            result = subprocess.run(
                [sys.executable, '-I', '-B', ruta],  # -I: modo aislado, -B: sin .pyc
                input=stdin,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=TIMEOUT_SEGUNDOS + 1,
                cwd=workdir,
                env=entorno_limpio(workdir),
                preexec_fn=limitar_recursos,
            )
        except subprocess.TimeoutExpired:
            return jsonify({
                'stdout': '',
                'stderr': f'Error: El código tardó más de {TIMEOUT_SEGUNDOS} segundos en ejecutarse (timeout)',
                'exit_code': 124,  # Código estándar para timeout
            })

        stderr = result.stderr
        exit_code = result.returncode
        # Proceso matado por superar el tiempo de CPU (SIGXCPU) o por memoria (SIGKILL)
        if exit_code in (-24, -9):
            stderr += '\nError: tu programa superó el límite de tiempo o de memoria.'
            exit_code = 124 if exit_code == -24 else 137
        elif 'MemoryError' in stderr:
            stderr += f'\nPista: tu programa intentó usar más de {MEMORIA_MAX_MB} MB de memoria.'

        return jsonify({'stdout': recortar(result.stdout), 'stderr': recortar(stderr), 'exit_code': exit_code})

    except Exception as e:  # noqa: BLE001
        return jsonify({'stdout': '', 'stderr': f'Error del servidor: {e}', 'exit_code': 1}), 500
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


@app.route('/mutate', methods=['POST'])
def mutate():
    """
    Genera variantes saboteadas de un programa (solo lo analiza, no lo ejecuta).
    Recibe: { "code": "...", "max": 12, "semilla": 0 }
    Devuelve: { "variantes": [{ codigo, operador, descripcion, linea, lineas_cambiadas, diff }] }
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data.get('code'), str):
        return jsonify({'error': 'No se proporcionó código'}), 400
    try:
        variantes = mutar(
            data['code'],
            max_variantes=min(int(data.get('max', 12)), 50),
            semilla=int(data.get('semilla', 0)),
        )
    except SyntaxError as e:
        return jsonify({'error': f'La solución tiene un error de sintaxis: {e}'}), 400
    except (ValueError, RecursionError) as e:
        return jsonify({'error': str(e)}), 400
    return jsonify({'variantes': variantes})


@app.route('/mision', methods=['POST'])
def mision():
    """
    Ejecuta una misión de pilotaje con el código del alumno.
    Recibe: { "code": "...", "mision": "aterrizaje", "escenarios": [{semilla, params, oculto, nombre}] }
    Devuelve: { "resultados": [{ exito, motivo, ticks, estrellas, metricas, nombre, oculto,
                                 fotogramas?, registro?, escena? }] }   (los ocultos sin detalle)
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data.get('code'), str) or not isinstance(data.get('escenarios'), list):
        return jsonify({'error': 'Faltan el código o los escenarios'}), 400
    if len(data['code']) > MAX_CODIGO:
        return jsonify({'error': 'El código es demasiado largo'}), 400
    if not 1 <= len(data['escenarios']) <= 10:
        return jsonify({'error': 'Entre 1 y 10 escenarios'}), 400
    try:
        resultados = ejecutar_mision(data['code'], data.get('mision', ''), data['escenarios'])
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    return jsonify({'resultados': resultados})


@app.route('/reto/material', methods=['POST'])
def reto_material():
    """
    Material público de un reto (el manual, los ejemplos...) SIN ejecutar código del alumno.
    Recibe: { "mision": "bomba", "escenarios": [{semilla, params, nombre}] }   (solo los visibles)
    Devuelve: { "funcion": "desactivar", "material": [{ nombre, material }] }
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data.get('escenarios'), list):
        return jsonify({'error': 'Faltan los escenarios'}), 400
    if not 1 <= len(data['escenarios']) <= 10:
        return jsonify({'error': 'Entre 1 y 10 escenarios'}), 400
    try:
        material = material_reto(data.get('mision', ''), data['escenarios'])
        return jsonify({'funcion': MISIONES[data['mision']].funcion, 'material': material})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@app.route('/trace', methods=['POST'])
def trace():
    """
    Caja negra: ejecuta el código paso a paso y devuelve la traza.
    Recibe: { "code": "...", "stdin": "", "test": "código opcional que llama a las funciones del alumno" }
    Devuelve: { pasos: [{linea, evento, pila: [{funcion, linea, vars}], salida, retorno?, excepcion?}],
                salida, error, truncado }
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data.get('code'), str):
        return jsonify({'error': 'No se proporcionó código'}), 400
    if len(data['code']) > MAX_CODIGO or len(data.get('test') or '') > MAX_CODIGO:
        return jsonify({'error': 'El código es demasiado largo'}), 400
    return jsonify(trazar(data['code'], data.get('stdin') or '', data.get('test') or None))


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'python-runner', 'version': '2.0.0'})


if __name__ == '__main__':
    # Solo para desarrollo fuera de Docker; en el contenedor se usa gunicorn
    app.run(host='0.0.0.0', port=5000, debug=False)
