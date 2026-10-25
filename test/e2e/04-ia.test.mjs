// Requiere la API apuntando al servidor falso de IA (test/e2e/compose.e2e.yml)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, codigoError, nuevoAlumno, admin, enviar, retoPorTitulo } from './helpers.mjs';

const PISTA = `mutation($id:ID!,$c:String!,$n:Int){ pedirPista(tareaId:$id, codigo:$c, nivel:$n){ pista nivel restantesHoy } }`;
const GENERAR = `mutation{ generarEjercicio(tema:"contar vocales", nivelId: 1, categoriaId: 5){
  titulo descripcion codigoBase solucion resultadoEsperado
  tests { descripcion codigoTest salidaEsperada oculto } testsGenerados avisos } }`;

test('iaDisponible', async () => {
  const r = await gql('{ iaDisponible }');
  assert.equal(r.data.iaDisponible, true);
});

test('pista: requiere sesión', async () => {
  const r = await gql(PISTA, { id: '1', c: 'print(1)', n: 1 });
  assert.equal(codigoError(r), 'UNAUTHENTICATED');
});

test('pista: llega del modelo, sin razonamiento y descuenta del cupo', async () => {
  const alumno = await nuevoAlumno();
  const reto = await retoPorTitulo(alumno.token, 'Validar Paréntesis');
  const r = await gql(PISTA, { id: reto.id, c: 'def es_valido(c):\n    pass', n: 2 }, alumno.token);
  const p = r.data?.pedirPista;
  assert.ok(p, r.errors?.[0]?.message);
  assert.equal(p.nivel, 2);
  assert.match(p.pista, /auth ok/);
  assert.match(p.pista, /razonamiento off/, 'debe enviarse chat_template_kwargs.enable_thinking=false');
  const quedan = (await gql('{ pistasRestantesHoy }', {}, alumno.token)).data.pistasRestantesHoy;
  assert.equal(quedan, p.restantesHoy);
});

test('pista: si la IA suelta la solución, se filtra', async () => {
  const alumno = await nuevoAlumno();
  const reto = await retoPorTitulo(alumno.token, 'Invertir un Árbol Binario');
  const r = await gql(PISTA, { id: reto.id, c: 'FILTRAR', n: 3 }, alumno.token);
  assert.ok(r.data?.pedirPista, r.errors?.[0]?.message);
  assert.doesNotMatch(r.data.pedirPista.pista, /invertir_arbol\(raiz\.derecha\)/);
  assert.match(r.data.pedirPista.pista, /revelaba demasiado/);
});

test('generador: bloqueado a alumnos', async () => {
  const alumno = await nuevoAlumno();
  assert.equal(codigoError(await gql(GENERAR, {}, alumno.token)), 'FORBIDDEN');
});

test('generador: verifica los tests, el admin guarda y el ejercicio se puede resolver', async () => {
  const a = await admin();
  const r = await gql(GENERAR, {}, a.token);
  const g = r.data?.generarEjercicio;
  assert.ok(g, r.errors?.[0]?.message);
  assert.equal(g.testsGenerados, 4);
  assert.equal(g.tests.length, 3, 'el test mal generado se descarta');
  assert.ok(g.avisos.some((x) => x.includes('Test MAL generado')));

  const c = await gql(`mutation($i: CrearTareaInput!){ crearTarea(input:$i){ id codigoBase tipo } }`, {
    i: { categoriaId: '5', nivelId: '1', titulo: g.titulo, descripcion: g.descripcion, codigoBase: g.codigoBase,
         resultadoEsperado: g.resultadoEsperado, solucion: g.solucion, tests: g.tests },
  }, a.token);
  const nueva = c.data?.crearTarea;
  assert.ok(nueva, c.errors?.[0]?.message);
  assert.equal(nueva.codigoBase, g.codigoBase);
  assert.equal(nueva.tipo, 'codigo');

  const alumno = await nuevoAlumno();
  const res = await enviar(alumno.token, nueva.id, g.solucion);
  assert.equal(res.correcto, true);

  const t = await gql(`query($id:ID!){ tarea(id:$id){ titulo } }`, { id: nueva.id }, alumno.token);
  assert.ok(!JSON.stringify(t).includes('sum(1 for'), 'la solución no se expone por GraphQL');
});
