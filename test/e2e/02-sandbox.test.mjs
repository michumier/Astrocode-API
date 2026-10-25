import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, codigoError, nuevoAlumno, ejecutar } from './helpers.mjs';

const alumno = await nuevoAlumno();
const T = alumno.token;

test('executeCode exige sesión', async () => {
  const r = await gql(`mutation{ executeCode(input:{sourceCode:"print(1)"}){ stdout } }`);
  assert.equal(codigoError(r), 'UNAUTHENTICATED');
});

test('ejecuta código normal', async () => {
  const x = await ejecutar(T, 'print(sum([1, 2, 3]))');
  assert.equal(x.stdout.trim(), '6');
});

test('el runner no llega a MySQL', async () => {
  const x = await ejecutar(T, 'import socket\ntry:\n  socket.create_connection(("mysql-db",3306),timeout=2); print("CONECTA")\nexcept Exception as e: print("BLOQUEADO")');
  assert.match(x.stdout, /BLOQUEADO/);
});

test('el runner no tiene internet', async () => {
  const x = await ejecutar(T, 'import urllib.request\ntry:\n  urllib.request.urlopen("http://example.com",timeout=3); print("INTERNET")\nexcept Exception: print("SIN_RED")');
  assert.match(x.stdout, /SIN_RED/);
});

test('sin root, solo lectura y sin variables de entorno heredadas', async () => {
  const x = await ejecutar(T, 'import os\nprint(os.getuid())\ntry:\n  open("/app/x.txt","w"); print("ESCRIBE")\nexcept Exception: print("SOLO_LECTURA")\nprint("JWT_SECRET" in os.environ, "DB_PASSWORD" in os.environ)');
  const [uid, escritura, secretos] = x.stdout.trim().split('\n');
  assert.notEqual(uid, '0');
  assert.equal(escritura, 'SOLO_LECTURA');
  assert.equal(secretos, 'False False');
});

test('bucle infinito → Time Limit Exceeded', async () => {
  const x = await ejecutar(T, 'while True: pass');
  assert.equal(x.status.description, 'Time Limit Exceeded');
});

test('bomba de memoria cortada', async () => {
  const x = await ejecutar(T, 'a = "x" * (1024**3)');
  assert.notEqual(x.status.description, 'Accepted');
});

test('fork bomb limitada y la API sigue viva', async () => {
  const x = await ejecutar(T, 'import os\nn=0\ntry:\n  while True:\n    pid=os.fork()\n    if pid==0:\n      import time; time.sleep(3); os._exit(0)\n    n+=1\nexcept Exception: print("LIMITADO")');
  assert.match(x.stdout, /LIMITADO/);
  const r = await gql('{ hello }');
  assert.equal(r.data.hello, 'Hello World!');
});
