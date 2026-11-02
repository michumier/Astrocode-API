# -*- coding: utf-8 -*-
"""
Lanza un script de Python con un «audit hook» que prohíbe lo que el código de un alumno nunca necesita.

Uso: python -I -B aislador.py script.py [argumentos...]

En Docker, el contenedor ya no tiene red y es de solo lectura. En la nube (Vercel) no hay contenedor,
así que esta capa evita que el código del alumno:
  - abra conexiones de red (sockets);
  - lance otros programas (subprocess, os.system, exec, fork…);
  - cargue código nativo con ctypes (la vía habitual para saltarse los audit hooks);
  - lea /proc o /sys (p. ej. las variables de entorno de otros procesos);
  - mate al proceso que lo vigila.

Un audit hook no se puede quitar una vez puesto. No es un sandbox perfecto: se suma a los límites
de CPU, memoria y procesos de sandbox.py.
"""

import os
import sys
import traceback

PROHIBIDOS = (
    'socket.', 'subprocess.', 'os.system', 'os.exec', 'os.posix_spawn', 'os.spawn',
    'os.fork', 'os.forkpty', 'pty.spawn', 'ctypes.', 'os.kill', 'os.killpg', 'signal.pthread_kill',
    'winreg.', 'sys.remote_exec',
)
MODULOS_PROHIBIDOS = {'ctypes', '_ctypes'}
RUTAS_PROHIBIDAS = ('/proc', '/sys')


def _ruta(arg):
    if isinstance(arg, int):
        return ''
    try:
        return os.path.abspath(os.fsdecode(arg))
    except (TypeError, ValueError):
        return ''


def _vigilante(evento, args):
    if evento.startswith(PROHIBIDOS):
        raise PermissionError(f'AstroCode no permite esta operación ({evento})')
    if evento == 'import' and args and args[0] in MODULOS_PROHIBIDOS:
        raise ImportError(f'AstroCode no permite importar {args[0]}')
    if evento in ('open', 'os.listdir', 'os.scandir') and args:
        ruta = _ruta(args[0])
        if ruta.startswith(RUTAS_PROHIBIDAS):
            raise PermissionError(f'AstroCode no permite acceder a {ruta}')


_script = ''


def _sin_marco_del_aislador(tipo, valor, tb):
    # La traza empieza en el script del alumno, igual que si se hubiera lanzado directamente
    inicio = tb
    while inicio is not None and inicio.tb_frame.f_code.co_filename != _script:
        inicio = inicio.tb_next
    traceback.print_exception(tipo, valor, inicio if inicio is not None else tb)


def main():
    global _script
    script = _script = os.path.abspath(sys.argv[1])
    sys.argv = sys.argv[1:]
    with open(script, encoding='utf-8') as f:
        codigo = compile(f.read(), script, 'exec')
    sys.excepthook = _sin_marco_del_aislador
    sys.addaudithook(_vigilante)
    exec(codigo, {'__name__': '__main__', '__file__': script, '__builtins__': __builtins__})


if __name__ == '__main__':
    main()
