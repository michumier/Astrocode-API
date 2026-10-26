// Fase 3: caja negra (ejecución paso a paso)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, codigoError, nuevoAlumno, retoPorTitulo } from './helpers.mjs';

const CAMPOS = 'pasos totalPasos salida error truncado';
const TRAZAR = `mutation($c:String!,$s:String){ trazarEjecucion(codigo:$c, stdin:$s){ ${CAMPOS} } }`;
const TRAZAR_TEST = `mutation($id:ID!,$c:String!,$i:Int!){ trazarTest(tareaId:$id, codigo:$c, indiceTest:$i){ ${CAMPOS} } }`;

const alumno = await nuevoAlumno();
const T = alumno.token;

test('trazarEjecucion exige sesión', async () => {
  assert.equal(codigoError(await gql(TRAZAR, { c: 'x = 1' })), 'UNAUTHENTICATED');
});

test('bucle for: líneas en orden y variables que cambian', async () => {
  const r = (await gql(TRAZAR, { c: 'total = 0\nfor i in range(3):\n    total += i\nprint(total)\n' }, T)).data.trazarEjecucion;
  assert.equal(r.salida, '3\n');
  assert.equal(r.error, null);
  assert.equal(r.truncado, false);
  const pasos = JSON.parse(r.pasos);
  assert.equal(pasos.length, r.totalPasos);
  assert.deepEqual(pasos.filter((p) => p.evento === 'line').map((p) => p.linea), [1, 2, 3, 2, 3, 2, 3, 2, 4]);
  assert.equal(pasos.at(-1).pila[0].vars.total.r, '3');
});

test('recursión: la pila crece y decrece', async () => {
  const codigo = 'def suma(n):\n    if n == 0:\n        return 0\n    return n + suma(n - 1)\nr = suma(3)\n';
  const pasos = JSON.parse((await gql(TRAZAR, { c: codigo }, T)).data.trazarEjecucion.pasos);
  const profundidades = pasos.map((p) => p.pila.length);
  assert.equal(Math.max(...profundidades), 5);
  assert.equal(profundidades.at(-1), 1);
  assert.equal(pasos.at(-1).pila[0].vars.r.r, '6');
});

test('bucle infinito: se corta en 1000 pasos sin colgarse', async () => {
  const inicio = Date.now();
  const r = (await gql(TRAZAR, { c: 'while True:\n    pass\n' }, T)).data.trazarEjecucion;
  assert.equal(r.truncado, true);
  assert.equal(r.totalPasos, 1000);
  assert.ok(Date.now() - inicio < 5000);
});

test('excepción: queda marcada en su paso y en el error', async () => {
  const r = (await gql(TRAZAR, { c: 'x = {}\ny = x["falta"]\n' }, T)).data.trazarEjecucion;
  assert.match(r.error, /KeyError/);
  const exc = JSON.parse(r.pasos).find((p) => p.evento === 'exception');
  assert.equal(exc.linea, 2);
});

test('stdin', async () => {
  const r = (await gql(TRAZAR, { c: 'n = int(input())\nprint(n * 2)\n', s: '21\n' }, T)).data.trazarEjecucion;
  assert.equal(r.salida, '42\n');
});

test('trazarTest: ejecuta un test visible contra el código del alumno', async () => {
  const reto = await retoPorTitulo(T, 'Validar Paréntesis');
  const codigo = 'def es_valido(cadena):\n    pila = []\n    for c in cadena:\n        pila.append(c)\n    return len(pila) % 2 == 0\n';
  const r = (await gql(TRAZAR_TEST, { id: reto.id, c: codigo, i: 1 }, T)).data.trazarTest;
  assert.equal(r.error, null);
  assert.equal(r.salida.trim(), 'True'); // el test visible 2 es es_valido("(]"), que debería dar False
  const pasos = JSON.parse(r.pasos);
  const dentro = pasos.filter((p) => p.pila.at(-1).funcion === 'es_valido');
  assert.ok(dentro.length > 0);
  assert.equal(dentro[0].pila.at(-1).vars.cadena.r, "'(]'");
});

test('trazarTest: solo tests visibles, no misiones y con sesión', async () => {
  const reto = await retoPorTitulo(T, 'Validar Paréntesis'); // 2 visibles y 4 ocultos
  assert.equal(codigoError(await gql(TRAZAR_TEST, { id: reto.id, c: 'x=1', i: 2 }, T)), 'BAD_USER_INPUT');
  assert.equal(codigoError(await gql(TRAZAR_TEST, { id: reto.id, c: 'x=1', i: -1 }, T)), 'BAD_USER_INPUT');
  assert.equal(codigoError(await gql(TRAZAR_TEST, { id: reto.id, c: 'x=1', i: 0 })), 'UNAUTHENTICATED');
  const mision = (await gql(`{ tareasPorNivel(nivelId: 1){ id tipo } }`, {}, T)).data.tareasPorNivel.find((t) => t.tipo === 'pilotaje');
  assert.equal(codigoError(await gql(TRAZAR_TEST, { id: mision.id, c: 'x=1', i: 0 }, T)), 'BAD_USER_INPUT');
});
