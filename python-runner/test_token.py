# -*- coding: utf-8 -*-
"""Con RUNNER_TOKEN, el runner solo atiende a quien lo envía (/health queda abierto). python -m unittest test_token"""

import os
import unittest

os.environ['RUNNER_TOKEN'] = 'token-de-prueba'
import runner  # noqa: E402  (lee RUNNER_TOKEN al importarse)


class Token(unittest.TestCase):
    def setUp(self):
        self.cliente = runner.app.test_client()

    def test_sin_token(self):
        r = self.cliente.post('/mutate', json={'code': 'x = 1'})
        self.assertEqual(r.status_code, 401)

    def test_token_incorrecto(self):
        r = self.cliente.post('/mutate', json={'code': 'x = 1'}, headers={'Authorization': 'Bearer otro'})
        self.assertEqual(r.status_code, 401)

    def test_token_correcto(self):
        r = self.cliente.post('/mutate', json={'code': 'x = 1 + 2\n'}, headers={'Authorization': 'Bearer token-de-prueba'})
        self.assertEqual(r.status_code, 200)

    def test_health_sin_token(self):
        self.assertEqual(self.cliente.get('/health').status_code, 200)


if __name__ == '__main__':
    unittest.main()
