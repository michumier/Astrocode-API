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
import resource
import shutil
import subprocess
import sys
import tempfile

from flask import Flask, jsonify, request

app = Flask(__name__)

TIMEOUT_SEGUNDOS = int(os.environ.get('RUNNER_TIMEOUT', '5'))
MEMORIA_MAX_MB = int(os.environ.get('RUNNER_MEMORY_MB', '256'))
MAX_CODIGO = 20_000          # caracteres
MAX_SALIDA = 64 * 1024       # caracteres devueltos de stdout/stderr


def limitar_recursos():
    """Se ejecuta en el proceso hijo justo antes de lanzar el código del alumno."""
    memoria = MEMORIA_MAX_MB * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_CPU, (TIMEOUT_SEGUNDOS, TIMEOUT_SEGUNDOS + 1))
    resource.setrlimit(resource.RLIMIT_AS, (memoria, memoria))
    resource.setrlimit(resource.RLIMIT_FSIZE, (1024 * 1024, 1024 * 1024))  # archivos de 1 MB máx.
    resource.setrlimit(resource.RLIMIT_NPROC, (64, 64))                   # evita fork bombs
    resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
    os.setsid()


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
                env={'PYTHONIOENCODING': 'utf-8', 'HOME': workdir, 'PATH': '/usr/local/bin:/usr/bin'},
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


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'python-runner', 'version': '2.0.0'})


if __name__ == '__main__':
    # Solo para desarrollo fuera de Docker; en el contenedor se usa gunicorn
    app.run(host='0.0.0.0', port=5000, debug=False)
