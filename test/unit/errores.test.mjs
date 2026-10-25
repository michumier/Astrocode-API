// Pruebas unitarias de la clasificación de errores (sobre el JS compilado: npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { clasificarError, tipoExcepcion } = require('../../dist/services/errores.js');

const ejecucion = (id, stderr = '') => ({ stdout: '', stderr, compile_output: '', status: { id, description: '' }, time: '0', memory: 0 });

const TRACEBACK = `Traceback (most recent call last):
  File "/tmp/run-abc/main.py", line 3, in <module>
    print(x)
NameError: name 'x' is not defined`;

test('tipoExcepcion extrae el tipo de la última línea', () => {
  assert.equal(tipoExcepcion(TRACEBACK), 'NameError');
  assert.equal(tipoExcepcion('  File "main.py", line 1\n    def f(\n         ^\nSyntaxError: unexpected EOF while parsing'), 'SyntaxError');
  assert.equal(tipoExcepcion('IndentationError: expected an indented block'), 'IndentationError');
  assert.equal(tipoExcepcion('ZeroDivisionError: division by zero'), 'ZeroDivisionError');
  assert.equal(tipoExcepcion('RecursionError: maximum recursion depth exceeded'), 'RecursionError');
  assert.equal(tipoExcepcion('KeyboardInterrupt'), 'KeyboardInterrupt');
  assert.equal(tipoExcepcion('json.decoder.JSONDecodeError: Expecting value'), 'JSONDecodeError');
  assert.equal(tipoExcepcion('Traceback...\nMemoryError'), 'LimiteMemoria');
  assert.equal(tipoExcepcion('algo raro sin excepción'), null);
  assert.equal(tipoExcepcion(''), null);
});

test('clasificarError', () => {
  assert.equal(clasificarError(ejecucion(3), true, true), null);
  assert.equal(clasificarError(ejecucion(5), false, false), 'Timeout');
  assert.equal(clasificarError(ejecucion(6, TRACEBACK), false, false), 'NameError');
  assert.equal(clasificarError(ejecucion(6, 'sin traceback'), false, false), 'ErrorDeEjecucion');
  assert.equal(clasificarError(ejecucion(3), false, true), 'TestsFallidos');
  assert.equal(clasificarError(ejecucion(3), false, false), 'SalidaIncorrecta');
});
