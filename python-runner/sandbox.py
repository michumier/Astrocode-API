# -*- coding: utf-8 -*-
"""Límites que se aplican a cualquier proceso que ejecute código de un alumno."""

import os

try:
    import resource  # solo existe en Linux (dentro del contenedor)
except ImportError:  # pragma: no cover - en Windows no hay límites (solo para desarrollo)
    resource = None

TIMEOUT_SEGUNDOS = int(os.environ.get('RUNNER_TIMEOUT', '5'))
MEMORIA_MAX_MB = int(os.environ.get('RUNNER_MEMORY_MB', '256'))


def entorno_limpio(directorio):
    """Variables de entorno mínimas: nada de secretos heredados."""
    return {'PYTHONIOENCODING': 'utf-8', 'HOME': directorio, 'PATH': '/usr/local/bin:/usr/bin'}


def creador_de_limites(cpu_segundos=TIMEOUT_SEGUNDOS):
    """Devuelve la función que se ejecuta en el proceso hijo justo antes de lanzar el código."""

    def limitar_recursos():
        if resource is None:
            return
        memoria = MEMORIA_MAX_MB * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_CPU, (cpu_segundos, cpu_segundos + 1))
        resource.setrlimit(resource.RLIMIT_AS, (memoria, memoria))
        resource.setrlimit(resource.RLIMIT_FSIZE, (1024 * 1024, 1024 * 1024))  # archivos de 1 MB máx.
        resource.setrlimit(resource.RLIMIT_NPROC, (64, 64))                   # evita fork bombs
        resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
        os.setsid()

    return limitar_recursos


limitar_recursos = creador_de_limites()
