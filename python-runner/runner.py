#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor Flask para ejecutar código Python de forma segura
"""

import os
import tempfile
import subprocess
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permitir CORS para el frontend

@app.route('/run', methods=['POST'])
def run_code():
    """
    Endpoint para ejecutar código Python
    Recibe: { "code": "código_python" }
    Devuelve: { "stdout": "salida", "stderr": "errores", "exit_code": 0 }
    """
    try:
        # Obtener el código del request
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({
                'stdout': '',
                'stderr': 'Error: No se proporcionó código para ejecutar',
                'exit_code': 1
            }), 400
        
        code = data['code']
        
        # Crear archivo temporal para el código
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(code)
            temp_file_path = temp_file.name
        
        try:
            # Ejecutar el código con timeout de 5 segundos
            result = subprocess.run(
                ['python', temp_file_path],
                capture_output=True,
                text=True,
                timeout=5,
                cwd=tempfile.gettempdir()  # Ejecutar en directorio temporal por seguridad
            )
            
            # Preparar respuesta
            response = {
                'stdout': result.stdout,
                'stderr': result.stderr,
                'exit_code': result.returncode
            }
            
            return jsonify(response)
            
        except subprocess.TimeoutExpired:
            # Manejar timeout
            return jsonify({
                'stdout': '',
                'stderr': 'Error: El código tardó más de 5 segundos en ejecutarse (timeout)',
                'exit_code': 124  # Código estándar para timeout
            })
            
        except Exception as e:
            # Manejar otros errores de ejecución
            return jsonify({
                'stdout': '',
                'stderr': f'Error interno al ejecutar el código: {str(e)}',
                'exit_code': 1
            })
            
        finally:
            # Eliminar archivo temporal
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass  # Ignorar errores al eliminar el archivo temporal
                
    except Exception as e:
        # Manejar errores generales
        return jsonify({
            'stdout': '',
            'stderr': f'Error del servidor: {str(e)}',
            'exit_code': 1
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint de salud para verificar que el servicio está funcionando
    """
    return jsonify({
        'status': 'healthy',
        'service': 'python-runner',
        'version': '1.0.0'
    })

if __name__ == '__main__':
    print("🐍 Iniciando servidor Python Runner...")
    print("📡 Servidor disponible en http://localhost:5000")
    print("🔗 Endpoint: POST /run")
    print("💚 Health check: GET /health")
    
    # Ejecutar servidor Flask
    app.run(
        host='0.0.0.0',  # Permitir conexiones desde cualquier IP
        port=5000,
        debug=False  # Desactivar debug en producción
    )