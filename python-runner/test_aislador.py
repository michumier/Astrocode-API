# -*- coding: utf-8 -*-
"""Pruebas de aislador.py: lo normal funciona y lo peligroso se bloquea. python -m unittest test_aislador"""

import os
import subprocess
import tempfile
import unittest

from sandbox import comando


def ejecutar(codigo, entrada=''):
    with tempfile.TemporaryDirectory() as directorio:
        ruta = os.path.join(directorio, 'main.py')
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write(codigo)
        r = subprocess.run(comando(ruta), input=entrada, capture_output=True, text=True,
                           encoding='utf-8', timeout=20, cwd=directorio)
        return r.returncode, r.stdout, r.stderr


class Aislador(unittest.TestCase):
    def test_codigo_normal(self):
        codigo, salida, _ = ejecutar('import math, json, random\nnombre = input()\nprint(f"Hola {nombre}", math.sqrt(16))', 'Ada\n')
        self.assertEqual(codigo, 0)
        self.assertEqual(salida.strip(), 'Hola Ada 4.0')

    def test_name_main_y_argv(self):
        _, salida, _ = ejecutar('import sys\nif __name__ == "__main__":\n    print(sys.argv[0].endswith("main.py"))')
        self.assertEqual(salida.strip(), 'True')

    def test_traza_empieza_en_el_codigo_del_alumno(self):
        codigo, _, error = ejecutar('x = 1\nprint(y)\n')
        self.assertEqual(codigo, 1)
        self.assertIn('main.py", line 2', error)
        self.assertIn("NameError: name 'y' is not defined", error)
        self.assertNotIn('aislador', error)

    def test_sin_red(self):
        _, salida, _ = ejecutar('import socket\ntry:\n    socket.socket()\n    print("RED")\nexcept PermissionError:\n    print("BLOQUEADO")')
        self.assertEqual(salida.strip(), 'BLOQUEADO')

    def test_sin_otros_procesos(self):
        _, salida, _ = ejecutar(
            'import os, subprocess\nr = []\n'
            'for f in (lambda: subprocess.run(["ls"]), lambda: os.system("ls"), lambda: os.fork() if hasattr(os, "fork") else os.system("x")):\n'
            '    try:\n        f(); r.append("SI")\n    except PermissionError:\n        r.append("NO")\n'
            'print(",".join(r))')
        self.assertEqual(salida.strip(), 'NO,NO,NO')

    def test_sin_ctypes(self):
        _, salida, _ = ejecutar('try:\n    import ctypes\n    print("CTYPES")\nexcept ImportError:\n    print("BLOQUEADO")')
        self.assertEqual(salida.strip(), 'BLOQUEADO')

    def test_sin_proc(self):
        _, salida, _ = ejecutar('try:\n    open("/proc/self/environ").read()\n    print("LEIDO")\nexcept (PermissionError, FileNotFoundError, OSError) as e:\n    print("BLOQUEADO" if isinstance(e, PermissionError) else "NO_EXISTE")')
        self.assertIn(salida.strip(), ('BLOQUEADO', 'NO_EXISTE'))

    def test_no_se_puede_quitar_el_vigilante(self):
        _, salida, _ = ejecutar('import sys\nsys.addaudithook(lambda e, a: None)\nimport socket\ntry:\n    socket.socket()\n    print("RED")\nexcept PermissionError:\n    print("BLOQUEADO")')
        self.assertEqual(salida.strip(), 'BLOQUEADO')


if __name__ == '__main__':
    unittest.main()
